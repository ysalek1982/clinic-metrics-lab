import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCheck, Lock, MessageSquare, Paperclip, Plus, Send, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge } from "@/components/common/RiskBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePatientAppointments } from "@/hooks/useAppointments";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTenantAlerts, useTenantPatients, useTenantTeam } from "@/hooks/useClinicalData";
import {
  useAssignThread,
  useCloseThread,
  useCreateMessageThread,
  useMarkThreadRead,
  useMessageThread,
  useMessageThreads,
  useSendMessage,
} from "@/hooks/useMessages";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import type { MessageChannel, MessagePriority, MessageThreadStatus, MessageThreadSummary } from "@/services/messageService";

type ThreadFormState = {
  patientId: string;
  subject: string;
  priority: MessagePriority;
  channel: MessageChannel;
  initialMessage: string;
};

const priorityOptions: Array<{ value: MessagePriority; label: string }> = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const statusOptions: Array<{ value: MessageThreadStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abiertos" },
  { value: "pending", label: "Pendientes" },
  { value: "closed", label: "Cerrados" },
];

const channelOptions: Array<{ value: MessageChannel; label: string }> = [
  { value: "internal", label: "Interno" },
  { value: "patient", label: "Paciente" },
  { value: "clinical_team", label: "Equipo clínico" },
];

const demoThreads: MessageThreadSummary[] = [
  {
    id: "demo-message-thread",
    tenantId: "demo",
    patientId: "demo-patient",
    patientName: "Sofía Caicedo",
    patientMrn: "DEMO-48292",
    subject: "Seguimiento de ingesta pediátrica",
    status: "open",
    priority: "high",
    channel: "clinical_team",
    lastMessageAt: new Date().toISOString(),
    createdBy: null,
    assignedTo: null,
    assignedToName: "Equipo demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closedAt: null,
    unreadCount: 2,
    lastMessagePreview: "Vista demo sin sesión autenticada.",
  },
];

function buildEmptyForm(): ThreadFormState {
  return {
    patientId: "",
    subject: "",
    priority: "normal",
    channel: "internal",
    initialMessage: "",
  };
}

function statusLabel(value: MessageThreadStatus) {
  const labels: Record<MessageThreadStatus, string> = {
    open: "Abierto",
    pending: "Pendiente",
    closed: "Cerrado",
  };
  return labels[value] ?? value;
}

function priorityLabel(value: MessagePriority) {
  const labels: Record<MessagePriority, string> = {
    low: "Baja",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente",
  };
  return labels[value] ?? value;
}

function channelLabel(value: MessageChannel) {
  const labels: Record<MessageChannel, string> = {
    internal: "Interno",
    patient: "Paciente",
    clinical_team: "Equipo clínico",
  };
  return labels[value] ?? value;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTenantId, isDemoMode, isLoading: tenantLoading } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const canRead = hasPermission("messages.read");
  const canCreate = hasPermission("messages.create");
  const canClose = hasPermission("messages.close");
  const canAssign = hasPermission("messages.assign");
  const [statusFilter, setStatusFilter] = useState<MessageThreadStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<MessagePriority | "all">("all");
  const [search, setSearch] = useState("");
  const filters = useMemo(
    () => ({ status: statusFilter, priority: priorityFilter, search }),
    [priorityFilter, search, statusFilter],
  );
  const threadsQuery = useMessageThreads(filters);
  const patientsQuery = useTenantPatients();
  const teamQuery = useTenantTeam();
  const { data: alertResult } = useTenantAlerts();
  const threads = useMemo(() => (isDemoMode ? demoThreads : (threadsQuery.data ?? [])), [isDemoMode, threadsQuery.data]);
  const selectedThreadId = searchParams.get("thread") ?? threads[0]?.id ?? null;
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0] ?? null;
  const threadQuery = useMessageThread(!isDemoMode ? selectedThread?.id ?? null : null);
  const selectedDetail = !isDemoMode ? threadQuery.data : null;
  const selectedPatientId = selectedDetail?.thread.patientId ?? selectedThread?.patientId ?? null;
  const { data: patientAppointments = [] } = usePatientAppointments(selectedPatientId);
  const createThreadMutation = useCreateMessageThread();
  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkThreadRead();
  const closeThreadMutation = useCloseThread();
  const assignThreadMutation = useAssignThread();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ThreadFormState>(() => buildEmptyForm());
  const [messageDraft, setMessageDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState("");

  const patients = patientsQuery.data?.data ?? [];
  const teamMembers = teamQuery.data?.data ?? [];
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null;
  const patientAlerts = (alertResult?.data ?? []).filter((alert) => alert.patientId === selectedPatientId);
  const nextAppointment = patientAppointments
    .filter((appointment) => appointment.status === "scheduled" && new Date(appointment.startsAt).getTime() >= Date.now())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0] ?? null;

  useEffect(() => {
    if (!selectedThreadId && threads[0]?.id) {
      setSearchParams({ thread: threads[0].id }, { replace: true });
    }
  }, [selectedThreadId, setSearchParams, threads]);

  useEffect(() => {
    setAssignTo(selectedDetail?.thread.assignedTo ?? selectedThread?.assignedTo ?? "");
  }, [selectedDetail?.thread.assignedTo, selectedThread?.assignedTo]);

  const messages = isDemoMode
    ? [
        {
          id: "demo-message-1",
          tenantId: "demo",
          threadId: "demo-message-thread",
          patientId: "demo-patient",
          senderUserId: "demo",
          senderDisplayName: "Equipo demo",
          body: "Vista demo sin sesión autenticada. Los mensajes reales requieren Supabase y tenant activo.",
          messageType: "text",
          createdAt: new Date().toISOString(),
        },
      ]
    : (selectedDetail?.messages ?? []);

  function selectThread(threadId: string) {
    setSearchParams({ thread: threadId });
  }

  function updateForm<K extends keyof ThreadFormState>(key: K, value: ThreadFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTenantId || isDemoMode) return;
    setFormError(null);

    if (!form.subject.trim()) {
      setFormError("El asunto es obligatorio.");
      return;
    }
    if (!form.initialMessage.trim()) {
      setFormError("El primer mensaje es obligatorio.");
      return;
    }

    try {
      const thread = await createThreadMutation.mutateAsync({
        tenantId: activeTenantId,
        patientId: form.patientId || null,
        subject: form.subject,
        priority: form.priority,
        channel: form.channel,
        initialMessage: form.initialMessage,
      });
      setDialogOpen(false);
      setForm(buildEmptyForm());
      setSearchParams({ thread: thread.id });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el hilo.");
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTenantId || !selectedThread || isDemoMode) return;
    if (!messageDraft.trim()) return;

    await sendMessageMutation.mutateAsync({
      tenantId: activeTenantId,
      threadId: selectedThread.id,
      patientId: selectedPatientId,
      body: messageDraft,
    });
    setMessageDraft("");
  }

  async function handleMarkRead() {
    if (!activeTenantId || !selectedThread || isDemoMode) return;
    await markReadMutation.mutateAsync({ tenantId: activeTenantId, threadId: selectedThread.id });
  }

  async function handleCloseThread() {
    if (!activeTenantId || !selectedThread || isDemoMode) return;
    await closeThreadMutation.mutateAsync({ tenantId: activeTenantId, threadId: selectedThread.id });
  }

  async function handleAssignThread() {
    if (!activeTenantId || !selectedThread || isDemoMode) return;
    await assignThreadMutation.mutateAsync({
      tenantId: activeTenantId,
      threadId: selectedThread.id,
      assignedTo: assignTo || null,
    });
  }

  if (tenantLoading) {
    return <MessagesState title="Mensajes" message="Cargando contexto institucional..." />;
  }

  if (!isDemoMode && !canRead) {
    return <MessagesState title="Mensajes" message="No tienes permiso para ver mensajes clínicos de este tenant." />;
  }

  const isLoading = !isDemoMode && (threadsQuery.isLoading || patientsQuery.isLoading || teamQuery.isLoading);
  const isError = !isDemoMode && (threadsQuery.isError || patientsQuery.isError);

  return (
    <div>
      <PageHeader
        meta="Comunicación clínica"
        title="Mensajes"
        subtitle="Bandeja de hilos clínicos asociados a pacientes, equipo y seguimiento operativo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isDemoMode && (
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
                DEMO
              </span>
            )}
            <Button
              size="sm"
              className="h-8 gap-2"
              onClick={() => {
                setForm(buildEmptyForm());
                setFormError(null);
                setDialogOpen(true);
              }}
              disabled={!canCreate || isDemoMode}
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo hilo
            </Button>
          </div>
        }
      />

      <div className="grid min-h-[calc(100vh-128px)] gap-4 p-6 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
        <aside className="panel overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Bandeja clínica</div>
            <h2 className="mt-1 text-[15px] font-medium">Hilos activos</h2>
            <div className="mt-4 space-y-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar hilo, paciente, MRN..."
                className="h-9"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as MessageThreadStatus | "all")}
                  className="h-9 rounded-md border border-border bg-background px-2 text-[12px]"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value as MessagePriority | "all")}
                  className="h-9 rounded-md border border-border bg-background px-2 text-[12px]"
                >
                  <option value="all">Prioridad</option>
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="max-h-[calc(100vh-292px)] overflow-y-auto">
            {isLoading ? (
              <InlineState message="Cargando hilos reales..." />
            ) : isError ? (
              <InlineState message="No se pudieron cargar los mensajes desde Supabase." />
            ) : !isDemoMode && threads.length === 0 ? (
              <InlineState message="Este módulo aún no tiene mensajes reales configurados para este tenant." />
            ) : (
              <div className="divide-y divide-border">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => selectThread(thread.id)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-surface-raised/50 ${
                      selectedThread?.id === thread.id ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold">{thread.subject}</div>
                        <div className="mt-1 text-[11px] font-mono text-muted-foreground">
                          {thread.patientName ?? "Sin paciente"} {thread.patientMrn ? `· ${thread.patientMrn}` : ""}
                        </div>
                      </div>
                      {thread.unreadCount > 0 && (
                        <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-mono text-destructive">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12px] text-muted-foreground">
                      {thread.lastMessagePreview ?? "Sin mensajes registrados."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ThreadStatusBadge status={thread.status} />
                      <PriorityBadge priority={thread.priority} />
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">
                        {formatDateTime(thread.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="panel flex min-h-[620px] flex-col overflow-hidden">
          {!selectedThread ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <MessageSquare className="mx-auto h-7 w-7 text-primary" />
                <div className="mt-3 text-[15px] font-medium">Sin hilo seleccionado</div>
                <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
                  Crea o selecciona un hilo clínico real para revisar la conversación.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {channelLabel(selectedThread.channel)}
                    </div>
                    <h2 className="mt-1 text-xl font-semibold">{selectedThread.subject}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <ThreadStatusBadge status={selectedDetail?.thread.status ?? selectedThread.status} />
                      <PriorityBadge priority={selectedDetail?.thread.priority ?? selectedThread.priority} />
                      {selectedThread.patientName && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {selectedThread.patientName} · {selectedThread.patientMrn}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => void handleMarkRead()} disabled={isDemoMode || markReadMutation.isPending}>
                      <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                      Marcar leído
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px]"
                      onClick={() => void handleCloseThread()}
                      disabled={!canClose || isDemoMode || selectedThread.status === "closed" || closeThreadMutation.isPending}
                    >
                      <Lock className="mr-1.5 h-3.5 w-3.5" />
                      Cerrar hilo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {threadQuery.isLoading && !isDemoMode ? (
                  <InlineState message="Cargando conversación..." />
                ) : messages.length === 0 ? (
                  <InlineState message="Este hilo aún no tiene mensajes." />
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="rounded-xl border border-border bg-surface-raised/35 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[13px] font-semibold">{message.senderDisplayName ?? "Usuario Nutri"}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{formatDateTime(message.createdAt)}</div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{message.body}</p>
                    </div>
                  ))
                )}
              </div>

              <form className="border-t border-border p-4" onSubmit={handleSendMessage}>
                <Textarea
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder={selectedThread.status === "closed" ? "El hilo está cerrado." : "Escribir mensaje clínico..."}
                  disabled={isDemoMode || selectedThread.status === "closed"}
                  className="min-h-[96px]"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Button variant="outline" type="button" size="sm" className="h-8 text-[12px]" disabled title="Próximamente">
                    <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                    Adjuntar · Próximamente
                  </Button>
                  <Button type="submit" size="sm" className="h-8 gap-2" disabled={isDemoMode || selectedThread.status === "closed" || sendMessageMutation.isPending || !messageDraft.trim()}>
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Contexto del paciente</div>
            <h3 className="mt-1 text-[15px] font-medium">{selectedPatient?.fullName ?? selectedThread?.patientName ?? "Sin paciente asociado"}</h3>
            <div className="mt-3 space-y-2 text-[12px] text-muted-foreground">
              <div>MRN: {selectedPatient?.mrn ?? selectedThread?.patientMrn ?? "--"}</div>
              <div>Diagnóstico: {selectedPatient?.diagnosisSummary ?? "--"}</div>
              {selectedPatient && <RiskBadge level={selectedPatient.risk} />}
            </div>
            {selectedPatientId && (
              <Button asChild variant="outline" size="sm" className="mt-4 h-8 w-full text-[12px]">
                <Link to={`/app/patients/${selectedPatientId}`}>Ver paciente</Link>
              </Button>
            )}
          </div>

          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Próxima cita</div>
            <div className="mt-2 text-[13px] text-muted-foreground">
              {nextAppointment
                ? `${formatDateTime(nextAppointment.startsAt)} · ${nextAppointment.location ?? "Sin ubicación"}`
                : "No hay próxima cita registrada."}
            </div>
          </div>

          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Alertas activas</div>
            {patientAlerts.length === 0 ? (
              <div className="mt-2 text-[13px] text-muted-foreground">Sin alertas asociadas.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {patientAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-border bg-surface-raised/40 p-3">
                    <div className="flex items-center gap-2">
                      <RiskBadge level={alert.severity} />
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">{alert.type}</span>
                    </div>
                    <p className="mt-2 text-[12px] text-muted-foreground">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Acciones</div>
            <div className="mt-3 space-y-2">
              <Field label="Asignar a">
                <select
                  value={assignTo}
                  onChange={(event) => setAssignTo(event.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-[12px]"
                  disabled={!canAssign || isDemoMode || !selectedThread}
                >
                  <option value="">Sin asignar</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full text-[12px]"
                onClick={() => void handleAssignThread()}
                disabled={!canAssign || isDemoMode || !selectedThread || assignThreadMutation.isPending}
              >
                <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                Asignar hilo
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>Nuevo hilo clínico</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              Crea un hilo real del tenant activo. Puede asociarse a un paciente para que aparezca en su expediente.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleCreateThread}>
            {formError && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{formError}</div>}

            <Field label="Paciente">
              <select
                value={form.patientId}
                onChange={(event) => updateForm("patientId", event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]"
              >
                <option value="">Sin paciente asociado</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName} · {patient.mrn}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Asunto">
              <Input value={form.subject} onChange={(event) => updateForm("subject", event.target.value)} required />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Prioridad">
                <select
                  value={form.priority}
                  onChange={(event) => updateForm("priority", event.target.value as MessagePriority)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Canal">
                <select
                  value={form.channel}
                  onChange={(event) => updateForm("channel", event.target.value as MessageChannel)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]"
                >
                  {channelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Primer mensaje">
              <Textarea value={form.initialMessage} onChange={(event) => updateForm("initialMessage", event.target.value)} required />
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createThreadMutation.isPending}>Crear hilo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThreadStatusBadge({ status }: { status: MessageThreadStatus }) {
  const color =
    status === "closed"
      ? "border-slate-400/40 bg-slate-400/10 text-slate-200"
      : status === "pending"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
        : "border-primary/40 bg-primary/10 text-primary";

  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${color}`}>{statusLabel(status)}</span>;
}

function PriorityBadge({ priority }: { priority: MessagePriority }) {
  const color =
    priority === "urgent"
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : priority === "high"
        ? "border-orange-400/50 bg-orange-400/10 text-orange-300"
        : priority === "low"
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
          : "border-primary/40 bg-primary/10 text-primary";

  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${color}`}>{priorityLabel(priority)}</span>;
}

function MessagesState({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <PageHeader meta="Comunicación clínica" title={title} subtitle="Bandeja de hilos clínicos asociados a pacientes y equipo." />
      <div className="p-6">
        <div className="panel flex min-h-[320px] items-center justify-center px-6 text-center">
          <div>
            <MessageSquare className="mx-auto h-6 w-6 text-primary" />
            <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Mensajes</div>
            <div className="mt-2 text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center px-5 text-center text-[13px] text-muted-foreground">
      {message}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
