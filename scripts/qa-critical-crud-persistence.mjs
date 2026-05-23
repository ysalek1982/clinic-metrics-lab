import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "module-qa");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const artifactPath = path.join(artifactDir, `critical-crud-persistence-${stamp}.json`);

loadEnvFile(path.join(repoRoot, ".env.local"));
fs.mkdirSync(artifactDir, { recursive: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const result = {
  generatedAt: new Date().toISOString(),
  tenantId: null,
  actorUserId: null,
  modules: [],
  rlsAnon: {},
  status: "passed",
};

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  result.status = "blocked";
  result.blockedReason = "Faltan VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY o SUPABASE_SERVICE_ROLE_KEY.";
  writeResult();
  process.exit(0);
}

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const anon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

const context = await resolveQaContext();
result.tenantId = context.tenantId;
result.actorUserId = context.actorUserId;

await validateAnonRls([
  "patients",
  "appointments",
  "message_threads",
  "messages",
  "lab_orders",
  "lab_results",
  "food_items",
  "recipes",
  "weekly_menus",
  "pediatric_growth_records",
  "sports_profiles",
  "sports_bodycomp_snapshots",
]);

const patient = await moduleStep("Pacientes / expediente", async () => {
  const mrn = `qa_m51_${Date.now()}`;
  const inserted = await insertOne("patients", {
    tenant_id: context.tenantId,
    organization_id: context.organizationId,
    branch_id: null,
    service_id: null,
    mrn,
    first_name: "QA",
    last_name: `M51 ${stamp.slice(0, 10)}`,
    birth_date: "1990-01-01",
    sex: "female",
    status: "active",
    risk_level: "low",
    primary_pack_id: "clinical",
    active_pack_ids: ["clinical", "enteral", "parenteral", "sport", "pediatric"],
    diagnosis_summary: "QA sintético sin diagnostico clinico",
    location_label: "QA M51",
    metadata: { qa: "qa_m51_patient" },
    created_by: context.actorUserId,
    updated_by: context.actorUserId,
  });
  await audit("patient.create", "patient", inserted.id, null, { mrn });

  const updated = await updateOne("patients", inserted.id, {
    location_label: "QA M51 actualizado",
    risk_level: "moderate",
    updated_by: context.actorUserId,
    updated_at: new Date().toISOString(),
  });
  await audit("patient.update", "patient", inserted.id, { location_label: inserted.location_label }, { location_label: updated.location_label });
  await insertOne("patient_contacts", {
    tenant_id: context.tenantId,
    patient_id: inserted.id,
    type: "phone",
    name: "QA contacto",
    value: "+59100000000",
    relationship: "qa",
    is_primary: true,
  });
  return updated;
});

await moduleStep("Agenda", async () => {
  const startsAt = new Date(Date.now() + 86400000).toISOString();
  const endsAt = new Date(Date.now() + 90000000).toISOString();
  const appointment = await insertOne("appointments", {
    tenant_id: context.tenantId,
    patient_id: patient.id,
    professional_user_id: context.actorUserId,
    starts_at: startsAt,
    ends_at: endsAt,
    appointment_type: "seguimiento",
    status: "scheduled",
    modality: "presencial",
    location: "QA M51",
    notes: "QA cita sintetica M51",
    created_by: context.actorUserId,
    updated_by: context.actorUserId,
  });
  await audit("appointment.create", "appointment", appointment.id, null, { status: appointment.status });
  await updateOne("appointments", appointment.id, { status: "completed", updated_by: context.actorUserId, updated_at: new Date().toISOString() });
  await audit("appointment.completed", "appointment", appointment.id, { status: "scheduled" }, { status: "completed" });
  await updateOne("appointments", appointment.id, { status: "cancelled", updated_by: context.actorUserId, updated_at: new Date().toISOString() });
  await audit("appointment.cancelled", "appointment", appointment.id, { status: "completed" }, { status: "cancelled" });
  return appointment;
});

await moduleStep("Mensajes", async () => {
  const now = new Date().toISOString();
  const thread = await insertOne("message_threads", {
    tenant_id: context.tenantId,
    patient_id: patient.id,
    subject: `qa_m51_thread_${stamp}`,
    status: "open",
    priority: "normal",
    channel: "internal",
    last_message_at: now,
    created_by: context.actorUserId,
    assigned_to: context.actorUserId,
  });
  await audit("message_thread.create", "message_thread", thread.id, null, { subject: thread.subject });
  const message = await insertOne("messages", {
    tenant_id: context.tenantId,
    thread_id: thread.id,
    patient_id: patient.id,
    sender_user_id: context.actorUserId,
    sender_display_name: "QA Clinic",
    body: "QA mensaje sintetico M51",
    message_type: "text",
  });
  await audit("message.sent", "message", message.id, null, { thread_id: thread.id });
  await upsertOne("message_read_receipts", {
    tenant_id: context.tenantId,
    thread_id: thread.id,
    message_id: message.id,
    user_id: context.actorUserId,
    read_at: now,
  }, "thread_id,user_id");
  await audit("message_thread.read", "message_thread", thread.id, null, { message_id: message.id });
  await updateOne("message_threads", thread.id, { status: "closed", closed_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  await audit("message_thread.closed", "message_thread", thread.id, { status: "open" }, { status: "closed" });
  return { thread, message };
});

await moduleStep("Alertas", async () => {
  const acknowledgement = await upsertOne("alert_acknowledgements", {
    tenant_id: context.tenantId,
    alert_id: `qa_m51_alert_${stamp}`,
    patient_id: patient.id,
    status: "reviewed",
    note: "QA alerta revisada M51",
    source_type: "qa",
    source_id: patient.id,
    priority: "moderate",
    acknowledged_by: context.actorUserId,
    acknowledged_at: new Date().toISOString(),
    metadata: { qa: "qa_m51_alert" },
    updated_at: new Date().toISOString(),
  }, "tenant_id,alert_id");
  await audit("alert.reviewed", "alert_acknowledgements", acknowledgement.id, null, { alert_id: acknowledgement.alert_id });
  const resolved = await upsertOne("alert_acknowledgements", {
    ...acknowledgement,
    status: "resolved",
    resolved_by: context.actorUserId,
    resolved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, "tenant_id,alert_id");
  await audit("alert.resolved", "alert_acknowledgements", resolved.id, { status: "reviewed" }, { status: "resolved" });
  return resolved;
});

const lab = await moduleStep("Labs", async () => {
  const order = await insertOne("lab_orders", {
    tenant_id: context.tenantId,
    patient_id: patient.id,
    ordered_at: new Date().toISOString(),
    resulted_at: new Date().toISOString(),
    status: "resulted",
    provider: "QA M51",
    notes: "QA lab sintetico",
    created_by: context.actorUserId,
    updated_by: context.actorUserId,
  });
  const resultRow = await insertOne("lab_results", {
    tenant_id: context.tenantId,
    lab_order_id: order.id,
    patient_id: patient.id,
    marker_code: "albumin",
    marker_name: "Albumina",
    category: "Proteinas viscerales",
    value: 4.2,
    unit: "g/dL",
    reference_low: 3.5,
    reference_high: 5,
    status: "ok",
    resulted_at: new Date().toISOString(),
  });
  await audit("lab_result.create", "lab_result", resultRow.id, null, { marker_code: resultRow.marker_code });
  return { order, result: resultRow };
});

const food = await moduleStep("Foods", async () => {
  const row = await insertOne("food_items", {
    tenant_id: context.tenantId,
    name: `qa_m51_food_${stamp}`,
    source: "qa",
    source_scope: "tenant",
    serving_size_g: 100,
    kcal: 120,
    protein_g: 8,
    carbs_g: 18,
    fat_g: 3,
    fiber_g: 2,
    tags: ["qa_m51"],
    is_active: true,
    created_by: context.actorUserId,
  });
  await audit("food.create", "food_item", row.id, null, { name: row.name });
  return row;
});

const recipe = await moduleStep("Recipes", async () => {
  const row = await insertOne("recipes", {
    tenant_id: context.tenantId,
    name: `qa_m51_recipe_${stamp}`,
    category: "qa",
    description: "QA receta sintetica",
    portions: 2,
    preparation_notes: "QA sin indicacion clinica",
    tags: ["qa_m51"],
    status: "active",
    created_by: context.actorUserId,
    updated_by: context.actorUserId,
  });
  await insertOne("recipe_ingredients", {
    tenant_id: context.tenantId,
    recipe_id: row.id,
    food_item_id: food.id,
    quantity_g: 150,
    display_unit: "g",
    sort_order: 1,
  });
  await audit("recipe.create", "recipe", row.id, null, { name: row.name });
  const updated = await updateOne("recipes", row.id, { portions: 3, updated_by: context.actorUserId, updated_at: new Date().toISOString() });
  await audit("recipe.update", "recipe", row.id, { portions: 2 }, { portions: updated.portions });
  return updated;
});

await moduleStep("WeeklyMenu", async () => {
  const menu = await insertOne("weekly_menus", {
    tenant_id: context.tenantId,
    patient_id: patient.id,
    name: `qa_m51_menu_${stamp}`,
    week_start: new Date().toISOString().slice(0, 10),
    kcal_target: 1800,
    protein_target_g: 90,
    carbs_target_g: 210,
    fat_target_g: 55,
    status: "draft",
    notes: "QA menu sintetico",
    created_by: context.actorUserId,
    updated_by: context.actorUserId,
  });
  await insertOne("weekly_menu_items", {
    tenant_id: context.tenantId,
    weekly_menu_id: menu.id,
    day_of_week: 1,
    meal_type: "desayuno",
    recipe_id: recipe.id,
    quantity_g: null,
    portions: 1,
    notes: "QA item",
    sort_order: 1,
  });
  await audit("weekly_menu.create", "weekly_menu", menu.id, null, { name: menu.name });
  const updated = await updateOne("weekly_menus", menu.id, { status: "closed", updated_by: context.actorUserId, updated_at: new Date().toISOString() });
  await audit("weekly_menu.update", "weekly_menu", menu.id, { status: "draft" }, { status: updated.status });
  return updated;
});

await moduleStep("Pediatria", async () => {
  const record = await insertOne("pediatric_growth_records", {
    tenant_id: context.tenantId,
    organization_id: context.organizationId,
    patient_id: patient.id,
    sex: "female",
    sex_reference: "female",
    age_months: 120,
    age_days_total: 3652,
    metric: "bmi_for_age",
    value: null,
    weight_kg: 32,
    height_cm: 138,
    bmi: 16.8,
    z_score: null,
    percentile: null,
    standard_ref: "who_pending_reference",
    notes: "QA: referencia incompleta, no calcular z-score falso",
    measured_at: new Date().toISOString(),
    created_by: context.actorUserId,
    updated_by: context.actorUserId,
  });
  if (record.z_score !== null || record.percentile !== null) throw new Error("Pediatria calculo z-score/percentil falso.");
  await audit("pediatric_growth.create", "pediatric_growth_record", record.id, null, { z_score: null, percentile: null });
  return record;
});

await moduleStep("Deportivo / Somatocarta", async () => {
  const profile = await insertOne("sports_profiles", {
    tenant_id: context.tenantId,
    patient_id: patient.id,
    discipline: "QA disciplina",
    category: "QA",
    position: "QA",
    objective: "QA evaluacion sintetica",
    staff_owner_user_id: context.actorUserId,
  });
  const snapshot = await insertOne("sports_bodycomp_snapshots", {
    tenant_id: context.tenantId,
    patient_id: patient.id,
    endomorphy: 2.5,
    mesomorphy: 3.1,
    ectomorphy: 2.2,
    fat_pct: 18,
    lean_mass_kg: 48,
    skeletal_muscle_kg: 24,
    notes: "QA somatotipo con datos suficientes",
    measured_at: new Date().toISOString(),
  });
  await audit("sports_profile.create", "sports_profile", profile.id, null, { discipline: profile.discipline });
  await audit("sports_bodycomp.create", "sports_bodycomp_snapshot", snapshot.id, null, { somatotype: [snapshot.endomorphy, snapshot.mesomorphy, snapshot.ectomorphy] });
  return { profile, snapshot };
});

writeResult();
console.log(`QA CRUD critico: ${result.status}. Artifact: ${artifactPath}`);
if (result.status !== "passed") process.exit(1);

async function resolveQaContext() {
  const { data: tenant } = await admin.from("tenants").select("*").eq("slug", "qa-m49-clinic").maybeSingle();
  const tenantId = tenant?.id || process.env.QA_CRUD_TENANT_ID || "929d2ee7-3a55-4298-be44-08769793e6f1";
  const { data: profile } = await admin.from("user_profiles").select("id,email").eq("email", "qa-clinic@nutri.test").maybeSingle();
  if (!profile?.id) throw new Error("No existe user_profile qa-clinic@nutri.test.");
  const { data: existingPatient } = await admin.from("patients").select("organization_id").eq("tenant_id", tenantId).not("organization_id", "is", null).limit(1).maybeSingle();
  const { data: org } = await admin.from("organizations").select("id").eq("tenant_id", tenantId).limit(1).maybeSingle();
  const organizationId = existingPatient?.organization_id || org?.id;
  if (!organizationId) throw new Error("No se pudo resolver organization_id QA para crear paciente.");
  return { tenantId, actorUserId: profile.id, organizationId };
}

async function validateAnonRls(tables) {
  for (const table of tables) {
    const { data, error } = await anon.from(table).select("id").limit(1);
    if (error) {
      result.rlsAnon[table] = `blocked:${error.code || error.message}`;
      continue;
    }
    if ((data ?? []).length > 0) throw new Error(`Anon expuso datos en ${table}.`);
    result.rlsAnon[table] = "200 []";
  }
}

async function moduleStep(module, fn) {
  const entry = { module, status: "passed", ids: {}, audit: [] };
  result.modules.push(entry);
  let value;
  try {
    value = await fn();
    entry.ids = collectIds(value);
  } catch (error) {
    entry.status = "failed";
    entry.error = messageOf(error);
    result.status = "failed";
  }
  return value;
}

async function insertOne(table, payload) {
  const { data, error } = await admin.from(table).insert(payload).select("*").single();
  if (error) throw new Error(`${table}.insert: ${error.message}`);
  return data;
}

async function updateOne(table, id, patch) {
  const { data, error } = await admin.from(table).update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(`${table}.update: ${error.message}`);
  return data;
}

async function upsertOne(table, payload, onConflict) {
  const { data, error } = await admin.from(table).upsert(payload, { onConflict }).select("*").single();
  if (error) throw new Error(`${table}.upsert: ${error.message}`);
  return data;
}

async function audit(eventType, entityType, entityId, beforeData, afterData) {
  const { data, error } = await admin
    .from("audit_logs")
    .insert({
      tenant_id: context.tenantId,
      actor_user_id: context.actorUserId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      before_data: beforeData,
      after_data: afterData,
    })
    .select("id,event_type")
    .single();
  if (error) throw new Error(`audit ${eventType}: ${error.message}`);
  const last = result.modules[result.modules.length - 1];
  if (last) last.audit.push({ eventType, id: data.id });
}

function collectIds(value) {
  const ids = {};
  function visit(prefix, item) {
    if (!item || typeof item !== "object") return;
    if (typeof item.id === "string") ids[prefix || "id"] = item.id;
    for (const [key, child] of Object.entries(item)) {
      if (child && typeof child === "object" && !Array.isArray(child)) visit(key, child);
    }
  }
  visit("", value);
  return ids;
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*(?:\$env:)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

function writeResult() {
  fs.writeFileSync(artifactPath, `${JSON.stringify(result, null, 2)}\n`);
}
