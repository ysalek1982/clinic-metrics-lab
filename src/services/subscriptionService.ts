import { supabase } from "@/integrations/supabase/client";
import { normalizePlanCode, type PlanEntitlement, type SubscriptionStatus } from "@/lib/subscriptionAccess";

export interface SubscriptionPlanRecord {
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: number | null;
  currency: string;
  isPaid: boolean;
  isActive: boolean;
  maxUsers: number | null;
  maxPatients: number | null;
  maxStorageMb: number | null;
  features: string[];
}

export interface TenantSubscriptionRecord {
  subscriptionId: string;
  tenantId: string;
  tenantName: string;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  startsAt: string | null;
  endsAt: string | null;
  trialEndsAt: string | null;
  courtesyEndsAt: string | null;
  paymentProvider: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SubscriptionEventRecord {
  eventId: string;
  tenantId: string;
  tenantName: string;
  subscriptionId: string | null;
  eventType: string;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AssignTenantPlanInput {
  tenantId: string;
  planCode: string;
  status: SubscriptionStatus;
  endsAt?: string | null;
  notes?: string | null;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }
  return supabase;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeFeatures(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toPlan(row: unknown): SubscriptionPlanRecord {
  const record = asRecord(row);
  return {
    code: normalizePlanCode(String(record.code ?? record.id ?? "free")),
    name: String(record.name ?? "Plan"),
    description: stringOrNull(record.description),
    monthlyPrice: numberOrNull(record.monthly_price ?? record.monthly_price_usd),
    currency: String(record.currency ?? "BOB"),
    isPaid: booleanValue(record.is_paid, Boolean(record.monthly_price ?? record.monthly_price_usd)),
    isActive: booleanValue(record.is_active, true),
    maxUsers: numberOrNull(record.max_users ?? record.included_users),
    maxPatients: numberOrNull(record.max_patients ?? record.active_patient_limit),
    maxStorageMb: numberOrNull(record.max_storage_mb),
    features: normalizeFeatures(record.features),
  };
}

function toEntitlement(row: unknown): PlanEntitlement & { planCode: string } {
  const record = asRecord(row);
  return {
    planCode: normalizePlanCode(String(record.plan_code ?? "free")),
    featureKey: String(record.feature_key ?? ""),
    enabled: booleanValue(record.enabled, true),
    limitValue: numberOrNull(record.limit_value),
  };
}

function toTenantSubscription(row: unknown): TenantSubscriptionRecord {
  const record = asRecord(row);
  const planCode = normalizePlanCode(String(record.plan_code ?? record.plan_id ?? "free"));
  return {
    subscriptionId: String(record.subscription_id ?? record.id ?? ""),
    tenantId: String(record.tenant_id ?? ""),
    tenantName: String(record.tenant_name ?? "Tenant"),
    planCode,
    planName: String(record.plan_name ?? planCode ?? "Plan"),
    status: String(record.status ?? "active") as SubscriptionStatus,
    startsAt: stringOrNull(record.starts_at),
    endsAt: stringOrNull(record.ends_at),
    trialEndsAt: stringOrNull(record.trial_ends_at),
    courtesyEndsAt: stringOrNull(record.courtesy_ends_at),
    paymentProvider: stringOrNull(record.payment_provider),
    notes: stringOrNull(record.notes),
    createdAt: stringOrNull(record.created_at),
    updatedAt: stringOrNull(record.updated_at),
  };
}

function toSubscriptionEvent(row: unknown): SubscriptionEventRecord {
  const record = asRecord(row);
  return {
    eventId: String(record.event_id ?? record.id ?? ""),
    tenantId: String(record.tenant_id ?? ""),
    tenantName: String(record.tenant_name ?? "Tenant"),
    subscriptionId: stringOrNull(record.subscription_id),
    eventType: String(record.event_type ?? "subscription.event"),
    actorId: stringOrNull(record.actor_id),
    metadata: asRecord(record.metadata),
    createdAt: String(record.created_at ?? new Date().toISOString()),
  };
}

export async function listPlans(): Promise<SubscriptionPlanRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("subscription_plans")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toPlan).filter((plan) => plan.isActive);
}

export async function listPlanEntitlements(): Promise<Array<PlanEntitlement & { planCode: string }>> {
  const client = requireSupabase();
  const { data, error } = await client.from("plan_entitlements").select("*").order("plan_code");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toEntitlement);
}

export async function getTenantSubscription(tenantId: string): Promise<TenantSubscriptionRecord | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("tenant_subscriptions")
    .select("id, tenant_id, plan_id, plan_code, status, starts_at, ends_at, trial_ends_at, courtesy_ends_at, payment_provider, notes, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .in("status", ["active", "trialing", "courtesy", "past_due"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toTenantSubscription(data) : null;
}

export async function listTenantSubscriptions(status: "all" | SubscriptionStatus = "all"): Promise<TenantSubscriptionRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_list_tenant_subscriptions", { p_status: status });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []).map(toTenantSubscription);
}

export async function assignPlanToTenant(input: AssignTenantPlanInput) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_assign_tenant_plan", {
    p_tenant_id: input.tenantId,
    p_plan_code: input.planCode,
    p_status: input.status,
    p_ends_at: input.endsAt || null,
    p_notes: input.notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function grantCourtesySubscription(input: { tenantId: string; endsAt: string; notes?: string | null }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_grant_courtesy_subscription", {
    p_tenant_id: input.tenantId,
    p_ends_at: input.endsAt,
    p_notes: input.notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function extendCourtesySubscription(input: { subscriptionId: string; endsAt: string; notes?: string | null }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_extend_courtesy_subscription", {
    p_subscription_id: input.subscriptionId,
    p_ends_at: input.endsAt,
    p_notes: input.notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function cancelCourtesySubscription(input: { subscriptionId: string; notes?: string | null }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_cancel_courtesy_subscription", {
    p_subscription_id: input.subscriptionId,
    p_notes: input.notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function listSubscriptionEvents(tenantId?: string | null): Promise<SubscriptionEventRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_list_subscription_events", {
    p_tenant_id: tenantId || null,
  });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []).map(toSubscriptionEvent);
}
