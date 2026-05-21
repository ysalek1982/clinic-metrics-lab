import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus, Printer } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge } from "@/components/common/RiskBadge";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateAgeAtDate,
  calculatePediatricBmi,
  evaluatePediatricGrowth,
  prepareGrowthChartSeries,
  type GrowthIndicatorCode,
} from "@/domain/clinical/pediatricGrowthEngine";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useGrowthReferences } from "@/hooks/useGrowthReferences";
import { usePediatricGrowthPatients, usePediatricGrowthRecords, useSavePediatricGrowthRecord } from "@/hooks/usePediatricGrowth";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useToast } from "@/hooks/use-toast";
import { resolveViewSource } from "@/lib/view-source";
import type { PediatricGrowthRecord } from "@/services/pediatricGrowthService";

const INDICATORS: Array<{ code: GrowthIndicatorCode; label: string; unit: string }> = [
  { code: "weight_for_age", label: "Peso/Edad", unit: "kg" },
  { code: "height_for_age", label: "Talla/Edad", unit: "cm" },
  { code: "weight_for_length_height", label: "Peso/Talla", unit: "kg" },
  { code: "bmi_for_age", label: "IMC/Edad", unit: "kg/m²" },
  { code: "head_circumference_for_age", label: "Perímetro cefálico", unit: "cm" },
  { code: "arm_circumference_for_age", label: "Perímetro braquial", unit: "cm" },
];

const SEX_LABELS = {
  female: "Femenino",
  male: "Masculino",
  other: "No especificado",
};

type MeasurementFormState = {
  measuredAt: string;
  weightKg: string;
  lengthCm: string;
  heightCm: string;
  headCircumferenceCm: string;
  armCircumferenceCm: string;
  tricepsSkinfoldMm: string;
  subscapularSkinfoldMm: string;
  notes: string;
};

const emptyMeasurementForm = (): MeasurementFormState => ({
  measuredAt: new Date().toISOString().slice(0, 10),
  weightKg: "",
  lengthCm: "",
  heightCm: "",
  headCircumferenceCm: "",
  armCircumferenceCm: "",
  tricepsSkinfoldMm: "",
  subscapularSkinfoldMm: "",
  notes: "",
});

export default function PediatricCurves() {
  const { isAuthenticated } = useAuth();
  const { activeTenant, activeTenantId, setActivePack } = useTenantRuntime();
  const { hasPermission, isPlatformSuperadmin } = useAuthorization();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(() => searchParams.get("patient"));
  const [selectedIndicator, setSelectedIndicator] = useState<GrowthIndicatorCode>("weight_for_age");
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [form, setForm] = useState<MeasurementFormState>(() => emptyMeasurementForm());
  const [validationError, setValidationError] = useState<string | null>(null);

  const patientsQuery = usePediatricGrowthPatients();
  const referencesQuery = useGrowthReferences("pediatric");
  const recordsQuery = usePediatricGrowthRecords(selectedPatientId);
  const saveGrowthRecord = useSavePediatricGrowthRecord();

  const patients = useMemo(() => patientsQuery.data?.patients ?? [], [patientsQuery.data?.patients]);
  const records = useMemo(() => recordsQuery.data?.records ?? [], [recordsQuery.data?.records]);
  const references = referencesQuery.data;
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0] ?? null;
  const canRead = isPlatformSuperadmin || hasPermission("pediatric_growth.read");
  const canCreate = isPlatformSuperadmin || hasPermission("pediatric_growth.create");
  const pediatricPackEnabled = activeTenant?.enabledPacks?.includes("pediatric") ?? false;
  const pediatricModuleEnabled =
    activeTenant?.enabledModules?.some((module) => module.moduleId === "pediatric_curves" && module.enabled) ?? false;

  useEffect(() => {
    setActivePack("pediatric");
  }, [setActivePack]);

  useEffect(() => {
    const patientId = searchParams.get("patient");
    if (patientId && patientId !== selectedPatientId) {
      setSelectedPatientId(patientId);
    }
  }, [searchParams, selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId && patients[0]?.id) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  const latestRecord = records.at(-1) ?? null;
  const exactAge = useMemo(() => {
    if (!selectedPatient?.birthDate || !latestRecord?.measuredAt) return null;
    try {
      return calculateAgeAtDate(selectedPatient.birthDate, latestRecord.measuredAt);
    } catch {
      return null;
    }
  }, [latestRecord?.measuredAt, selectedPatient?.birthDate]);

  const evaluation = useMemo(() => {
    if (!selectedPatient?.birthDate || !latestRecord || !references) return null;
    return evaluatePediatricGrowth({
      patient: {
        birthDate: selectedPatient.birthDate,
        sex: selectedPatient.sex,
      },
      measurement: latestRecord.measurement,
      policies: references.policies,
      referenceSets: references.referenceSets,
      referencePoints: references.referencePoints,
    });
  }, [latestRecord, references, selectedPatient]);

  const selectedResult = evaluation?.indicators.find((indicator) => indicator.indicatorCode === selectedIndicator) ?? null;
  const currentReferenceSet = references?.referenceSets.find((set) => set.id === selectedResult?.referenceId) ?? null;
  const selectedReferencePoints = useMemo(() => {
    if (!references || !selectedResult?.referenceId || selectedResult.referenceStatus !== "complete") return [];
    return references.referencePoints.filter((point) => point.referenceSetId === selectedResult.referenceId);
  }, [references, selectedResult?.referenceId, selectedResult?.referenceStatus]);

  const patientChartPoints = useMemo(
    () =>
      records
        .map((record) => ({
          x: resolveAxisValue(record, selectedIndicator),
          value: resolveMeasurementValue(record, selectedIndicator),
          measuredAt: record.measuredAt,
        }))
        .filter((point): point is { x: number; value: number; measuredAt: string } => point.x != null && point.value != null),
    [records, selectedIndicator],
  );

  const chartData = useMemo(() => {
    if (selectedReferencePoints.length === 0) {
      return patientChartPoints.map((point) => ({ x: point.x, patient: point.value, measuredAt: point.measuredAt }));
    }

    return prepareGrowthChartSeries(selectedReferencePoints, patientChartPoints);
  }, [patientChartPoints, selectedReferencePoints]);

  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [patientsQuery.data?.source, recordsQuery.data?.source, referencesQuery.data?.source],
  });

  if (!canRead) {
    return (
      <StatePanel
        title="Sin permisos"
        body="Tu rol activo no permite consultar curvas pediátricas. Solicita el permiso pediatric_growth.read."
      />
    );
  }

  if (!pediatricPackEnabled || !pediatricModuleEnabled) {
    return (
      <StatePanel
        title="Módulo no habilitado"
        body="El tenant activo no tiene habilitado el pack pediátrico o el módulo de curvas. Actívalo desde Configuración > Packs y módulos."
      />
    );
  }

  const loading = patientsQuery.isLoading || referencesQuery.isLoading || (Boolean(selectedPatientId) && recordsQuery.isLoading);
  const error = patientsQuery.error ?? referencesQuery.error ?? recordsQuery.error;

  const updateForm = (key: keyof MeasurementFormState, value: string) => {
    setValidationError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSaveMeasurement = async () => {
    if (!activeTenantId) {
      setValidationError("No hay tenant activo.");
      return;
    }

    if (!selectedPatient) {
      setValidationError("Selecciona un paciente pediátrico.");
      return;
    }

    if (!references) {
      setValidationError("No se pudieron cargar referencias de crecimiento.");
      return;
    }

    const weightKg = parseOptionalNumber(form.weightKg);
    const lengthCm = parseOptionalNumber(form.lengthCm);
    const heightCm = parseOptionalNumber(form.heightCm);
    const headCircumferenceCm = parseOptionalNumber(form.headCircumferenceCm);
    const armCircumferenceCm = parseOptionalNumber(form.armCircumferenceCm);
    const tricepsSkinfoldMm = parseOptionalNumber(form.tricepsSkinfoldMm);
    const subscapularSkinfoldMm = parseOptionalNumber(form.subscapularSkinfoldMm);
    const numericValues = [weightKg, lengthCm, heightCm, headCircumferenceCm, armCircumferenceCm, tricepsSkinfoldMm, subscapularSkinfoldMm];

    if (!form.measuredAt) {
      setValidationError("La fecha de medición es obligatoria.");
      return;
    }

    if (numericValues.some((value) => value !== null && value <= 0)) {
      setValidationError("Las mediciones deben ser mayores que cero.");
      return;
    }

    if (numericValues.every((value) => value === null)) {
      setValidationError("Registra al menos una medición pediátrica.");
      return;
    }

    if (lengthCm && heightCm) {
      setValidationError("Usa longitud o talla, no ambas en el mismo control.");
      return;
    }

    try {
      await saveGrowthRecord.mutateAsync({
        tenantId: activeTenantId,
        patient: selectedPatient,
        encounterId: null,
        measuredAt: new Date(`${form.measuredAt}T12:00:00`).toISOString(),
        measurement: {
          weightKg,
          lengthCm,
          heightCm,
          headCircumferenceCm,
          armCircumferenceCm,
          tricepsSkinfoldMm,
          subscapularSkinfoldMm,
        },
        notes: form.notes.trim() || null,
        referenceSets: references.referenceSets,
        referencePoints: references.referencePoints,
        policies: references.policies,
      });
      setMeasurementOpen(false);
      setForm(emptyMeasurementForm());
      toast({
        title: "Medición guardada",
        description: "El control pediátrico quedó persistido con resultados y auditoría.",
      });
    } catch (saveError) {
      setValidationError(saveError instanceof Error ? saveError.message : "No se pudo guardar la medición.");
    }
  };

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex items-center gap-2">
            <span>Pack pediátrico - Estándares de crecimiento</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Curvas pediátricas"
        subtitle="Seguimiento antropométrico pediátrico con referencias reales o referencia incompleta controlada."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              disabled
              title="La vista imprimible interna se habilitará cuando existan referencias oficiales completas."
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Imprimir Próximamente
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              disabled
              title="La exportación PDF se habilitará cuando existan referencias oficiales completas."
            >
              PDF Próximamente
            </Button>
            <Button
              size="sm"
              className="h-8 border-0 text-[12px] text-primary-foreground gradient-primary"
              disabled={!canCreate || !selectedPatient}
              onClick={() => {
                setValidationError(null);
                setMeasurementOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nueva medición
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-6">
        {loading && <StatePanel title="Cargando" body="Consultando pacientes pediátricos, historial y referencias del tenant activo." />}
        {error && <StatePanel title="Error de conexión" body={error instanceof Error ? error.message : "No se pudo cargar el módulo pediátrico."} />}

        {!loading && !error && (
          <>
            <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="panel p-5">
                <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Paciente pediátrico</div>
                    <Select value={selectedPatient?.id ?? ""} onValueChange={setSelectedPatientId}>
                      <SelectTrigger className="mt-2 h-11 bg-surface-raised/50">
                        <SelectValue placeholder="Seleccionar paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.fullName} - {patient.mrn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-raised/25 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tenant activo</div>
                    <div className="mt-1 text-[13px] font-medium">{activeTenant?.name ?? activeTenantId ?? "Sin tenant"}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">Fuente: Supabase / RLS</div>
                  </div>
                </div>

                {!selectedPatient && (
                  <div className="mt-5 rounded-lg border border-border bg-surface-raised/20 p-8 text-center text-[13px] text-muted-foreground">
                    No hay pacientes pediátricos reales en este tenant.
                  </div>
                )}

                {selectedPatient && (
                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <SummaryBox label="MRN" value={selectedPatient.mrn} />
                    <SummaryBox label="Sexo referencia" value={SEX_LABELS[selectedPatient.sex]} />
                    <SummaryBox label="Edad exacta" value={exactAge.exactLabel ?? "Sin fecha válida"} />
                    <div className="rounded-lg border border-border bg-surface-raised/20 p-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Riesgo</div>
                      <div className="mt-2"><RiskBadge level={selectedPatient.risk} /></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="panel p-5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Estado de referencia</div>
                <div className="mt-2 text-[15px] font-medium">{currentReferenceSet?.name ?? "Sin referencia configurada"}</div>
                {currentReferenceSet && (
                  <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground">
                    <span>Fuente: {currentReferenceSet.source}</span>
                    <span>Versión: {currentReferenceSet.version}</span>
                    {currentReferenceSet.sourceUrl ? (
                      <a className="text-primary underline-offset-4 hover:underline" href={currentReferenceSet.sourceUrl} target="_blank" rel="noreferrer">
                        Ver referencia oficial
                      </a>
                    ) : null}
                  </div>
                )}
                <div className="mt-2 text-[12px] text-muted-foreground">
                  {selectedResult?.interpretation ?? "Selecciona un paciente con controles registrados para evaluar el indicador."}
                </div>
                {selectedResult && selectedResult.referenceStatus !== "complete" && (
                  <div className="mt-4 rounded-lg border border-risk-moderate/30 bg-risk-moderate/10 p-3 text-[12px] text-risk-moderate">
                    Referencia incompleta: no se calcula z-score ni percentil hasta cargar puntos oficiales completos.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="panel p-5">
                <Tabs value={selectedIndicator} onValueChange={(value) => setSelectedIndicator(value as GrowthIndicatorCode)}>
                  <TabsList className="flex h-auto flex-wrap justify-start bg-surface-raised">
                    {INDICATORS.map((indicator) => (
                      <TabsTrigger key={indicator.code} value={indicator.code} className="text-[12px]">
                        {indicator.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {INDICATORS.find((indicator) => indicator.code === selectedIndicator)?.label ?? selectedIndicator}
                    </div>
                    <h3 className="mt-1 text-[16px] font-medium">Trayectoria longitudinal</h3>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {selectedReferencePoints.length > 0 ? "Curva de referencia cargada" : "Sin curva clínica cargada"}
                  </div>
                </div>

                <div className="mt-4 h-[520px]">
                  {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-border bg-surface-raised/20 text-[13px] text-muted-foreground">
                      No hay controles registrados para este indicador.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--surface-raised))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                        />
                        {selectedReferencePoints.length > 0 && (
                          <>
                            <Line type="monotone" dataKey="p03" stroke="hsl(var(--risk-high))" strokeDasharray="4 4" dot={false} />
                            <Line type="monotone" dataKey="p15" stroke="hsl(var(--risk-moderate))" strokeDasharray="4 4" dot={false} />
                            <Line type="monotone" dataKey="p50" stroke="hsl(var(--pack-enteral))" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="p85" stroke="hsl(var(--risk-moderate))" strokeDasharray="4 4" dot={false} />
                            <Line type="monotone" dataKey="p97" stroke="hsl(var(--risk-high))" strokeDasharray="4 4" dot={false} />
                          </>
                        )}
                        <Line type="monotone" dataKey="patient" stroke="hsl(var(--primary))" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <MetricPanel
                  title="Última medición"
                  rows={[
                    { label: "Fecha", value: latestRecord ? new Date(latestRecord.measuredAt).toLocaleDateString("es-ES") : "Sin registro" },
                    { label: "Valor", value: formatCurrentValue(latestRecord, selectedIndicator) },
                    { label: "Z-score", value: formatNumber(selectedResult?.zScore) },
                    { label: "Percentil", value: formatNumber(selectedResult?.percentile) },
                  ]}
                />

                <div className="panel p-5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Interpretación</div>
                  <div className="mt-4 text-[13px] text-muted-foreground">
                    {selectedResult?.interpretation ?? "Sin resultado calculable para el indicador seleccionado."}
                  </div>
                  {(selectedResult?.flags ?? []).length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(selectedResult?.flags ?? []).map((flag) => (
                        <span key={flag} className="rounded-full border border-risk-high/30 bg-risk-high/10 px-2 py-1 text-[10px] font-mono uppercase text-risk-high">
                          {flag.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="panel overflow-hidden">
                  <div className="border-b border-border px-5 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Controles registrados</div>
                    <h3 className="mt-1 text-[16px] font-medium">{records.length} controles</h3>
                  </div>
                  <div className="max-h-[360px] divide-y divide-border overflow-auto">
                    {records.length === 0 && (
                      <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                        Este paciente todavía no tiene mediciones pediátricas reales.
                      </div>
                    )}
                    {records.map((record) => (
                      <div key={record.id} className="grid grid-cols-[90px_1fr_auto] gap-3 px-5 py-3 text-[13px]">
                        <span className="text-muted-foreground">{record.ageMonths}m</span>
                        <span>{new Date(record.measuredAt).toLocaleDateString("es-ES")}</span>
                        <span className="font-mono text-primary">{formatCurrentValue(record, selectedIndicator)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={measurementOpen} onOpenChange={setMeasurementOpen}>
        <DialogContent className="max-w-3xl border-border bg-surface">
          <DialogHeader>
            <DialogTitle>Nueva medición pediátrica</DialogTitle>
            <DialogDescription>
              Registro tenant-scoped para {selectedPatient?.fullName ?? "paciente pediátrico"}. Los resultados se calculan solo con referencias activas completas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Fecha">
              <Input type="date" value={form.measuredAt} onChange={(event) => updateForm("measuredAt", event.target.value)} />
            </FormField>
            <FormField label="Peso (kg)">
              <Input inputMode="decimal" value={form.weightKg} onChange={(event) => updateForm("weightKg", event.target.value)} placeholder="Ej. 18.4" />
            </FormField>
            <FormField label="Longitud (cm)">
              <Input inputMode="decimal" value={form.lengthCm} onChange={(event) => updateForm("lengthCm", event.target.value)} placeholder="Menores de 2 años" />
            </FormField>
            <FormField label="Talla (cm)">
              <Input inputMode="decimal" value={form.heightCm} onChange={(event) => updateForm("heightCm", event.target.value)} placeholder="Mayores de 2 años" />
            </FormField>
            <FormField label="Perímetro cefálico (cm)">
              <Input inputMode="decimal" value={form.headCircumferenceCm} onChange={(event) => updateForm("headCircumferenceCm", event.target.value)} />
            </FormField>
            <FormField label="Perímetro braquial (cm)">
              <Input inputMode="decimal" value={form.armCircumferenceCm} onChange={(event) => updateForm("armCircumferenceCm", event.target.value)} />
            </FormField>
            <FormField label="Pliegue tricipital (mm)">
              <Input inputMode="decimal" value={form.tricepsSkinfoldMm} onChange={(event) => updateForm("tricepsSkinfoldMm", event.target.value)} />
            </FormField>
            <FormField label="Pliegue subescapular (mm)">
              <Input inputMode="decimal" value={form.subscapularSkinfoldMm} onChange={(event) => updateForm("subscapularSkinfoldMm", event.target.value)} />
            </FormField>
            <div className="md:col-span-3">
              <FormField label="Observaciones clínicas">
                <Textarea
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Contexto clínico, técnica de medición, cooperación del paciente..."
                />
              </FormField>
            </div>
          </div>

          {validationError && (
            <div className="rounded-lg border border-risk-high/30 bg-risk-high/10 p-3 text-[12px] text-risk-high">
              {validationError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMeasurementOpen(false)} disabled={saveGrowthRecord.isPending}>
              Cancelar
            </Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSaveMeasurement} disabled={saveGrowthRecord.isPending}>
              {saveGrowthRecord.isPending ? "Guardando..." : "Guardar medición"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function resolveMeasurementValue(record: PediatricGrowthRecord, indicator: GrowthIndicatorCode) {
  if (indicator === "weight_for_age" || indicator === "weight_for_length_height") return record.measurement.weightKg;
  if (indicator === "height_for_age") return record.measurement.heightCm ?? record.measurement.lengthCm;
  if (indicator === "bmi_for_age") {
    return calculatePediatricBmi(record.measurement.weightKg, record.measurement.heightCm ?? record.measurement.lengthCm);
  }
  if (indicator === "head_circumference_for_age") return record.measurement.headCircumferenceCm;
  if (indicator === "arm_circumference_for_age") return record.measurement.armCircumferenceCm;
  if (indicator === "triceps_skinfold_for_age") return record.measurement.tricepsSkinfoldMm;
  if (indicator === "subscapular_skinfold_for_age") return record.measurement.subscapularSkinfoldMm;
  return null;
}

function resolveAxisValue(record: PediatricGrowthRecord, indicator: GrowthIndicatorCode) {
  if (indicator === "weight_for_length_height") {
    return record.measurement.heightCm ?? record.measurement.lengthCm;
  }

  return record.ageMonths;
}

function formatCurrentValue(record: PediatricGrowthRecord | null, indicator: GrowthIndicatorCode) {
  if (!record) return "Sin registro";
  const value = resolveMeasurementValue(record, indicator);
  const unit = INDICATORS.find((item) => item.code === indicator)?.unit ?? "";
  return value === null ? "Sin dato" : `${formatNumber(value)} ${unit}`;
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, "") : "No calculado";
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : -1;
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised/20 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-[13px] font-medium">{value}</div>
    </div>
  );
}

function MetricPanel({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="panel p-5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-[15px] font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function StatePanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6">
      <div className="panel p-6">
        <div className="text-[16px] font-medium">{title}</div>
        <div className="mt-2 text-[13px] text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}
