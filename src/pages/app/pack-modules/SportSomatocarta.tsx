import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, FileText, Plus, Target, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ModuleState } from "@/components/common/ModuleState";
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
import { conservativeSportsRecommendation } from "@/domain/sports/somatotypeEngine";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useCreateSportsAssessment, useCreateSportsProfile, useSportsPerformance, useUpdateSportsProfile } from "@/hooks/useSports";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatMassKg, formatNumber, formatPercent } from "@/lib/formatters";
import type { NutritionPlanSummary } from "@/services/clinicalService";
import type { SportsAssessment, SportsCcorpSource, SportsProfile } from "@/services/sportsService";
import type { SaasPatientSnapshot } from "@/types/saas";

const NO_CCORP = "__none__";

export function SportSomatocarta({ patients, plans }: { patients: SaasPatientSnapshot[]; plans: NutritionPlanSummary[] }) {
  const { activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { toast } = useToast();
  const sportsQuery = useSportsPerformance();
  const createProfile = useCreateSportsProfile();
  const updateProfile = useUpdateSportsProfile();
  const createAssessment = useCreateSportsAssessment();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    discipline: "",
    category: "",
    position: "",
    objective: "",
    ccorpAssessmentId: NO_CCORP,
    fatPct: "",
    leanMassKg: "",
    skeletalMuscleKg: "",
    measuredAt: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const sportsData = sportsQuery.data?.data ?? { profiles: [], assessments: [], ccorpSources: [] };
  const profiles = sportsData.profiles;
  const assessments = sportsData.assessments;
  const ccorpSources = sportsData.ccorpSources;
  const patientMap = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients]);
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0] ?? null;
  const selectedPatient = selectedProfile ? patientMap.get(selectedProfile.patientId) ?? null : null;
  const selectedAssessments = selectedProfile
    ? assessments.filter((assessment) => assessment.patientId === selectedProfile.patientId)
    : [];
  const currentAssessment = selectedAssessments[0] ?? null;
  const currentSomatotype = currentAssessment?.somatotype ?? null;
  const ccorpForFormPatient = ccorpSources.filter((source) => source.patientId === form.patientId);
  const canManage = hasPermission("sports.manage", "sports.create", "sports.update");
  const isSaving = createProfile.isPending || updateProfile.isPending || createAssessment.isPending;
  const hasAssessmentPayload =
    form.ccorpAssessmentId !== NO_CCORP ||
    Boolean(form.fatPct.trim() || form.leanMassKg.trim() || form.skeletalMuscleKg.trim() || form.notes.trim());
  const planCountForPatient = selectedProfile
    ? plans.filter((plan) => plan.patientId === selectedProfile.patientId && plan.status !== "closed").length
    : 0;
  const bodyCompSeries = selectedAssessments
    .slice()
    .reverse()
    .map((assessment) => ({
      date: new Date(assessment.measuredAt).toLocaleDateString("es-BO", { month: "short", day: "2-digit" }),
      grasa: assessment.fatPct ?? null,
      magra: assessment.leanMassKg ?? null,
      musculo: assessment.skeletalMuscleKg ?? null,
    }));
  const somatotypePoints = selectedAssessments
    .filter((assessment) => assessment.somatotype.status === "ready" && assessment.somatotype.x !== null && assessment.somatotype.y !== null)
    .map((assessment) => ({
      id: assessment.id,
      label: new Date(assessment.measuredAt).toLocaleDateString("es-BO", { day: "2-digit", month: "short" }),
      x: assessment.somatotype.x as number,
      y: assessment.somatotype.y as number,
      current: assessment.id === currentAssessment?.id,
    }));

  useEffect(() => {
    if (!selectedProfileId && profiles[0]) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  function profileFor(patientId: string) {
    return profiles.find((profile) => profile.patientId === patientId) ?? null;
  }

  function openCreate(patientId = selectedProfile?.patientId ?? patients[0]?.id ?? "") {
    const existingProfile = profileFor(patientId);
    setForm({
      patientId,
      discipline: existingProfile?.discipline ?? "",
      category: existingProfile?.category ?? "",
      position: existingProfile?.position ?? "",
      objective: existingProfile?.objective ?? "",
      ccorpAssessmentId: NO_CCORP,
      fatPct: "",
      leanMassKg: "",
      skeletalMuscleKg: "",
      measuredAt: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setShowCreate(true);
  }

  function handlePatientChange(patientId: string) {
    const existingProfile = profileFor(patientId);
    setForm((current) => ({
      ...current,
      patientId,
      discipline: existingProfile?.discipline ?? "",
      category: existingProfile?.category ?? "",
      position: existingProfile?.position ?? "",
      objective: existingProfile?.objective ?? "",
      ccorpAssessmentId: NO_CCORP,
    }));
  }

  async function handleSave() {
    if (!activeTenantId) {
      toast({ title: "No hay tenant activo", description: "Selecciona una organización antes de guardar." });
      return;
    }
    if (!canManage) {
      toast({ title: "Sin permisos", description: "Tu rol no puede registrar datos deportivos." });
      return;
    }

    const existingProfile = profileFor(form.patientId);

    try {
      const profile = existingProfile
        ? await updateProfile.mutateAsync({
          tenantId: activeTenantId,
          profileId: existingProfile.id,
          patientId: form.patientId,
          discipline: form.discipline,
          category: form.category,
          position: form.position || null,
          objective: form.objective || null,
        })
        : await createProfile.mutateAsync({
          tenantId: activeTenantId,
          patientId: form.patientId,
          discipline: form.discipline,
          category: form.category,
          position: form.position || null,
          objective: form.objective || null,
        });

      await createAssessment.mutateAsync({
        tenantId: activeTenantId,
        patientId: form.patientId,
        ccorpAssessmentId: form.ccorpAssessmentId === NO_CCORP ? null : form.ccorpAssessmentId,
        fatPct: parseOptionalNumber(form.fatPct),
        leanMassKg: parseOptionalNumber(form.leanMassKg),
        skeletalMuscleKg: parseOptionalNumber(form.skeletalMuscleKg),
        measuredAt: new Date(`${form.measuredAt}T12:00:00`).toISOString(),
        notes: form.notes || null,
      });

      setSelectedProfileId(profile.id);
      setShowCreate(false);
      toast({ title: "Evaluación deportiva guardada", description: "Perfil y evaluación quedaron persistidos en Supabase." });
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "Revisa los datos e intenta nuevamente.",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="panel overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Deportistas</div>
            <h3 className="mt-1 text-[15px] font-medium">Perfiles deportivos reales</h3>
          </div>
          <div className="max-h-[620px] divide-y divide-border overflow-y-auto">
            {sportsQuery.isLoading && <StateBlock>Cargando perfiles deportivos...</StateBlock>}
            {!sportsQuery.isLoading && profiles.length === 0 && (
              <div className="p-4">
                <ModuleState
                  tone="empty"
                  title="Sin evaluaciones deportivas reales."
                  description="Este módulo aún no tiene evaluaciones deportivas reales configuradas para este tenant."
                />
              </div>
            )}
            {profiles.map((profile) => {
              const patient = patientMap.get(profile.patientId);
              const profileAssessments = assessments.filter((assessment) => assessment.patientId === profile.patientId);
              const latest = profileAssessments[0] ?? null;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`w-full px-4 py-3 text-left transition hover:bg-surface-raised/50 ${selectedProfile?.id === profile.id ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {patient && <RiskDot level={patient.risk} />}
                    <span className="text-[13px] font-semibold">{patient?.fullName ?? "Paciente deportivo"}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{profile.discipline} · {profile.category}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase text-muted-foreground">
                    <span>{latest ? formatDate(latest.measuredAt) : "Sin evaluación"}</span>
                    <span>{latest?.somatotype.status === "ready" ? "Somatocarta" : "Datos insuf."}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-border p-4">
            <Button className="w-full" size="sm" onClick={() => openCreate()} disabled={!canManage || patients.length === 0}>
              <Plus className="h-4 w-4" />
              Nueva evaluación deportiva
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Somatocarta
                </div>
                <h3 className="mt-1 text-[18px] font-semibold">
                  {selectedPatient?.fullName ?? "Módulo deportivo"}
                </h3>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {selectedProfile ? `${selectedProfile.discipline} · ${selectedProfile.category}` : "Crea un perfil para iniciar seguimiento deportivo."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <SourceStateBadge source={sportsQuery.data?.source === "supabase" ? "real" : "demo"} />
                {selectedProfile ? (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/app/reports?type=sports_performance&patient=${selectedProfile.patientId}`}>
                      <FileText className="h-3.5 w-3.5" />
                      Reporte deportivo
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled title="Requiere perfil deportivo real">
                    <FileText className="h-3.5 w-3.5" />
                    Reporte deportivo
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
              <SomatotypeChart points={somatotypePoints} />
              <div className="space-y-3">
                <MetricTile label="Endomorfia" value={formatNumber(currentSomatotype?.endomorphy, { fallback: "--" })} />
                <MetricTile label="Mesomorfia" value={formatNumber(currentSomatotype?.mesomorphy, { fallback: "--" })} />
                <MetricTile label="Ectomorfia" value={formatNumber(currentSomatotype?.ectomorphy, { fallback: "--" })} />
                <div className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Estado</div>
                  <div className="mt-1 text-[13px] font-medium">
                    {currentSomatotype?.status === "ready" ? currentSomatotype.label : "Datos insuficientes"}
                  </div>
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    {currentSomatotype?.message ?? "Datos antropométricos insuficientes para calcular somatotipo."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-[15px] font-medium">Evolución de composición corporal</h3>
            </div>
            <div className="h-[260px]">
              {bodyCompSeries.length === 0 ? (
                <ModuleState
                  tone="empty"
                  title="Sin evolución deportiva."
                  description="No hay evaluaciones deportivas persistidas para graficar evolución."
                  className="min-h-[240px]"
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bodyCompSeries} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="magra" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.10)" strokeWidth={2} />
                    <Area type="monotone" dataKey="grasa" stroke="hsl(var(--risk-high))" fill="hsl(var(--risk-high) / 0.06)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Historial</div>
              <h3 className="mt-1 text-[15px] font-medium">Evaluaciones deportivas</h3>
            </div>
            {selectedAssessments.length === 0 ? (
              <p className="px-5 py-8 text-[13px] text-muted-foreground">No hay evaluaciones deportivas para este paciente.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full tabular text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2.5 text-left font-normal">Fecha</th>
                      <th className="px-4 py-2.5 text-left font-normal">% grasa</th>
                      <th className="px-4 py-2.5 text-left font-normal">Masa magra</th>
                      <th className="px-4 py-2.5 text-left font-normal">Somatotipo</th>
                      <th className="px-4 py-2.5 text-left font-normal">Fuente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-surface-raised/40">
                        <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{formatDate(assessment.measuredAt)}</td>
                        <td className="px-4 py-3">{formatPercent(assessment.fatPct)}</td>
                        <td className="px-4 py-3">{formatMassKg(assessment.leanMassKg)}</td>
                        <td className="px-4 py-3">{assessment.somatotype.status === "ready" ? assessment.somatotype.label : "Datos insuficientes"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {assessment.notes?.includes("Fuente CCORP Nivel 1") ? "CCORP Nivel 1" : "Manual sin somatotipo"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-[15px] font-medium">Objetivo y contexto</h3>
            </div>
            <div className="mt-4 space-y-3">
              <ContextRow label="Disciplina" value={selectedProfile?.discipline ?? "--"} />
              <ContextRow label="Categoría" value={selectedProfile?.category ?? "--"} />
              <ContextRow label="Posición" value={selectedProfile?.position ?? "--"} />
              <ContextRow label="Objetivo" value={selectedProfile?.objective ?? "--"} />
              <ContextRow label="Planes activos" value={formatNumber(planCountForPatient, { maximumFractionDigits: 0 })} />
            </div>
          </div>

          <div className="panel p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Recomendación conservadora</div>
            <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
              {conservativeSportsRecommendation(currentSomatotype ?? { status: "insufficient_data", endomorphy: null, mesomorphy: null, ectomorphy: null, x: null, y: null, label: null, message: "" })}
            </p>
          </div>

          <div className="panel p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Fuentes antropométricas</div>
            <div className="mt-3 space-y-2">
              {selectedProfile ? ccorpSources.filter((source) => source.patientId === selectedProfile.patientId).slice(0, 4).map((source) => (
                <div key={source.id} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="text-[12px] font-medium">CCORP Nivel 1 · {formatDate(source.measuredAt)}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {source.endomorphy != null && source.mesomorphy != null && source.ectomorphy != null
                      ? `Somatotipo ${formatNumber(source.endomorphy, { fallback: "--" })}-${formatNumber(source.mesomorphy, {
                          fallback: "--",
                        })}-${formatNumber(source.ectomorphy, { fallback: "--" })}`
                      : "Resultado incompleto"}
                  </div>
                </div>
              )) : null}
              {(!selectedProfile || ccorpSources.filter((source) => source.patientId === selectedProfile.patientId).length === 0) && (
                <p className="text-[12px] text-muted-foreground">Sin CCORP completo asociado. La somatocarta queda condicionada a datos suficientes.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="right" className="w-[680px] overflow-y-auto sm:max-w-[680px]">
          <SheetHeader>
            <SheetTitle>Nueva evaluación deportiva</SheetTitle>
            <SheetDescription>
              Usa CCORP real cuando exista. Sin fuente antropométrica suficiente, la evaluación se guarda sin somatotipo ni punto de somatocarta.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Field label="Paciente">
              <Select value={form.patientId} onValueChange={handlePatientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona paciente real" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Disciplina">
                <Input value={form.discipline} onChange={(event) => setForm((current) => ({ ...current, discipline: event.target.value }))} />
              </Field>
              <Field label="Nivel / categoría">
                <Input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Posición / rol">
                <Input value={form.position} onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))} />
              </Field>
              <Field label="Objetivo">
                <Input value={form.objective} onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))} />
              </Field>
            </div>

            <Field label="Fuente CCORP para somatotipo">
              <Select value={form.ccorpAssessmentId} onValueChange={(value) => setForm((current) => ({ ...current, ccorpAssessmentId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin fuente CCORP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CCORP}>Sin fuente CCORP suficiente</SelectItem>
                  {ccorpForFormPatient.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {formatDate(source.measuredAt)} · {source.formulaVersion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="% grasa">
                <Input value={form.fatPct} type="number" min={0} step="0.1" onChange={(event) => setForm((current) => ({ ...current, fatPct: event.target.value }))} />
              </Field>
              <Field label="Masa magra (kg)">
                <Input value={form.leanMassKg} type="number" min={0} step="0.1" onChange={(event) => setForm((current) => ({ ...current, leanMassKg: event.target.value }))} />
              </Field>
              <Field label="Músculo esquelético (kg)">
                <Input value={form.skeletalMuscleKg} type="number" min={0} step="0.1" onChange={(event) => setForm((current) => ({ ...current, skeletalMuscleKg: event.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de evaluación">
                <Input value={form.measuredAt} type="date" onChange={(event) => setForm((current) => ({ ...current, measuredAt: event.target.value }))} />
              </Field>
              <Field label="Notas">
                <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </Field>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.patientId || !form.discipline || !form.category || !hasAssessmentPayload}
            >
              {isSaving ? "Guardando..." : "Guardar evaluación"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function SomatotypeChart({ points }: { points: Array<{ id: string; label: string; x: number; y: number; current: boolean }> }) {
  if (points.length === 0) {
    return (
      <ModuleState
        tone="warning"
        title="Datos antropométricos insuficientes."
        description="Datos antropométricos insuficientes para graficar somatocarta."
        className="min-h-[360px]"
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <svg viewBox="-8 -8 16 16" className="h-[360px] w-full">
        <line x1="-8" x2="8" y1="0" y2="0" stroke="hsl(var(--border))" strokeWidth="0.05" />
        <line x1="0" x2="0" y1="-8" y2="8" stroke="hsl(var(--border))" strokeWidth="0.05" />
        <text x="5.4" y="-0.35" fontSize="0.55" fill="hsl(var(--muted-foreground))">Ecto</text>
        <text x="-7.5" y="-0.35" fontSize="0.55" fill="hsl(var(--muted-foreground))">Endo</text>
        <text x="0.35" y="-7.2" fontSize="0.55" fill="hsl(var(--muted-foreground))">Meso</text>
        {[-6, -4, -2, 2, 4, 6].map((value) => (
          <g key={value}>
            <line x1={value} x2={value} y1="-8" y2="8" stroke="hsl(var(--border))" strokeWidth="0.02" strokeDasharray="0.18 0.18" />
            <line x1="-8" x2="8" y1={value} y2={value} stroke="hsl(var(--border))" strokeWidth="0.02" strokeDasharray="0.18 0.18" />
          </g>
        ))}
        {points.map((point) => (
          <g key={point.id}>
            <circle
              cx={Math.max(-7.5, Math.min(7.5, point.x))}
              cy={Math.max(-7.5, Math.min(7.5, -point.y))}
              r={point.current ? 0.32 : 0.22}
              fill={point.current ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              stroke="hsl(var(--background))"
              strokeWidth="0.08"
            />
            {point.current && (
              <text x={Math.max(-7.2, Math.min(6.5, point.x + 0.35))} y={Math.max(-7.2, Math.min(7.2, -point.y - 0.25))} fontSize="0.5" fill="hsl(var(--primary))">
                Actual
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-[20px] font-semibold">{value}</div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-2 last:border-b-0 last:pb-0">
      <span className="text-[11px] font-mono uppercase text-muted-foreground">{label}</span>
      <span className="text-right text-[13px] font-medium">{value}</span>
    </div>
  );
}

function StateBlock({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center p-4 text-center text-[13px] text-muted-foreground">
      {children}
    </div>
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

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
