import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

type InviteMode = "invite" | "create_confirmed";

interface InvitePayload {
  email?: string;
  fullName?: string;
  tenantId?: string;
  roleCode?: string;
  title?: string;
  status?: "active" | "invited" | "inactive";
  createMembership?: boolean;
  mode?: InviteMode;
  temporaryPassword?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStatus(value: unknown): "active" | "invited" | "inactive" {
  return value === "active" || value === "invited" || value === "inactive" ? value : "active";
}

function cleanMode(value: unknown): InviteMode {
  return value === "create_confirmed" ? "create_confirmed" : "invite";
}

async function findUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  return null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Metodo no permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "Funcion de invitacion pendiente de configurar." }, 500);
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const jwt = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    return jsonResponse({ ok: false, error: "Usuario autenticado requerido." }, 401);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userResult, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userResult.user) {
    return jsonResponse({ ok: false, error: "Sesion invalida." }, 401);
  }

  let payload: InvitePayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Payload invalido." }, 400);
  }

  const email = cleanEmail(payload.email);
  const fullName = cleanText(payload.fullName) || email;
  const tenantId = cleanText(payload.tenantId);
  const roleCode = cleanText(payload.roleCode);
  const title = cleanText(payload.title);
  const status = cleanStatus(payload.status);
  const createMembership = Boolean(payload.createMembership);
  const mode = cleanMode(payload.mode);

  if (!email || !tenantId) {
    return jsonResponse({ ok: false, error: "Email y tenant son obligatorios." }, 400);
  }

  if (createMembership && !roleCode) {
    return jsonResponse({ ok: false, error: "Rol requerido para crear membership." }, 400);
  }

  const { data: canManage, error: permissionError } = await callerClient.rpc("can_manage_memberships", {
    p_tenant_id: tenantId,
  });

  if (permissionError) {
    return jsonResponse({ ok: false, error: permissionError.message }, 403);
  }

  if (canManage !== true) {
    return jsonResponse({ ok: false, error: "No tienes permiso para invitar usuarios en este tenant." }, 403);
  }

  try {
    let invited = false;
    let authUser = await findUserByEmail(adminClient, email);

    if (!authUser) {
      if (mode === "create_confirmed") {
        const password = cleanText(payload.temporaryPassword);
        if (password.length < 12) {
          return jsonResponse({ ok: false, error: "La creacion confirmada requiere una contrasena temporal segura." }, 400);
        }

        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, name: fullName },
        });
        if (error) throw error;
        authUser = data.user;
      } else {
        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName, name: fullName },
        });
        if (error) throw error;
        authUser = data.user;
        invited = true;
      }
    }

    if (!authUser) {
      return jsonResponse({ ok: false, error: "No se pudo crear o ubicar el usuario Auth." }, 500);
    }

    const profileName = fullName || authUser.email ?? "Usuario";
    await adminClient.from("user_profiles").upsert({
      id: authUser.id,
      email,
      full_name: profileName,
      initials: profileName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      title: title || null,
    });

    let membershipId: string | null = null;
    if (createMembership) {
      const { data, error } = await callerClient.rpc("admin_upsert_membership", {
        p_tenant_id: tenantId,
        p_user_email: email,
        p_role_code: roleCode,
        p_status: status,
        p_title: title || null,
      });
      if (error) throw error;
      membershipId = Array.isArray(data) && data[0]?.membership_id ? String(data[0].membership_id) : null;
    }

    const eventType = mode === "create_confirmed" && !invited ? "user.create" : "user.invite";
    await adminClient.from("audit_logs").insert({
      tenant_id: tenantId,
      actor_user_id: userResult.user.id,
      event_type: eventType,
      entity_type: "auth_user",
      entity_id: authUser.id,
      after_data: {
        email,
        full_name: profileName,
        membership_id: membershipId,
        role_code: createMembership ? roleCode : null,
        invited,
        mode,
      },
    });

    return jsonResponse({
      ok: true,
      userId: authUser.id,
      email,
      membershipId,
      invited,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo invitar usuario.";
    return jsonResponse({ ok: false, error: message }, 400);
  }
});
