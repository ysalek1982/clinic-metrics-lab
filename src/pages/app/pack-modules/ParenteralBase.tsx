import { useState, type ReactNode } from "react";
import { ClipboardList, Pencil, Plus, Square } from "lucide-react";
import { ActionDialog } from "@/components/common/ActionDialog";
import { ModuleState } from "@/components/common/ModuleState";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  useCloseParenteralPlan,
  useCreateParenteralMonitoringLog,
  useCreateParenteralPlan,
  useParenteralCare,
  useUpdateParenteralPlan,
} from "@/hooks/useSpecialtyModules";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useToast } from "@/hooks/use-toast";
import { formatClinicalValue, formatDate, formatVolumeMl } from "@/lib/formatters";
import type { ParenteralPlanSummary } from "@/services/specialtyService";
import type { SaasPatientSnapshot } from "@/types/saas";
import { MetricGrid } from "./shared";

type PlanForm = {
  patientId: string;
  startDate: string;
  status: "draft" | "active" | "closed";
  totalVolumeMl: string;
  glucoseG: string;
  aminoAcidsG: string;
  lipidsG: string;
  electrolytesNotes: string;
  micronutrientsNotes: string;
  monitoringNotes: string;
  prescribingPhysician: string;
};

type LogForm = {
  glucoseMgDl: string;
  triglyceridesMgDl: string;
  liverNotes: string;
  catheterNotes: string;
  complications: string;
  notes: string;
};

const emptyPlanForm = (): PlanForm => ({
  patientId: "",
  startDate: new Date().toISOString().slice(0, 10),
  status: "draft",
  totalVolumeMl: "",
  glucoseG: "",
  aminoAcidsG: "",
  lipidsG: "",
  electrolytesNotes: "",
  micronutrientsNotes: "",
  monitoringNotes: "",
  prescribingPhysician: "",
});

const emptyLogForm = (): LogForm => ({
  glucoseMgDl: "",
  triglyceridesMgDl: "",
  liverNotes: "",
  catheterNotes: "",
  complications: "",
  notes: "",
});

export function ParenteralBase({ patients = [] }: { patients?: SaasPatientSnapshot[] }) {
  const { activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { toast } = useToast();
  const parenteralQuery = useParenteralCare();
  const createPlan = useCreateParenteralPlan();
  const updatePlan = useUpdateParenteralPlan();
  const createLog = useCreateParenteralMonitoringLog();
  const closePlan = useCloseParenteralPlan();
  const [showPlan, setShowPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ParenteralPlanSummary | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ParenteralPlanSummary | null>(null);
  const [closingPlan, setClosingPlan] = useState<ParenteralPlanSummary | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyPlanForm);
  const [logForm, setLogForm] = useState<LogForm>(emptyLogForm);

  const result = parenteralQuery.data;
  const parenteralPlans = result?.data ?? [];
  const source = result?.source === "demo" ? "demo" : "real";
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const activePlans = parenteralPlans.filter((plan) => plan.status !== "closed");
  const monitoredPlans = parenteralPlans.filter((plan) => plan.latestLog);
  const canRead = hasPermission("parenteral.read", "parenteral.manage");
  const canCreate = hasPermission("parenteral.create", "parenteral.manage");
  const canUpdate = hasPermission("parenteral.update", "parenteral.manage");
  const canLog = hasPermission("parenteral.log", "parenteral.manage");
  const canClose = hasPermission("parenteral.close", "parenteral.manage");
  const planHasInvalidNumbers = hasNegativeNumber([
    form.totalVolumeMl,
    form.glucoseG,
    form.aminoAcidsG,
    form.lipidsG,
  ]);
  const logHasInvalidNumbers = hasNegativeNumber([logForm.glucoseMgDl, logForm.triglyceridesMgDl]);

  function openCreate() {
    setEditingPlan(null);
    setForm(emptyPlanForm());
    setShowPlan(true);
  }

  function openEdit(plan: ParenteralPlanSummary) {
    setEditingPlan(plan);
    setForm({
      patientId: plan.patientId,
      startDate: plan.startDate ?? new Date().toISOString().slice(0, 10),
      status: (["draft", "active", "closed"].includes(plan.status) ? plan.status : "draft") as PlanForm["status"],
      totalVolumeMl: toFormNumber(plan.totalVolumeMl),
      glucoseG: toFormNumber(plan.glucoseG),
      aminoAcidsG: toFormNumber(plan.aminoAcidsG),
      lipidsG: toFormNumber(plan.lipidsG),
      electrolytesNotes: plan.electrolytesNotes ?? "",
      micronutrientsNotes: plan.micronutrientsNotes ?? "",
      monitoringNotes: plan.monitoringNotes ?? "",
      prescribingPhysician: plan.prescribingPhysician ?? "",
    });
    setShowPlan(true);
  }

  async function handleSavePlan() {
    if (!activeTenantId) {
      toast({ title: "No hay tenant activo", description: "Selecciona una organización activa antes de guardar." });
      return;
    }
    if (editingPlan ? !canUpdate : !canCreate) {
      toast({ title: "Sin permisos", description: "Tu rol no puede modificar soporte parenteral." });
      return;
    }
    if (!form.patientId) {
      toast({ title: "Paciente requerido", description: "Selecciona un paciente real para crear el plan." });
      return;
    }
    if (planHasInvalidNumbers) {
      toast({ title: "Valores no válidos", description: "Los campos numéricos no pueden ser negativos.", variant: "destructive" });
      return;
    }

    const payload = {
      tenantId: activeTenantId,
      patientId: form.patientId,
      startDate: form.startDate || null,
      status: form.status,
      totalVolumeMl: parseOptionalNumber(form.totalVolumeMl),
      glucoseG: parseOptionalNumber(form.glucoseG),
      aminoAcidsG: parseOptionalNumber(form.aminoAcidsG),
      lipidsG: parseOptionalNumber(form.lipidsG),
      electrolytesNotes: form.electrolytesNotes || null,
      micronutrientsNotes: form.micronutrientsNotes || null,
      monitoringNotes: form.monitoringNotes || null,
      prescribingPhysician: form.prescribingPhysician || null,
    };

    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ ...payload, planId: editingPlan.id });
        toast({ title: "Plan parenteral actualizado", description: "Los cambios quedaron persistidos y auditados." });
      } else {
        await createPlan.mutateAsync(payload);
        toast({ title: "Plan parenteral creado", description: "Base funcional controlada registrada en Supabase." });
      }
      setShowPlan(false);
      setEditingPlan(null);
      setForm(emptyPlanForm());
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "Revisa los datos e intenta nuevamente.",
        variant: "destructive",
      });
    }
  }

  async function handleSaveLog() {
    if (!activeTenantId || !selectedPlan) return;
    if (!canLog) {
      toast({ title: "Sin permisos", description: "Tu rol no puede registrar monitoreo parenteral." });
      return;
    }
    if (logHasInvalidNumbers) {
      toast({ title: "Valores no válidos", description: "El monitoreo no acepta valores negativos.", variant: "destructive" });
      return;
    }

    try {
      await createLog.mutateAsync({
        tenantId: activeTenantId,
        planId: selectedPlan.id,
        loggedAt: new Date().toISOString(),
        glucoseMgDl: parseOptionalNumber(logForm.glucoseMgDl),
        triglyceridesMgDl: parseOptionalNumber(logForm.triglyceridesMgDl),
        liverNotes: logForm.liverNotes || null,
        catheterNotes: logForm.catheterNotes || null,
        complications: logForm.complications || null,
        notes: logForm.notes || null,
      });
      toast({ title: "Monitoreo parenteral guardado", description: "El log quedó persistido y auditado." });
      setSelectedPlan(null);
      setLogForm(emptyLogForm());
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "Revisa los datos e intenta nuevamente.",
        variant: "destructive",
      });
    }
  }

  async function handleClose(plan: ParenteralPlanSummary) {
    if (!activeTenantId || !canClose) return;
    await closePlan.mutateAsync({ tenantId: activeTenantId, planId: plan.id, notes: plan.monitoringNotes });
    toast({ title: "Plan parenteral cerrado", description: "El estado quedó persistido y auditado." });
  }

  async function handleConfirmClose() {
    if (!closingPlan) return;
    setCloseError(null);
    try {
      await handleClose(closingPlan);
      setClosingPlan(null);
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : "No se pudo cerrar el plan parenteral.");
    }
  }

  if (!canRead) {
    return (
      <ModuleState
        tone="forbidden"
        title="No tienes permiso para ver soporte parenteral."
        description="Solicita el permiso parenteral.read o parenteral.manage a un administrador."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        <MetricGrid
          items={[
            { label: "Planes parenterales", value: parenteralPlans.length, hint: "base funcional controlada" },
            { label: "Activos o borrador", value: activePlans.length, hint: "sin cerrar" },
            { label: "Con monitoreo", value: monitoredPlans.length, hint: "logs reales" },
            { label: "Avanzado", value: "No", hint: "sin osmolaridad ni electrolitos calculados" },
          ]}
        />

        <div className="panel overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Soporte parenteral</div>
              <h3 className="mt-1 text-[16px] font-medium">Base funcional controlada, no parenteral avanzado</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Registra macros y monitoreo real sin calcular osmolaridad, electrolitos ni dosificación avanzada.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SourceStateBadge source={source} />
              <Button size="sm" onClick={openCreate} disabled={!canCreate} data-testid="parenteral-new-plan-button">
                <Plus className="h-4 w-4" />
                Nuevo plan
              </Button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {!activeTenantId && (
              <div className="px-5 py-5">
                <ModuleState
                  tone="warning"
                  title="No hay organización activa seleccionada."
                  description="Selecciona una organización para cargar planes parenterales reales."
                />
              </div>
            )}
            {activeTenantId && parenteralQuery.isLoading && (
              <div className="px-5 py-5">
                <ModuleState tone="loading" title="Cargando soporte parenteral..." description="Consultando planes y monitoreos reales." />
              </div>
            )}
            {activeTenantId && parenteralQuery.isError && (
              <div className="px-5 py-5">
                <ModuleState
                  tone="error"
                  title="No se pudo cargar soporte parenteral."
                  description="Revisa permisos o conexión con Supabase. El módulo no usa datos demo con sesión autenticada."
                />
              </div>
            )}
            {activeTenantId && !parenteralQuery.isLoading && !parenteralQuery.isError && parenteralPlans.length === 0 && (
              <div className="px-5 py-5">
                <ModuleState
                  tone="empty"
                  title="No hay planes parenterales registrados."
                  description="Este módulo aún no tiene planes parenterales reales configurados para este tenant."
                />
              </div>
            )}
            {parenteralPlans.map((plan) => {
              const patient = patientMap.get(plan.patientId);
              return (
                <div key={plan.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[1fr_0.8fr_0.9fr_auto]" data-testid="parenteral-plan-row">
                  <div>
                    <div className="text-[13px] font-medium">{patient?.fullName ?? "Paciente parenteral"}</div>
                    <div className="mt-1 text-[12px] text-muted-foreground">
                      {plan.prescribingPhysician || "Sin médico prescriptor"} - inicio {formatDate(plan.startDate, "sin fecha")}
                    </div>
                    <StatusPill value={plan.status} />
                  </div>
                  <div className="text-[12px]">
                    <div className="font-medium">{formatVolumeMl(plan.totalVolumeMl)}</div>
                    <div className="text-muted-foreground">
                      G {formatClinicalValue(plan.glucoseG, "g", "-")} - AA {formatClinicalValue(plan.aminoAcidsG, "g", "-")} - Lip{" "}
                      {formatClinicalValue(plan.lipidsG, "g", "-")}
                    </div>
                  </div>
                  <div className="text-[12px]">
                    <div className="font-medium">Último monitoreo</div>
                    <div className="text-muted-foreground">
                      {plan.latestLog
                        ? `Glu ${formatClinicalValue(plan.latestLog.glucoseMgDl, "mg/dL", "-")} - TG ${formatClinicalValue(
                            plan.latestLog.triglyceridesMgDl,
                            "mg/dL",
                            "-",
                          )}`
                        : "sin log"}
                    </div>
                    {plan.latestLog?.complications && <div className="mt-1 text-risk-high">{plan.latestLog.complications}</div>}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(plan)} disabled={!canUpdate || plan.status === "closed"} data-testid="parenteral-edit-button">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedPlan(plan)} disabled={!canLog || plan.status === "closed"} data-testid="parenteral-log-button">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Monitoreo
                    </Button>
                    {plan.status !== "closed" && (
                      <Button variant="outline" size="sm" onClick={() => setClosingPlan(plan)} disabled={!canClose || closePlan.isPending} data-testid="parenteral-close-button">
                        <Square className="h-3.5 w-3.5" />
                        Cerrar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Sheet open={showPlan} onOpenChange={setShowPlan}>
        <SheetContent side="right" className="w-[calc(100vw-16px)] overflow-y-auto sm:max-w-[680px]" data-testid="parenteral-plan-drawer">
          <SheetHeader>
            <SheetTitle>{editingPlan ? "Editar plan parenteral" : "Nuevo plan parenteral"}</SheetTitle>
            <SheetDescription>Registro básico sin dosificación avanzada ni osmolaridad calculada.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Field label="Paciente">
              <Select value={form.patientId} onValueChange={(value) => setForm((current) => ({ ...current, patientId: value }))}>
                <SelectTrigger data-testid="parenteral-patient-select"><SelectValue placeholder="Selecciona paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Fecha inicio">
                <Input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} data-testid="parenteral-start-date-input" />
              </Field>
              <Field label="Estado">
                <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as PlanForm["status"] }))}>
                  <SelectTrigger data-testid="parenteral-status-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Field label="Volumen total (ml)"><NumberInput value={form.totalVolumeMl} onChange={(value) => setForm((current) => ({ ...current, totalVolumeMl: value }))} testId="parenteral-volume-input" /></Field>
              <Field label="Glucosa (g)"><NumberInput value={form.glucoseG} onChange={(value) => setForm((current) => ({ ...current, glucoseG: value }))} testId="parenteral-glucose-input" /></Field>
              <Field label="Aminoácidos (g)"><NumberInput value={form.aminoAcidsG} onChange={(value) => setForm((current) => ({ ...current, aminoAcidsG: value }))} testId="parenteral-amino-input" /></Field>
              <Field label="Lípidos (g)"><NumberInput value={form.lipidsG} onChange={(value) => setForm((current) => ({ ...current, lipidsG: value }))} testId="parenteral-lipids-input" /></Field>
            </div>
            <Field label="Médico prescriptor">
              <Input value={form.prescribingPhysician} onChange={(event) => setForm((current) => ({ ...current, prescribingPhysician: event.target.value }))} data-testid="parenteral-physician-input" />
            </Field>
            <Field label="Notas de electrolitos">
              <Input value={form.electrolytesNotes} onChange={(event) => setForm((current) => ({ ...current, electrolytesNotes: event.target.value }))} data-testid="parenteral-electrolytes-input" />
            </Field>
            <Field label="Notas de micronutrientes">
              <Input value={form.micronutrientsNotes} onChange={(event) => setForm((current) => ({ ...current, micronutrientsNotes: event.target.value }))} data-testid="parenteral-micronutrients-input" />
            </Field>
            <Field label="Monitoreo indicado">
              <Input value={form.monitoringNotes} onChange={(event) => setForm((current) => ({ ...current, monitoringNotes: event.target.value }))} data-testid="parenteral-monitoring-input" />
            </Field>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowPlan(false)}>Cancelar</Button>
            <Button onClick={() => void handleSavePlan()} disabled={createPlan.isPending || updatePlan.isPending || !form.patientId} data-testid="parenteral-save-button">
              {createPlan.isPending || updatePlan.isPending ? "Guardando..." : "Guardar plan"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedPlan)} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <SheetContent side="right" className="w-[calc(100vw-16px)] overflow-y-auto sm:max-w-[560px]" data-testid="parenteral-log-drawer">
          <SheetHeader>
            <SheetTitle>Monitoreo parenteral</SheetTitle>
            <SheetDescription>Registro básico de glucosa, triglicéridos y observaciones de seguridad.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Glucosa (mg/dL)"><NumberInput value={logForm.glucoseMgDl} onChange={(value) => setLogForm((current) => ({ ...current, glucoseMgDl: value }))} testId="parenteral-log-glucose-input" /></Field>
              <Field label="Triglicéridos (mg/dL)"><NumberInput value={logForm.triglyceridesMgDl} onChange={(value) => setLogForm((current) => ({ ...current, triglyceridesMgDl: value }))} testId="parenteral-log-triglycerides-input" /></Field>
            </div>
            <Field label="Notas hepáticas">
              <Input value={logForm.liverNotes} onChange={(event) => setLogForm((current) => ({ ...current, liverNotes: event.target.value }))} data-testid="parenteral-log-liver-input" />
            </Field>
            <Field label="Notas de catéter">
              <Input value={logForm.catheterNotes} onChange={(event) => setLogForm((current) => ({ ...current, catheterNotes: event.target.value }))} data-testid="parenteral-log-catheter-input" />
            </Field>
            <Field label="Complicaciones">
              <Input value={logForm.complications} onChange={(event) => setLogForm((current) => ({ ...current, complications: event.target.value }))} data-testid="parenteral-log-complications-input" />
            </Field>
            <Field label="Notas">
              <Input value={logForm.notes} onChange={(event) => setLogForm((current) => ({ ...current, notes: event.target.value }))} data-testid="parenteral-log-notes-input" />
            </Field>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>Cancelar</Button>
            <Button onClick={() => void handleSaveLog()} disabled={createLog.isPending} data-testid="parenteral-log-save-button">
              {createLog.isPending ? "Guardando..." : "Guardar monitoreo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ActionDialog
        open={Boolean(closingPlan)}
        onOpenChange={(open) => {
          if (!open) setClosingPlan(null);
        }}
        title="Cerrar plan parenteral"
        description={closingPlan ? patientMap.get(closingPlan.patientId)?.fullName ?? "Paciente parenteral" : undefined}
        loading={closePlan.isPending}
        error={closeError}
        destructive
        submitLabel="Cerrar plan"
        loadingLabel="Cerrando..."
        onSubmit={handleConfirmClose}
      >
        <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2 text-[12px] text-muted-foreground">
          Esta accion cierra el plan parenteral basico y conserva el historial de monitoreo.
        </div>
      </ActionDialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-[12px] font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function NumberInput({ value, onChange, testId }: { value: string; onChange: (value: string) => void; testId?: string }) {
  return (
    <Input
      value={value}
      type="number"
      inputMode="decimal"
      min={0}
      step="0.1"
      onChange={(event) => onChange(event.target.value)}
      data-testid={testId}
    />
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toFormNumber(value: number | null) {
  return value == null ? "" : String(value);
}

function hasNegativeNumber(values: string[]) {
  return values.some((value) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) < 0);
}

function StatusPill({ value }: { value: string }) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    active: "Activo",
    closed: "Cerrado",
  };
  return (
    <span className="mt-2 inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase text-primary">
      {labels[value] ?? value}
    </span>
  );
}
