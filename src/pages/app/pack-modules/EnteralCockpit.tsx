import { useMemo, useState, type ReactNode } from "react";
import { Activity, FileDown, Pencil, Pause, Plus, Square } from "lucide-react";
import { ActionDialog } from "@/components/common/ActionDialog";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
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
import { enteralToleranceLabel } from "@/domain/clinical/enteralEngine";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  useCreateEnteralDailyLog,
  useCreateEnteralPlan,
  useEnteralCare,
  useExportEnteralReportAudit,
  useUpdateEnteralPlan,
  useUpdateEnteralPlanStatus,
} from "@/hooks/useSpecialtyModules";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useToast } from "@/hooks/use-toast";
import { exportEnteralPlanToPdf } from "@/lib/exportArtifacts";
import { formatClinicalValue, formatEnergyKcal, formatPercent, formatProteinG, formatVolumeMl } from "@/lib/formatters";
import type { AlertSummary, NutritionPlanSummary } from "@/services/clinicalService";
import type { EnteralPlanSummary } from "@/services/specialtyService";
import type { SaasPatientSnapshot } from "@/types/saas";
import { MetricGrid } from "./shared";

type PlanForm = {
  patientId: string;
  route: string;
  administrationMode: string;
  formulaName: string;
  formulaType: string;
  kcal: string;
  proteinG: string;
  volumeMl: string;
  rateMlH: string;
  flushWaterMl: string;
  startDate: string;
  status: string;
  notes: string;
  residualMl: string;
  deliveredVolumeMl: string;
  deliveredKcal: string;
  deliveredProteinG: string;
  adherencePct: string;
  toleranceStatus: string;
  observations: string;
};

const emptyPlanForm = (): PlanForm => ({
  patientId: "",
  route: "Sonda nasogástrica",
  administrationMode: "continua",
  formulaName: "",
  formulaType: "",
  kcal: "",
  proteinG: "",
  volumeMl: "",
  rateMlH: "",
  flushWaterMl: "",
  startDate: new Date().toISOString().slice(0, 10),
  status: "active",
  notes: "",
  residualMl: "",
  deliveredVolumeMl: "",
  deliveredKcal: "",
  deliveredProteinG: "",
  adherencePct: "",
  toleranceStatus: "En observación",
  observations: "",
});

export function EnteralCockpit({
  patients = [],
  alerts = [],
  plans = [],
}: {
  patients?: SaasPatientSnapshot[];
  alerts?: AlertSummary[];
  plans?: NutritionPlanSummary[];
}) {
  const { activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { toast } = useToast();
  const enteralQuery = useEnteralCare();
  const createEnteral = useCreateEnteralPlan();
  const updateEnteral = useUpdateEnteralPlan();
  const updateStatus = useUpdateEnteralPlanStatus();
  const createDailyLog = useCreateEnteralDailyLog();
  const exportAudit = useExportEnteralReportAudit();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EnteralPlanSummary | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<EnteralPlanSummary | null>(null);
  const [statusAction, setStatusAction] = useState<{ plan: EnteralPlanSummary; status: "active" | "paused" | "closed" } | null>(null);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyPlanForm);
  const [logForm, setLogForm] = useState({
    residualMl: "",
    deliveredVolumeMl: "",
    deliveredKcal: "",
    deliveredProteinG: "",
    adherencePct: "",
    diarrhea: false,
    vomiting: false,
    distension: false,
    aspirationEvent: false,
    toleranceStatus: "En observación",
    interruptions: "",
    observations: "",
  });

  const enteralResult = enteralQuery?.data;
  const enteralPlans = enteralResult?.data ?? [];
  const isEnteralLoading = enteralQuery?.isLoading ?? false;
  const isEnteralError = enteralQuery?.isError ?? false;
  const enteralSource = enteralResult?.source === "demo" ? "demo" : "real";
  const patientIds = new Set(patients.map((patient) => patient.id));
  const packEnteralPlans = enteralPlans.filter((plan) => patientIds.has(plan.patientId));
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const enteralAlerts = alerts.filter((alert) => alert.sourceType === "enteral");
  const canCreate = hasPermission("enteral.manage", "enteral.create");
  const canUpdate = hasPermission("enteral.manage", "enteral.update");
  const canLog = hasPermission("enteral.manage", "enteral.log");
  const canClose = hasPermission("enteral.manage", "enteral.close");
  const canExport = hasPermission("enteral.read", "enteral.manage");
  const activePlans = packEnteralPlans.filter((plan) => plan.status !== "closed");
  const lowVolumePlans = packEnteralPlans.filter((plan) => (plan.metrics?.volumeDeliveredPct ?? 100) < 80);
  const poorTolerancePlans = packEnteralPlans.filter((plan) => ["poor", "critical"].includes(plan.metrics?.toleranceStatus ?? ""));

  const patientNutritionPlans = useMemo(() => {
    return plans.filter((plan) => !form.patientId || plan.patientId === form.patientId);
  }, [form.patientId, plans]);

  function openCreate() {
    setEditingPlan(null);
    setForm(emptyPlanForm());
    setShowCreate(true);
  }

  function openEdit(plan: EnteralPlanSummary) {
    setEditingPlan(plan);
    setForm({
      patientId: plan.patientId,
      route: plan.route,
      administrationMode: plan.administrationMode,
      formulaName: plan.formulaName,
      formulaType: plan.formulaType ?? "",
      kcal: toFormNumber(plan.targetKcal),
      proteinG: toFormNumber(plan.targetProteinG),
      volumeMl: toFormNumber(plan.targetVolumeMl),
      rateMlH: toFormNumber(plan.infusionRateMlH),
      flushWaterMl: toFormNumber(plan.waterFlushMl),
      startDate: plan.startDate ?? new Date().toISOString().slice(0, 10),
      status: plan.status,
      notes: plan.notes ?? "",
      residualMl: "",
      deliveredVolumeMl: "",
      deliveredKcal: "",
      deliveredProteinG: "",
      adherencePct: "",
      toleranceStatus: plan.toleranceStatus ?? "En observación",
      observations: "",
    });
    setShowCreate(true);
  }

  async function handleSave() {
    if (!activeTenantId) {
      toast({ title: "No hay tenant activo", description: "Selecciona un tenant antes de guardar." });
      return;
    }
    if (editingPlan ? !canUpdate : !canCreate) {
      toast({ title: "Sin permisos", description: "Tu rol no puede modificar soporte enteral." });
      return;
    }

    const payload = {
      tenantId: activeTenantId,
      patientId: form.patientId,
      encounterId: null,
      nutritionPlanId: patientNutritionPlans[0]?.id ?? null,
      accessType: form.route,
      route: form.route,
      administrationMode: form.administrationMode,
      formulaName: form.formulaName,
      formulaType: form.formulaType || null,
      kcal: parseOptionalNumber(form.kcal),
      proteinG: parseOptionalNumber(form.proteinG),
      volumeMl: parseOptionalNumber(form.volumeMl),
      rateMlH: parseOptionalNumber(form.rateMlH),
      flushWaterMl: parseOptionalNumber(form.flushWaterMl),
      startDate: form.startDate || null,
      status: form.status,
      notes: form.notes || null,
      toleranceStatus: form.toleranceStatus || null,
      complications: [],
    };

    try {
      if (editingPlan) {
        await updateEnteral.mutateAsync({ ...payload, planId: editingPlan.id });
        toast({ title: "Soporte enteral actualizado", description: "Los cambios quedaron persistidos." });
      } else {
        await createEnteral.mutateAsync({
          ...payload,
          initialLog: {
            residualMl: parseOptionalNumber(form.residualMl),
            deliveredVolumeMl: parseOptionalNumber(form.deliveredVolumeMl),
            deliveredKcal: parseOptionalNumber(form.deliveredKcal),
            deliveredProteinG: parseOptionalNumber(form.deliveredProteinG),
            diarrhea: false,
            vomiting: false,
            distension: false,
            aspirationEvent: false,
            adherencePct: parseOptionalNumber(form.adherencePct),
            toleranceStatus: form.toleranceStatus || null,
            observations: form.observations || null,
          },
        });
        toast({ title: "Soporte enteral guardado", description: "El plan y el primer control quedaron persistidos." });
      }
      setShowCreate(false);
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

  async function handleSaveDailyLog() {
    if (!activeTenantId || !selectedPlan) {
      toast({ title: "No hay plan activo", description: "Selecciona un plan enteral antes de guardar tolerancia." });
      return;
    }
    if (!canLog) {
      toast({ title: "Sin permisos", description: "Tu rol no puede registrar controles enterales." });
      return;
    }

    try {
      await createDailyLog.mutateAsync({
        tenantId: activeTenantId,
        planId: selectedPlan.id,
        residualMl: parseOptionalNumber(logForm.residualMl),
        deliveredVolumeMl: parseOptionalNumber(logForm.deliveredVolumeMl),
        deliveredKcal: parseOptionalNumber(logForm.deliveredKcal),
        deliveredProteinG: parseOptionalNumber(logForm.deliveredProteinG),
        adherencePct: parseOptionalNumber(logForm.adherencePct),
        diarrhea: logForm.diarrhea,
        vomiting: logForm.vomiting,
        distension: logForm.distension,
        aspirationEvent: logForm.aspirationEvent,
        toleranceStatus: logForm.toleranceStatus || null,
        interruptions: logForm.interruptions || null,
        observations: logForm.observations || null,
        loggedAt: new Date().toISOString(),
      });
      toast({ title: "Control diario guardado", description: "La tolerancia enteral quedó registrada en Supabase." });
      setSelectedPlan(null);
      setLogForm({
        residualMl: "",
        deliveredVolumeMl: "",
        deliveredKcal: "",
        deliveredProteinG: "",
        adherencePct: "",
        diarrhea: false,
        vomiting: false,
        distension: false,
        aspirationEvent: false,
        toleranceStatus: "En observación",
        interruptions: "",
        observations: "",
      });
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "Revisa los datos e intenta nuevamente.",
        variant: "destructive",
      });
    }
  }

  async function handleStatus(plan: EnteralPlanSummary, status: "active" | "paused" | "closed") {
    if (!activeTenantId || !canClose) return;
    await updateStatus.mutateAsync({ tenantId: activeTenantId, planId: plan.id, status });
    toast({
      title: status === "paused" ? "Plan pausado" : status === "closed" ? "Plan cerrado" : "Plan activado",
      description: "El estado quedó persistido y auditado.",
    });
  }

  async function handleStatusConfirm() {
    if (!statusAction) return;
    setStatusActionError(null);
    try {
      await handleStatus(statusAction.plan, statusAction.status);
      setStatusAction(null);
    } catch (error) {
      setStatusActionError(error instanceof Error ? error.message : "No se pudo actualizar el estado enteral.");
    }
  }

  async function handleExportPlan(plan: EnteralPlanSummary) {
    if (!activeTenantId || !canExport) return;
    const patientName = patientMap.get(plan.patientId)?.fullName ?? "Paciente enteral";
    try {
      exportEnteralPlanToPdf(plan, patientName);
      await exportAudit.mutateAsync({ tenantId: activeTenantId, planId: plan.id, format: "pdf" });
    } catch (error) {
      toast({
        title: "No se pudo exportar",
        description: error instanceof Error ? error.message : "Revisa permisos y datos del plan enteral.",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <div className="space-y-3">
        <MetricGrid
          items={[
            { label: "Soporte enteral activo", value: activePlans.length, hint: "planes reales registrados" },
            { label: "Alertas de tolerancia", value: enteralAlerts.length, hint: "derivadas de logs reales" },
            { label: "Volumen bajo", value: lowVolumePlans.length, hint: "<80% entregado" },
            { label: "Mala tolerancia", value: poorTolerancePlans.length, hint: "síntomas o aspiración" },
          ]}
        />

        <div className="panel overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Cockpit enteral</div>
              <h3 className="mt-1 text-[16px] font-medium">Acceso, fórmula registrada manualmente, volumen y tolerancia</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Sin catálogo de fórmulas comerciales: los valores nutricionales se registran manualmente y quedan auditados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SourceStateBadge source={enteralSource} />
              <Button size="sm" onClick={openCreate} disabled={!canCreate} data-testid="enteral-new-support-button">
                <Plus className="h-4 w-4" />
                Nuevo soporte
              </Button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {!activeTenantId && (
              <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                Selecciona una organización activa para cargar el módulo enteral.
              </div>
            )}
            {activeTenantId === "__unused__" && (
              <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                Selecciona una organización activa para cargar el módulo enteral.
              </div>
            )}
            {activeTenantId && isEnteralLoading && (
              <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                Cargando soporte enteral del tenant activo...
              </div>
            )}
            {activeTenantId && isEnteralError && (
              <div className="px-5 py-10 text-center text-[13px] text-risk-critical">
                No se pudo cargar soporte enteral. Revisa permisos o conexión con Supabase.
              </div>
            )}
            {activeTenantId && !isEnteralLoading && !isEnteralError && packEnteralPlans.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                Este módulo aún no tiene soporte enteral real configurado para este tenant.
              </div>
            )}
            {packEnteralPlans.map((plan) => {
              const patient = patientMap.get(plan.patientId);
              const metrics = plan.metrics ?? {
                volumeDeliveredPct: null,
                toleranceStatus: plan.toleranceStatus ?? "unknown",
                flags: [],
              };
              return (
                <div
                  key={plan.id}
                  className="grid gap-4 px-5 py-4 xl:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_auto]"
                  data-testid="enteral-plan-row"
                  data-enteral-plan-id={plan.id}
                  data-enteral-formula-name={plan.formulaName}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {patient && <RiskDot level={patient.risk} />}
                      <span className="text-[13px] font-medium">{patient?.fullName ?? "Paciente enteral"}</span>
                      {patient && <RiskBadge level={patient.risk} />}
                      <StatusPill value={plan.status} />
                    </div>
                    <div className="mt-1 text-[12px] text-muted-foreground">
                      {patient?.diagnosisSummary ?? "Sin diagnóstico"} · {plan.route}
                    </div>
                  </div>
                  <div className="text-[12px]">
                    <div className="font-medium">{plan.formulaName}</div>
                    <div className="text-muted-foreground">
                      {formatEnergyKcal(plan.targetKcal)} · {formatProteinG(plan.targetProteinG)} proteína
                    </div>
                    <div className="mt-1 text-[10px] font-mono uppercase text-muted-foreground">
                      Fórmula registrada manualmente
                    </div>
                  </div>
                  <div className="text-[12px]">
                    <div className="font-medium">{formatVolumeMl(plan.targetVolumeMl)} objetivo</div>
                    <div className="text-muted-foreground">
                      {formatClinicalValue(plan.infusionRateMlH, "ml/h", "sin velocidad")} · {plan.administrationMode}
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-primary">
                      {formatPct(metrics.volumeDeliveredPct)}
                    </div>
                  </div>
                  <div className="text-[12px]">
                    <div className="font-medium">{enteralToleranceLabel(metrics.toleranceStatus)}</div>
                    <div className="text-muted-foreground">
                      {plan.latestLog?.gastricResidualMl != null ? `residuo ${formatVolumeMl(plan.latestLog.gastricResidualMl)}` : "sin log diario"}
                    </div>
                    {(metrics.flags ?? []).length > 0 && (
                      <div className="mt-1 text-[10px] font-mono uppercase text-risk-high">{(metrics.flags ?? []).join(" · ")}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(plan)} disabled={!canUpdate || plan.status === "closed"} data-testid="enteral-edit-button">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedPlan(plan)} disabled={!canLog || plan.status === "closed"} data-testid="enteral-control-button">
                      <Activity className="h-3.5 w-3.5" />
                      Control
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void handleExportPlan(plan)} disabled={!canExport || exportAudit.isPending} data-testid="enteral-export-pdf-button">
                      <FileDown className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                    {plan.status === "active" && (
                      <Button variant="outline" size="sm" onClick={() => setStatusAction({ plan, status: "paused" })} disabled={!canClose || updateStatus.isPending} data-testid="enteral-pause-button">
                        <Pause className="h-3.5 w-3.5" />
                        Pausar
                      </Button>
                    )}
                    {plan.status !== "closed" && (
                      <Button variant="outline" size="sm" onClick={() => setStatusAction({ plan, status: "closed" })} disabled={!canClose || updateStatus.isPending} data-testid="enteral-close-button">
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

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="right" className="w-[680px] overflow-y-auto sm:max-w-[680px]" data-testid="enteral-plan-drawer">
          <SheetHeader>
            <SheetTitle>{editingPlan ? "Editar soporte enteral" : "Nuevo soporte enteral"}</SheetTitle>
            <SheetDescription>Registra plan, objetivo y tolerancia inicial sin usar fórmulas comerciales inventadas.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Field label="Paciente">
              <Select value={form.patientId} onValueChange={(value) => setForm((current) => ({ ...current, patientId: value }))}>
                <SelectTrigger data-testid="enteral-patient-select"><SelectValue placeholder="Selecciona paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vía">
                <Select value={form.route} onValueChange={(value) => setForm((current) => ({ ...current, route: value }))}>
                  <SelectTrigger data-testid="enteral-route-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Sonda nasogástrica", "Sonda nasoyeyunal", "Gastrostomía", "Yeyunostomía", "Otra"].map((route) => (
                      <SelectItem key={route} value={route}>{route}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Modo">
                <Select value={form.administrationMode} onValueChange={(value) => setForm((current) => ({ ...current, administrationMode: value }))}>
                  <SelectTrigger data-testid="enteral-mode-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="continua">Continua</SelectItem>
                    <SelectItem value="intermitente">Intermitente</SelectItem>
                    <SelectItem value="bolo">Bolo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fórmula">
                <Input value={form.formulaName} onChange={(event) => setForm((current) => ({ ...current, formulaName: event.target.value }))} data-testid="enteral-formula-input" />
              </Field>
              <Field label="Tipo de fórmula">
                <Input value={form.formulaType} onChange={(event) => setForm((current) => ({ ...current, formulaType: event.target.value }))} placeholder="Polimérica, oligomérica..." data-testid="enteral-formula-type-input" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Energía objetivo (kcal)"><NumberInput value={form.kcal} onChange={(value) => setForm((current) => ({ ...current, kcal: value }))} testId="enteral-target-kcal-input" /></Field>
              <Field label="Proteína objetivo (g)"><NumberInput value={form.proteinG} onChange={(value) => setForm((current) => ({ ...current, proteinG: value }))} step="0.1" testId="enteral-target-protein-input" /></Field>
              <Field label="Volumen objetivo (ml)"><NumberInput value={form.volumeMl} onChange={(value) => setForm((current) => ({ ...current, volumeMl: value }))} testId="enteral-target-volume-input" /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Velocidad (ml/h)"><NumberInput value={form.rateMlH} onChange={(value) => setForm((current) => ({ ...current, rateMlH: value }))} step="0.1" testId="enteral-rate-input" /></Field>
              <Field label="Agua de lavado (ml)"><NumberInput value={form.flushWaterMl} onChange={(value) => setForm((current) => ({ ...current, flushWaterMl: value }))} testId="enteral-water-flush-input" /></Field>
              <Field label="Fecha inicio">
                <Input value={form.startDate} type="date" onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} data-testid="enteral-start-date-input" />
              </Field>
            </div>
            {editingPlan ? (
              <Field label="Estado">
                <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                  <SelectTrigger data-testid="enteral-status-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Volumen entregado (ml)"><NumberInput value={form.deliveredVolumeMl} onChange={(value) => setForm((current) => ({ ...current, deliveredVolumeMl: value }))} testId="enteral-initial-delivered-volume-input" /></Field>
                <Field label="Kcal entregadas"><NumberInput value={form.deliveredKcal} onChange={(value) => setForm((current) => ({ ...current, deliveredKcal: value }))} testId="enteral-initial-delivered-kcal-input" /></Field>
                <Field label="Adherencia (%)"><NumberInput value={form.adherencePct} onChange={(value) => setForm((current) => ({ ...current, adherencePct: value }))} min={0} max={100} testId="enteral-initial-adherence-input" /></Field>
              </div>
            )}
            <Field label="Notas">
              <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} data-testid="enteral-notes-input" />
            </Field>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createEnteral.isPending || updateEnteral.isPending || !form.patientId || !form.formulaName} data-testid="enteral-save-button">
              {createEnteral.isPending || updateEnteral.isPending ? "Guardando..." : "Guardar soporte"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedPlan)} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <SheetContent side="right" className="w-[560px] overflow-y-auto sm:max-w-[560px]" data-testid="enteral-log-drawer">
          <SheetHeader>
            <SheetTitle>Control diario enteral</SheetTitle>
            <SheetDescription>
              Registra aporte entregado y tolerancia para {selectedPlan ? patientMap.get(selectedPlan.patientId)?.fullName ?? "paciente enteral" : "paciente enteral"}.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Volumen entregado (ml)"><NumberInput value={logForm.deliveredVolumeMl} onChange={(value) => setLogForm((current) => ({ ...current, deliveredVolumeMl: value }))} testId="enteral-delivered-volume-input" /></Field>
              <Field label="Residuo gástrico (ml)"><NumberInput value={logForm.residualMl} onChange={(value) => setLogForm((current) => ({ ...current, residualMl: value }))} testId="enteral-gastric-residual-input" /></Field>
              <Field label="Kcal entregadas"><NumberInput value={logForm.deliveredKcal} onChange={(value) => setLogForm((current) => ({ ...current, deliveredKcal: value }))} testId="enteral-delivered-kcal-input" /></Field>
              <Field label="Proteína entregada (g)"><NumberInput value={logForm.deliveredProteinG} onChange={(value) => setLogForm((current) => ({ ...current, deliveredProteinG: value }))} step="0.1" testId="enteral-delivered-protein-input" /></Field>
              <Field label="Adherencia (%)"><NumberInput value={logForm.adherencePct} onChange={(value) => setLogForm((current) => ({ ...current, adherencePct: value }))} min={0} max={100} testId="enteral-adherence-input" /></Field>
              <Field label="Estado de tolerancia">
                <Input value={logForm.toleranceStatus} onChange={(event) => setLogForm((current) => ({ ...current, toleranceStatus: event.target.value }))} data-testid="enteral-tolerance-status-input" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ToggleBox label="Diarrea" checked={logForm.diarrhea} onChange={(checked) => setLogForm((current) => ({ ...current, diarrhea: checked }))} testId="enteral-diarrhea-checkbox" />
              <ToggleBox label="Vómito" checked={logForm.vomiting} onChange={(checked) => setLogForm((current) => ({ ...current, vomiting: checked }))} testId="enteral-vomiting-checkbox" />
              <ToggleBox label="Distensión" checked={logForm.distension} onChange={(checked) => setLogForm((current) => ({ ...current, distension: checked }))} testId="enteral-distension-checkbox" />
              <ToggleBox label="Aspiración" checked={logForm.aspirationEvent} onChange={(checked) => setLogForm((current) => ({ ...current, aspirationEvent: checked }))} testId="enteral-aspiration-checkbox" />
            </div>
            <Field label="Interrupciones">
              <Input value={logForm.interruptions} onChange={(event) => setLogForm((current) => ({ ...current, interruptions: event.target.value }))} data-testid="enteral-interruptions-input" />
            </Field>
            <Field label="Observaciones">
              <Input value={logForm.observations} onChange={(event) => setLogForm((current) => ({ ...current, observations: event.target.value }))} data-testid="enteral-log-notes-input" />
            </Field>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>Cancelar</Button>
            <Button onClick={handleSaveDailyLog} disabled={createDailyLog.isPending} data-testid="enteral-log-save-button">
              {createDailyLog.isPending ? "Guardando..." : "Guardar control"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ActionDialog
        open={Boolean(statusAction)}
        onOpenChange={(open) => {
          if (!open) setStatusAction(null);
        }}
        title={statusAction?.status === "closed" ? "Cerrar soporte enteral" : "Pausar soporte enteral"}
        description={
          statusAction
            ? `${patientMap.get(statusAction.plan.patientId)?.fullName ?? "Paciente enteral"} - ${statusAction.plan.formulaName}`
            : undefined
        }
        loading={updateStatus.isPending}
        error={statusActionError}
        destructive={statusAction?.status === "closed"}
        submitLabel={statusAction?.status === "closed" ? "Cerrar plan" : "Pausar plan"}
        loadingLabel="Actualizando..."
        onSubmit={handleStatusConfirm}
      >
        <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2 text-[12px] text-muted-foreground">
          Esta accion cambia el estado del plan y se mantiene dentro del cockpit enteral.
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

function NumberInput({
  value,
  onChange,
  step = "1",
  min = 0,
  max,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  step?: string;
  min?: number;
  max?: number;
  testId?: string;
}) {
  return <Input value={value} type="number" step={step} min={min} max={max} onChange={(event) => onChange(event.target.value)} data-testid={testId} />;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toFormNumber(value: number | null) {
  return value == null ? "" : String(value);
}

function formatPct(value: number | null) {
  return value == null ? "Sin entrega registrada" : `${formatPercent(value)} volumen entregado`;
}

function StatusPill({ value }: { value: string }) {
  const labels: Record<string, string> = {
    active: "Activo",
    paused: "Pausado",
    closed: "Cerrado",
  };
  return (
    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase text-primary">
      {labels[value] ?? value}
    </span>
  );
}

function ToggleBox({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (checked: boolean) => void; testId?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      data-testid={testId}
      className={`rounded-md border px-3 py-2 text-[12px] transition-colors ${
        checked ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface-raised/30 text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}
