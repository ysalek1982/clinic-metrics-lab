import { FormEvent, ReactNode, useMemo, useState } from "react";
import { ActionDialog } from "@/components/common/ActionDialog";
import { CalendarClock, Check, ChevronLeft, ChevronRight, Edit3, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  useAppointments,
  useCancelAppointment,
  useCompleteAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  useUpcomingAppointments,
} from "@/hooks/useAppointments";
import { useTenantPatients, useTenantTeam } from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import type { AppointmentSummary, AppointmentType, AppointmentStatus } from "@/services/appointmentService";

const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const hours = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const appointmentTypes: Array<{ value: AppointmentType; label: string }> = [
  { value: "consulta", label: "Consulta" },
  { value: "antropometria", label: "Antropometría" },
  { value: "educacion", label: "Educación" },
  { value: "telemedicina", label: "Telemedicina" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "control_labs", label: "Control de laboratorios" },
  { value: "otro", label: "Otro" },
];

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const demoEvents: AppointmentSummary[] = [
  {
    id: "demo-1",
    tenantId: "demo",
    patientId: "demo-patient-1",
    patientName: "Andrés Mejía",
    patientMrn: "DEMO-001",
    professionalUserId: null,
    professionalName: "Equipo demo",
    startsAt: toIsoFromLocalParts(formatDateInput(new Date()), "08:00"),
    endsAt: toIsoFromLocalParts(formatDateInput(new Date()), "08:30"),
    appointmentType: "seguimiento",
    status: "scheduled",
    modality: "presencial",
    location: "UCI-2",
    notes: "Vista demo sin sesión autenticada.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

type AppointmentFormState = {
  patientId: string;
  professionalUserId: string;
  date: string;
  startTime: string;
  endTime: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  modality: string;
  location: string;
  notes: string;
};

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short" }).format(new Date(value));
}

function formatHour(value: string) {
  return new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function toIsoFromLocalParts(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function typeLabel(value: string) {
  return appointmentTypes.find((item) => item.value === value)?.label ?? value;
}

function statusLabel(value: AppointmentStatus) {
  return statusLabels[value] ?? value;
}

function buildEmptyForm(patientId = ""): AppointmentFormState {
  const now = addMinutes(new Date(), 60);
  now.setMinutes(0, 0, 0);
  const end = addMinutes(now, 30);
  return {
    patientId,
    professionalUserId: "",
    date: formatDateInput(now),
    startTime: formatTimeInput(now),
    endTime: formatTimeInput(end),
    appointmentType: "consulta",
    status: "scheduled",
    modality: "presencial",
    location: "",
    notes: "",
  };
}

function formFromAppointment(appointment: AppointmentSummary): AppointmentFormState {
  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);
  return {
    patientId: appointment.patientId,
    professionalUserId: appointment.professionalUserId ?? "",
    date: formatDateInput(start),
    startTime: formatTimeInput(start),
    endTime: formatTimeInput(end),
    appointmentType: appointment.appointmentType,
    status: appointment.status,
    modality: appointment.modality ?? "",
    location: appointment.location ?? "",
    notes: appointment.notes ?? "",
  };
}

export default function Agenda() {
  const { activeTenantId, isDemoMode, isLoading: tenantLoading } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const weekStartIso = weekStart.toISOString();
  const weekEndIso = weekEnd.toISOString();
  const canRead = hasPermission("appointments.read");
  const canCreate = hasPermission("appointments.create");
  const canUpdate = hasPermission("appointments.update");
  const canCancel = hasPermission("appointments.cancel");
  const canComplete = hasPermission("appointments.complete");
  const appointmentsQuery = useAppointments(weekStartIso, weekEndIso);
  const upcomingQuery = useUpcomingAppointments();
  const patientsQuery = useTenantPatients();
  const teamQuery = useTenantTeam();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const completeMutation = useCompleteAppointment();
  const cancelMutation = useCancelAppointment();
  const [professionalFilter, setProfessionalFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentSummary | null>(null);
  const [statusAction, setStatusAction] = useState<{ appointment: AppointmentSummary; status: "completed" | "cancelled" } | null>(null);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentFormState>(() => buildEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  const patients = patientsQuery.data?.data ?? [];
  const teamMembers = teamQuery.data?.data ?? [];
  const realAppointments = useMemo(() => appointmentsQuery.data ?? [], [appointmentsQuery.data]);
  const upcomingAppointments = useMemo(() => upcomingQuery.data ?? [], [upcomingQuery.data]);
  const visibleAppointments = (isDemoMode ? demoEvents : realAppointments).filter((appointment) =>
    professionalFilter === "all" ? true : appointment.professionalUserId === professionalFilter,
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const metrics = useMemo(() => {
    const source = isDemoMode ? demoEvents : realAppointments;
    return {
      total: source.length,
      completed: source.filter((appointment) => appointment.status === "completed").length,
      scheduled: source.filter((appointment) => appointment.status === "scheduled").length,
      telemedicine: source.filter((appointment) => appointment.appointmentType === "telemedicina" || appointment.modality === "telemedicina").length,
    };
  }, [isDemoMode, realAppointments]);
  const displayHours = useMemo(() => {
    const appointmentHours = visibleAppointments.map((appointment) => `${String(new Date(appointment.startsAt).getHours()).padStart(2, "0")}:00`);
    return [...new Set([...hours, ...appointmentHours])].sort();
  }, [visibleAppointments]);

  const openCreateDialog = () => {
    setEditingAppointment(null);
    setForm(buildEmptyForm(patients[0]?.id ?? ""));
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (appointment: AppointmentSummary) => {
    setEditingAppointment(appointment);
    setForm(formFromAppointment(appointment));
    setFormError(null);
    setDialogOpen(true);
  };

  const openStatusDialog = (appointment: AppointmentSummary, status: "completed" | "cancelled") => {
    setStatusAction({ appointment, status });
    setStatusActionError(null);
  };

  const updateForm = <K extends keyof AppointmentFormState>(key: K, value: AppointmentFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeTenantId) return;
    if (!form.patientId) {
      setFormError("Selecciona un paciente real.");
      return;
    }
    if (!form.date || !form.startTime || !form.endTime) {
      setFormError("Fecha y horario son obligatorios.");
      return;
    }

    const startsAt = toIsoFromLocalParts(form.date, form.startTime);
    const endsAt = toIsoFromLocalParts(form.date, form.endTime);
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setFormError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    const payload = {
      tenantId: activeTenantId,
      patientId: form.patientId,
      professionalUserId: form.professionalUserId || null,
      startsAt,
      endsAt,
      appointmentType: form.appointmentType,
      status: form.status,
      modality: form.modality || null,
      location: form.location || null,
      notes: form.notes || null,
    };

    try {
      if (editingAppointment) {
        await updateMutation.mutateAsync({ ...payload, appointmentId: editingAppointment.id });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la cita.");
    }
  };

  const handleStatusConfirm = async () => {
    if (!statusAction) return;
    setStatusActionError(null);
    try {
      const payload = { tenantId: statusAction.appointment.tenantId, appointmentId: statusAction.appointment.id };
      if (statusAction.status === "completed") {
        await completeMutation.mutateAsync(payload);
      } else {
        await cancelMutation.mutateAsync(payload);
      }
      setStatusAction(null);
    } catch (error) {
      setStatusActionError(error instanceof Error ? error.message : "No se pudo actualizar la cita.");
    }
  };

  if (tenantLoading) {
    return <AgendaState title="Agenda semanal" message="Cargando contexto institucional..." />;
  }

  if (!isDemoMode && !canRead) {
    return <AgendaState title="Agenda semanal" message="No tienes permiso para ver la agenda clínica de este tenant." />;
  }

  const isLoading = !isDemoMode && (appointmentsQuery.isLoading || patientsQuery.isLoading || teamQuery.isLoading);
  const errorMessage = !isDemoMode && (appointmentsQuery.error || upcomingQuery.error || patientsQuery.error)
    ? "No se pudo cargar la agenda desde Supabase."
    : null;

  return (
    <div>
      <PageHeader
        meta="Operación clínica"
        title="Agenda semanal"
        subtitle="Seguimientos, teleconsulta, reevaluaciones y controles programados."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isDemoMode && (
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
                DEMO
              </span>
            )}
            <Button variant="outline" size="sm" className="h-8" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" className="h-8 gap-2" onClick={openCreateDialog} disabled={!canCreate || isDemoMode || patients.length === 0}>
              <Plus className="h-3.5 w-3.5" />
              Nueva cita
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-4">
          <AgendaMetric label="Citas en la semana" value={String(metrics.total)} />
          <AgendaMetric label="Completadas" value={String(metrics.completed)} accent="text-risk-low" />
          <AgendaMetric label="Programadas" value={String(metrics.scheduled)} accent="text-primary" />
          <AgendaMetric label="Telemedicina" value={String(metrics.telemedicine)} accent="text-pack-gineco" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Semana {formatShortDate(weekStartIso)} - {formatShortDate(addDays(weekEnd, -1).toISOString())}
                </div>
                <h2 className="mt-1 text-[15px] font-medium">Agenda clínica del tenant</h2>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                Profesional
                <select
                  value={professionalFilter}
                  onChange={(event) => setProfessionalFilter(event.target.value)}
                  className="h-8 rounded-md border border-border bg-surface-raised px-2 text-[12px] text-foreground"
                >
                  <option value="all">Todos</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isLoading ? (
              <AgendaInlineState message="Cargando citas reales..." />
            ) : errorMessage ? (
              <AgendaInlineState message={errorMessage} />
            ) : !isDemoMode && visibleAppointments.length === 0 ? (
              <AgendaInlineState message="Este módulo aún no tiene citas reales configuradas para este tenant." />
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[1040px]">
                  <div className="grid grid-cols-[72px_repeat(7,minmax(132px,1fr))] border-b border-border bg-surface-raised/35">
                    <div className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Hora</div>
                    {weekDays.map((day, index) => (
                      <div key={day.toISOString()} className="border-l border-border px-3 py-3">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{dayLabels[index]}</div>
                        <div className="mt-1 text-[12px] text-foreground">{formatShortDate(day.toISOString())}</div>
                      </div>
                    ))}
                  </div>

                  {displayHours.map((hour) => (
                    <div key={hour} className="grid min-h-[92px] grid-cols-[72px_repeat(7,minmax(132px,1fr))] border-b border-border last:border-b-0">
                      <div className="px-3 py-3 text-[10px] font-mono text-muted-foreground">{hour}</div>
                      {weekDays.map((day) => {
                        const dayKey = formatDateInput(day);
                        const hourAppointments = visibleAppointments.filter((appointment) => {
                          const start = new Date(appointment.startsAt);
                          return formatDateInput(start) === dayKey && formatTimeInput(start).slice(0, 2) === hour.slice(0, 2);
                        });

                        return (
                          <div key={`${dayKey}-${hour}`} className="space-y-2 border-l border-border p-2">
                            {hourAppointments.map((appointment) => (
                              <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                canUpdate={canUpdate && !isDemoMode}
                                canCancel={canCancel && !isDemoMode}
                                canComplete={canComplete && !isDemoMode}
                                onEdit={openEditDialog}
                                onComplete={(item) => openStatusDialog(item, "completed")}
                                onCancel={(item) => openStatusDialog(item, "cancelled")}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="panel overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Próximas citas</div>
              <h3 className="mt-1 text-[15px] font-medium">Seguimientos programados</h3>
            </div>
            <div className="divide-y divide-border">
              {(isDemoMode ? demoEvents : upcomingAppointments).length === 0 ? (
                <div className="p-4 text-[13px] text-muted-foreground">No hay próximas citas reales registradas.</div>
              ) : (
                (isDemoMode ? demoEvents : upcomingAppointments).map((appointment) => (
                  <div key={appointment.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-semibold">{appointment.patientName}</div>
                        <div className="mt-1 text-[11px] font-mono text-muted-foreground">{appointment.patientMrn}</div>
                      </div>
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>
                    <div className="mt-3 text-[12px] text-muted-foreground">
                      {formatShortDate(appointment.startsAt)} · {formatHour(appointment.startsAt)} · {typeLabel(appointment.appointmentType)}
                    </div>
                    {appointment.location && <div className="mt-1 text-[11px] text-muted-foreground">{appointment.location}</div>}
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Editar cita" : "Nueva cita"}</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              Registra una cita real asociada a un paciente del tenant activo.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {formError && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{formError}</div>}

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Paciente">
                <select
                  value={form.patientId}
                  onChange={(event) => updateForm("patientId", event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]"
                  required
                >
                  <option value="">Seleccionar paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName} · {patient.mrn}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Profesional">
                <select
                  value={form.professionalUserId}
                  onChange={(event) => updateForm("professionalUserId", event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]"
                >
                  <option value="">Sin asignar</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha">
                <Input type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} required />
              </Field>
              <Field label="Tipo">
                <select
                  value={form.appointmentType}
                  onChange={(event) => updateForm("appointmentType", event.target.value as AppointmentType)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]"
                  required
                >
                  {appointmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hora inicio">
                <Input type="time" value={form.startTime} onChange={(event) => updateForm("startTime", event.target.value)} required />
              </Field>
              <Field label="Hora fin">
                <Input type="time" value={form.endTime} onChange={(event) => updateForm("endTime", event.target.value)} required />
              </Field>
              <Field label="Modalidad">
                <Input value={form.modality} onChange={(event) => updateForm("modality", event.target.value)} placeholder="Presencial, telemedicina..." />
              </Field>
              <Field label="Ubicación">
                <Input value={form.location} onChange={(event) => updateForm("location", event.target.value)} placeholder="Consulta externa, sala..." />
              </Field>
              {editingAppointment && (
                <Field label="Estado">
                  <select
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value as AppointmentStatus)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]"
                  >
                    <option value="scheduled">Programada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="no_show">No asistió</option>
                  </select>
                </Field>
              )}
            </div>

            <Field label="Notas">
              <Textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Motivo, indicaciones o preparación requerida." />
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Guardar cita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ActionDialog
        open={Boolean(statusAction)}
        onOpenChange={(open) => {
          if (!open) setStatusAction(null);
        }}
        title={statusAction?.status === "completed" ? "Completar cita" : "Cancelar cita"}
        description={
          statusAction
            ? `${statusAction.appointment.patientName} - ${formatShortDate(statusAction.appointment.startsAt)} ${formatHour(statusAction.appointment.startsAt)}`
            : undefined
        }
        loading={completeMutation.isPending || cancelMutation.isPending}
        error={statusActionError}
        destructive={statusAction?.status === "cancelled"}
        submitLabel={statusAction?.status === "completed" ? "Completar" : "Cancelar cita"}
        loadingLabel="Actualizando..."
        onSubmit={handleStatusConfirm}
      >
        <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2 text-[12px] text-muted-foreground">
          Esta accion se registrara en la agenda del tenant y mantendra al usuario en la misma pantalla.
        </div>
      </ActionDialog>
    </div>
  );
}

function AppointmentCard({
  appointment,
  canUpdate,
  canCancel,
  canComplete,
  onEdit,
  onComplete,
  onCancel,
}: {
  appointment: AppointmentSummary;
  canUpdate: boolean;
  canCancel: boolean;
  canComplete: boolean;
  onEdit: (appointment: AppointmentSummary) => void;
  onComplete: (appointment: AppointmentSummary) => void;
  onCancel: (appointment: AppointmentSummary) => void;
}) {
  const isClosed = appointment.status === "completed" || appointment.status === "cancelled";
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[12px] font-semibold text-foreground">{appointment.patientName}</div>
          <div className="mt-1 text-[10px] font-mono uppercase text-muted-foreground">
            {formatHour(appointment.startsAt)} · {typeLabel(appointment.appointmentType)}
          </div>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => onEdit(appointment)} disabled={!canUpdate}>
          <Edit3 className="mr-1 h-3 w-3" />
          Editar
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => onComplete(appointment)} disabled={!canComplete || isClosed}>
          <Check className="mr-1 h-3 w-3" />
          Completar
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => onCancel(appointment)} disabled={!canCancel || isClosed}>
          <X className="mr-1 h-3 w-3" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const color =
    status === "completed"
      ? "border-risk-low/40 bg-risk-low/10 text-risk-low"
      : status === "cancelled" || status === "no_show"
        ? "border-risk-high/40 bg-risk-high/10 text-risk-high"
        : "border-primary/40 bg-primary/10 text-primary";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${color}`}>
      {statusLabel(status)}
    </span>
  );
}

function AgendaState({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <PageHeader meta="Operación clínica" title={title} subtitle="Seguimientos, teleconsulta, reevaluaciones y controles programados." />
      <div className="p-6">
        <div className="panel flex min-h-[320px] items-center justify-center px-6 text-center">
          <div>
            <CalendarClock className="mx-auto h-6 w-6 text-primary" />
            <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Agenda</div>
            <div className="mt-2 text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgendaInlineState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-6 text-center text-[13px] text-muted-foreground">
      {message}
    </div>
  );
}

function AgendaMetric({ label, value, accent = "text-foreground" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="panel p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 text-3xl font-semibold tabular ${accent}`}>{value}</div>
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
