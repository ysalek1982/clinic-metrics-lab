import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { writeAuditLog } from "@/services/clinicalService";

export type MessageThreadStatus = "open" | "pending" | "closed";
export type MessagePriority = "low" | "normal" | "high" | "urgent";
export type MessageChannel = "internal" | "patient" | "clinical_team";

export type MessageThreadFilters = {
  status?: MessageThreadStatus | "all";
  priority?: MessagePriority | "all";
  search?: string;
};

export type MessageThreadSummary = {
  id: string;
  tenantId: string;
  patientId: string | null;
  patientName: string | null;
  patientMrn: string | null;
  subject: string;
  status: MessageThreadStatus;
  priority: MessagePriority;
  channel: MessageChannel;
  lastMessageAt: string | null;
  createdBy: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  unreadCount: number;
  lastMessagePreview: string | null;
};

export type MessageItem = {
  id: string;
  tenantId: string;
  threadId: string;
  patientId: string | null;
  senderUserId: string | null;
  senderDisplayName: string | null;
  body: string;
  messageType: string;
  createdAt: string;
};

export type MessageThreadDetail = {
  thread: MessageThreadSummary;
  messages: MessageItem[];
};

export type CreateThreadPayload = {
  tenantId: string;
  patientId?: string | null;
  subject: string;
  priority: MessagePriority;
  channel: MessageChannel;
  assignedTo?: string | null;
  initialMessage: string;
};

export type SendMessagePayload = {
  tenantId: string;
  threadId: string;
  patientId?: string | null;
  body: string;
};

type QueryResult = {
  data: unknown;
  error: unknown;
};

type SupabaseQueryBuilder = PromiseLike<QueryResult> & {
  select: (...args: unknown[]) => SupabaseQueryBuilder;
  insert: (...args: unknown[]) => SupabaseQueryBuilder;
  update: (...args: unknown[]) => SupabaseQueryBuilder;
  upsert: (...args: unknown[]) => SupabaseQueryBuilder;
  eq: (...args: unknown[]) => SupabaseQueryBuilder;
  is: (...args: unknown[]) => SupabaseQueryBuilder;
  in: (...args: unknown[]) => SupabaseQueryBuilder;
  order: (...args: unknown[]) => SupabaseQueryBuilder;
  limit: (...args: unknown[]) => SupabaseQueryBuilder;
  single: () => Promise<QueryResult>;
};

type SupabaseAnyClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null }; error: unknown }>;
  };
  from: (table: string) => SupabaseQueryBuilder;
};

type ThreadRow = {
  id: string;
  tenant_id: string;
  patient_id: string | null;
  subject: string;
  status: MessageThreadStatus;
  priority: MessagePriority;
  channel: MessageChannel;
  last_message_at: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

type MessageRow = {
  id: string;
  tenant_id: string;
  thread_id: string;
  patient_id: string | null;
  sender_user_id: string | null;
  sender_display_name: string | null;
  body: string;
  message_type: string;
  created_at: string;
};

type ReceiptRow = {
  thread_id: string;
  message_id: string | null;
  user_id: string;
  read_at: string;
};

type PatientRow = {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const client = supabase as unknown as SupabaseAnyClient;

async function currentUser() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Sesión requerida para operar mensajes.");
  return data.user;
}

async function currentSenderName(userId: string, fallbackEmail?: string | null) {
  const { data, error } = await client
    .from("user_profiles")
    .select("id,full_name,email")
    .eq("id", userId)
    .single();

  if (error) return fallbackEmail ?? "Usuario Nutri";
  const profile = data as ProfileRow;
  return profile.full_name ?? profile.email ?? fallbackEmail ?? "Usuario Nutri";
}

function ensureText(value: string, message: string) {
  if (!value.trim()) throw new Error(message);
  return value.trim();
}

function mapMessage(row: MessageRow): MessageItem {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    threadId: row.thread_id,
    patientId: row.patient_id,
    senderUserId: row.sender_user_id,
    senderDisplayName: row.sender_display_name,
    body: row.body,
    messageType: row.message_type,
    createdAt: row.created_at,
  };
}

function mapThread(
  row: ThreadRow,
  patientMap: Map<string, PatientRow>,
  profileMap: Map<string, ProfileRow>,
  messagesByThread: Map<string, MessageRow[]>,
  receiptsByThread: Map<string, ReceiptRow>,
  currentUserId: string | null,
): MessageThreadSummary {
  const patient = row.patient_id ? patientMap.get(row.patient_id) : null;
  const assignedProfile = row.assigned_to ? profileMap.get(row.assigned_to) : null;
  const threadMessages = messagesByThread.get(row.id) ?? [];
  const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
  const readAt = receiptsByThread.get(row.id)?.read_at ?? null;
  const unreadCount = currentUserId
    ? threadMessages.filter((message) => {
        if (message.sender_user_id === currentUserId) return false;
        if (!readAt) return true;
        return new Date(message.created_at).getTime() > new Date(readAt).getTime();
      }).length
    : 0;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    patientName: patient ? `${patient.first_name} ${patient.last_name}` : null,
    patientMrn: patient?.mrn ?? null,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    channel: row.channel,
    lastMessageAt: row.last_message_at ?? lastMessage?.created_at ?? row.created_at,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    assignedToName: assignedProfile?.full_name ?? assignedProfile?.email ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
    unreadCount,
    lastMessagePreview: lastMessage?.body ?? null,
  };
}

async function hydrateThreads(rows: ThreadRow[], currentUserId: string | null) {
  if (rows.length === 0) return [];

  const threadIds = rows.map((row) => row.id);
  const patientIds = [...new Set(rows.map((row) => row.patient_id).filter((id): id is string => Boolean(id)))];
  const assignedIds = [...new Set(rows.map((row) => row.assigned_to).filter((id): id is string => Boolean(id)))];

  const [patientsResult, profilesResult, messagesResult, receiptsResult] = await Promise.all([
    patientIds.length > 0
      ? client.from("patients").select("id,mrn,first_name,last_name").in("id", patientIds)
      : Promise.resolve({ data: [] as PatientRow[], error: null }),
    assignedIds.length > 0
      ? client.from("user_profiles").select("id,full_name,email").in("id", assignedIds)
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
    client
      .from("messages")
      .select("id,tenant_id,thread_id,patient_id,sender_user_id,sender_display_name,body,message_type,created_at")
      .in("thread_id", threadIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    currentUserId
      ? client
          .from("message_read_receipts")
          .select("thread_id,message_id,user_id,read_at")
          .in("thread_id", threadIds)
          .eq("user_id", currentUserId)
      : Promise.resolve({ data: [] as ReceiptRow[], error: null }),
  ]);

  if (patientsResult.error) throw patientsResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (messagesResult.error) throw messagesResult.error;
  if (receiptsResult.error) throw receiptsResult.error;

  const patientMap = new Map<string, PatientRow>();
  ((patientsResult.data ?? []) as PatientRow[]).forEach((patient) => patientMap.set(patient.id, patient));

  const profileMap = new Map<string, ProfileRow>();
  ((profilesResult.data ?? []) as ProfileRow[]).forEach((profile) => profileMap.set(profile.id, profile));

  const messagesByThread = new Map<string, MessageRow[]>();
  ((messagesResult.data ?? []) as MessageRow[]).forEach((message) => {
    const items = messagesByThread.get(message.thread_id) ?? [];
    items.push(message);
    messagesByThread.set(message.thread_id, items);
  });

  const receiptsByThread = new Map<string, ReceiptRow>();
  ((receiptsResult.data ?? []) as ReceiptRow[]).forEach((receipt) => receiptsByThread.set(receipt.thread_id, receipt));

  return rows.map((row) => mapThread(row, patientMap, profileMap, messagesByThread, receiptsByThread, currentUserId));
}

export async function listThreads(tenantId: string, filters: MessageThreadFilters = {}) {
  const user = await currentUser();
  let query = client
    .from("message_threads")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false });

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.priority && filters.priority !== "all") query = query.eq("priority", filters.priority);

  const { data, error } = await query;
  if (error) throw error;

  const search = filters.search?.trim().toLowerCase();
  const rows = ((data ?? []) as ThreadRow[]).filter((row) => {
    if (!search) return true;
    return row.subject.toLowerCase().includes(search);
  });

  const hydrated = await hydrateThreads(rows, user.id);
  if (!search) return hydrated;

  return hydrated.filter((thread) =>
    [thread.subject, thread.patientName, thread.patientMrn, thread.lastMessagePreview]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search)),
  );
}

export async function getThread(tenantId: string, threadId: string): Promise<MessageThreadDetail> {
  const user = await currentUser();
  const { data: threadData, error: threadError } = await client
    .from("message_threads")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", threadId)
    .is("deleted_at", null)
    .single();

  if (threadError) throw threadError;

  const { data: messageData, error: messageError } = await client
    .from("messages")
    .select("id,tenant_id,thread_id,patient_id,sender_user_id,sender_display_name,body,message_type,created_at")
    .eq("tenant_id", tenantId)
    .eq("thread_id", threadId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (messageError) throw messageError;

  const [thread] = await hydrateThreads([threadData as ThreadRow], user.id);
  return {
    thread,
    messages: ((messageData ?? []) as MessageRow[]).map(mapMessage),
  };
}

export async function createThread(input: CreateThreadPayload) {
  const user = await currentUser();
  const senderName = await currentSenderName(user.id, user.email);
  const subject = ensureText(input.subject, "El asunto es obligatorio.");
  const initialMessage = ensureText(input.initialMessage, "El primer mensaje es obligatorio.");
  const now = new Date().toISOString();

  const { data: thread, error: threadError } = await client
    .from("message_threads")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId ?? null,
      subject,
      status: "open",
      priority: input.priority,
      channel: input.channel,
      last_message_at: now,
      created_by: user.id,
      assigned_to: input.assignedTo ?? null,
    })
    .select("*")
    .single();

  if (threadError) throw threadError;

  const { data: message, error: messageError } = await client
    .from("messages")
    .insert({
      tenant_id: input.tenantId,
      thread_id: (thread as ThreadRow).id,
      patient_id: input.patientId ?? null,
      sender_user_id: user.id,
      sender_display_name: senderName,
      body: initialMessage,
      message_type: "text",
    })
    .select("*")
    .single();

  if (messageError) throw messageError;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: user.id,
    eventType: "message_thread.create",
    entityType: "message_thread",
    entityId: (thread as ThreadRow).id,
    afterData: thread as Json,
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: user.id,
    eventType: "message.sent",
    entityType: "message",
    entityId: (message as MessageRow).id,
    afterData: { thread_id: (thread as ThreadRow).id, patient_id: input.patientId ?? null },
  });

  return thread as ThreadRow;
}

export async function sendMessage(input: SendMessagePayload) {
  const user = await currentUser();
  const senderName = await currentSenderName(user.id, user.email);
  const body = ensureText(input.body, "El mensaje no puede estar vacío.");

  const { data: beforeThread, error: beforeError } = await client
    .from("message_threads")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.threadId)
    .single();

  if (beforeError) throw beforeError;
  if ((beforeThread as ThreadRow).status === "closed") throw new Error("No se puede escribir en un hilo cerrado.");

  const { data, error } = await client
    .from("messages")
    .insert({
      tenant_id: input.tenantId,
      thread_id: input.threadId,
      patient_id: input.patientId ?? (beforeThread as ThreadRow).patient_id,
      sender_user_id: user.id,
      sender_display_name: senderName,
      body,
      message_type: "text",
    })
    .select("*")
    .single();

  if (error) throw error;

  const now = new Date().toISOString();
  const { error: updateError } = await client
    .from("message_threads")
    .update({ last_message_at: now, updated_at: now })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.threadId);

  if (updateError) throw updateError;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: user.id,
    eventType: "message.sent",
    entityType: "message",
    entityId: (data as MessageRow).id,
    afterData: { thread_id: input.threadId, patient_id: input.patientId ?? (beforeThread as ThreadRow).patient_id },
  });

  return data as MessageRow;
}

export async function markThreadRead(input: { tenantId: string; threadId: string }) {
  const user = await currentUser();
  const { data: latestMessages, error: latestError } = await client
    .from("messages")
    .select("id,created_at")
    .eq("tenant_id", input.tenantId)
    .eq("thread_id", input.threadId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestError) throw latestError;

  const latestMessage = ((latestMessages ?? []) as Array<{ id: string; created_at: string }>)[0] ?? null;
  const readAt = new Date().toISOString();

  const { data, error } = await client
    .from("message_read_receipts")
    .upsert(
      {
        tenant_id: input.tenantId,
        thread_id: input.threadId,
        message_id: latestMessage?.id ?? null,
        user_id: user.id,
        read_at: readAt,
      },
      { onConflict: "thread_id,user_id" },
    )
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: user.id,
    eventType: "message_thread.read",
    entityType: "message_thread",
    entityId: input.threadId,
    afterData: { read_at: readAt, message_id: latestMessage?.id ?? null },
  });

  return data as ReceiptRow;
}

export async function closeThread(input: { tenantId: string; threadId: string }) {
  return updateThreadStatus({ ...input, status: "closed" });
}

export async function updateThreadStatus(input: { tenantId: string; threadId: string; status: MessageThreadStatus }) {
  const user = await currentUser();
  const { data: before, error: beforeError } = await client
    .from("message_threads")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.threadId)
    .single();

  if (beforeError) throw beforeError;

  const now = new Date().toISOString();
  const patch = {
    status: input.status,
    closed_at: input.status === "closed" ? now : null,
    updated_at: now,
  };

  const { data, error } = await client
    .from("message_threads")
    .update(patch)
    .eq("tenant_id", input.tenantId)
    .eq("id", input.threadId)
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: user.id,
    eventType: input.status === "closed" ? "message_thread.closed" : "message_thread.update",
    entityType: "message_thread",
    entityId: input.threadId,
    beforeData: before as Json,
    afterData: data as Json,
  });

  return data as ThreadRow;
}

export async function assignThread(input: { tenantId: string; threadId: string; assignedTo: string | null }) {
  const user = await currentUser();
  const { data: before, error: beforeError } = await client
    .from("message_threads")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.threadId)
    .single();

  if (beforeError) throw beforeError;

  const { data, error } = await client
    .from("message_threads")
    .update({ assigned_to: input.assignedTo, updated_at: new Date().toISOString() })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.threadId)
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: user.id,
    eventType: "message_thread.assigned",
    entityType: "message_thread",
    entityId: input.threadId,
    beforeData: before as Json,
    afterData: data as Json,
  });

  return data as ThreadRow;
}

export async function listPatientThreads(tenantId: string, patientId: string) {
  const user = await currentUser();
  const { data, error } = await client
    .from("message_threads")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return hydrateThreads((data ?? []) as ThreadRow[], user.id);
}

export async function getUnreadMessageCount(tenantId: string) {
  const threads = await listThreads(tenantId, { status: "open" });
  return threads.reduce((total, thread) => total + thread.unreadCount, 0);
}
