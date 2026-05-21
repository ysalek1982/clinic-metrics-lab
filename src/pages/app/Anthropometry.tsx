import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, Save } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import { useSaveAnthropometrySession, useTenantPatients } from "@/hooks/useClinicalData";
import { useFormulaCatalog, useMeasurementCatalog } from "@/hooks/useClinicalCatalogs";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useAuthorization } from "@/hooks/useAuthorization";
import { resolveViewSource } from "@/lib/view-source";
import type { MeasurementCategory } from "@/types/clinical";
import {
  deriveAnthropometryResults,
  qualityIndex,
  validateMeasurements,
  type MeasurementValues,
} from "@/domain/clinical/anthropometryEngine";

const CATEGORY_LABELS: Record<MeasurementCategory, string> = {
  basic: "Básicas",
  skinfold: "Pliegues",
  girth: "Perímetros",
  length: "Longitudes",
  breadth: "Diámetros",
  depth: "Profundidades",
  segment: "Segmentos",
  derived: "Derivadas",
};

export default function Anthropometry() {
  const { isAuthenticated } = useAuth();
  const { activeTenant, activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const patientQuery = useTenantPatients();
  const measurementCatalogQuery = useMeasurementCatalog();
  const formulaCatalogQuery = useFormulaCatalog();
  const saveAnthropometry = useSaveAnthropometrySession();
  const patientResult = patientQuery.data ?? { source: "supabase" as const, data: [] };
  const measurementCatalog = measurementCatalogQuery.data ?? { source: "supabase" as const, data: { protocols: [], sites: [] } };
  const formulaCatalog = formulaCatalogQuery.data ?? { source: "supabase" as const, data: [] };
  const patients = useMemo(() => (Array.isArray(patientResult.data) ? patientResult.data : []), [patientResult.data]);
  const protocols = useMemo(
    () => (Array.isArray(measurementCatalog.data?.protocols) ? measurementCatalog.data.protocols : []),
    [measurementCatalog.data?.protocols],
  );
  const sitesCatalog = useMemo(
    () => (Array.isArray(measurementCatalog.data?.sites) ? measurementCatalog.data.sites : []),
    [measurementCatalog.data?.sites],
  );
  const formulas = useMemo(() => (Array.isArray(formulaCatalog.data) ? formulaCatalog.data : []), [formulaCatalog.data]);
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [patientResult.source, measurementCatalog.source, formulaCatalog.source],
  });
  const [showSessionConfig, setShowSessionConfig] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [protocolId, setProtocolId] = useState("");
  const [category, setCategory] = useState<MeasurementCategory>("basic");
  const [sessionNote, setSessionNote] = useState("Sesión capturada desde la consola antropométrica.");
  const [values, setValues] = useState<MeasurementValues>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const canCreateAnthropometry = hasPermission("anthropometry.create");
  const isLoading = patientQuery.isLoading || measurementCatalogQuery.isLoading || formulaCatalogQuery.isLoading;
  const isError = patientQuery.isError || measurementCatalogQuery.isError || formulaCatalogQuery.isError;
  const errorMessage =
    (patientQuery.error instanceof Error && patientQuery.error.message) ||
    (measurementCatalogQuery.error instanceof Error && measurementCatalogQuery.error.message) ||
    (formulaCatalogQuery.error instanceof Error && formulaCatalogQuery.error.message) ||
    null;

  useEffect(() => {
    if (!patientId && patients[0]?.id) {
      setPatientId(patients[0].id);
    }
    if (!protocolId && protocols[0]?.id) {
      setProtocolId(protocols[0].id);
    }
  }, [patientId, patients, protocolId, protocols]);

  const patient = patients.find((item) => item.id === patientId) ?? patients[0] ?? null;
  const protocol = protocols.find((item) => item.id === protocolId) ?? protocols[0] ?? null;
  const sites = useMemo(() => {
    if (!protocol) return [];
    const protocolSiteIds = protocol.siteIds ?? [];
    return sitesCatalog.filter((site) => protocolSiteIds.includes(site.id));
  }, [protocol, sitesCatalog]);
  const categories = useMemo(() => Array.from(new Set(sites.map((site) => site.category))), [sites]);
  const visibleSites = useMemo(() => sites.filter((site) => site.category === category), [category, sites]);
  const applicableFormulas = useMemo(
    () => {
      if (!protocol) return [];
      return formulas.flatMap((formula) =>
        (formula.versions ?? [])
          .filter((version) => {
            const requiredProtocolIds = version.applicability?.requiredProtocolIds;
            return !requiredProtocolIds || requiredProtocolIds.includes(protocol.id);
          })
          .map((version) => ({ formula, version })),
      );
    },
    [formulas, protocol],
  );
  const formulaVersions = useMemo(() => applicableFormulas.map(({ version }) => version), [applicableFormulas]);
  const validations = useMemo(() => validateMeasurements(sites, values), [sites, values]);
  const quality = useMemo(() => qualityIndex(validations), [validations]);
  const derivedResults = useMemo(
    () =>
      deriveAnthropometryResults(sites, values, formulaVersions, {
        sex: patient?.sex ?? "male",
        ageYears: 25,
      }),
    [formulaVersions, patient?.sex, sites, values],
  );

  async function handleSaveSession() {
    setFormError(null);
    setSaveMessage(null);

    if (!activeTenantId) {
      setFormError("Selecciona un tenant activo antes de guardar sesiones.");
      return;
    }

    if (!canCreateAnthropometry) {
      setFormError("Tu rol no permite guardar sesiones antropométricas en este tenant.");
      return;
    }

    if (!patient) {
      setFormError("Selecciona un paciente.");
      return;
    }

    if (!protocol) {
      setFormError("Selecciona un protocolo antropométrico.");
      return;
    }

    const measurements = sites.flatMap((site) => {
      const siteValues = values[site.id];
      const validation = validations.find((item) => item.siteId === site.id);
      return [
        siteValues?.attempt1 !== undefined
          ? {
              siteId: site.id,
              attempt: 1,
              value: siteValues.attempt1,
              unit: site.unit,
              deltaFromPrevious: null,
              qualityFlag: (validation?.withinTolerance ?? true) ? null : "review",
              notes: null,
            }
          : null,
        siteValues?.attempt2 !== undefined
          ? {
              siteId: site.id,
              attempt: 2,
              value: siteValues.attempt2,
              unit: site.unit,
              deltaFromPrevious: null,
              qualityFlag: (validation?.withinTolerance ?? true) ? null : "review",
              notes: null,
            }
          : null,
      ].filter((item): item is NonNullable<typeof item> => Boolean(item));
    });

    if (measurements.length === 0) {
      setFormError("Registra al menos una medición antes de guardar la sesión.");
      return;
    }

    const invalidMeasurement = measurements.find((measurement) => !Number.isFinite(measurement.value) || measurement.value < 0);
    if (invalidMeasurement) {
      setFormError("Todas las mediciones deben ser números mayores o iguales a cero.");
      return;
    }

    try {
      await saveAnthropometry.mutateAsync({
        tenantId: activeTenantId,
        patientId: patient.id,
        protocolId: protocol.id,
        qualityIndex: quality,
        formulaVersionIds: formulaVersions.map((version) => version.id),
        notes: sessionNote.trim() || null,
        measurements,
        derived: derivedResults.map((result) => ({
          formulaVersionId: result.formulaVersionId ?? formulaVersions[0]?.id ?? "fv-mifflin-1-0",
          outputType: result.key,
          value: typeof result.value === "number" ? result.value : null,
          valueJson: typeof result.value === "number" ? null : { value: result.value },
          unit: result.unit,
          interpretation: null,
        })),
      });
      setSaveMessage("Sesión antropométrica guardada correctamente.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la sesión antropométrica.");
    }
  }

  function updateMeasurement(siteId: string, attempt: "attempt1" | "attempt2", rawValue: string) {
    const parsed = rawValue === "" ? undefined : Number(rawValue);
    setValues((current) => ({
      ...current,
      [siteId]: {
        ...current[siteId],
        [attempt]: Number.isFinite(parsed) ? parsed : undefined,
      },
    }));
  }

  if (!activeTenantId) {
    return <AnthropometryState title="Antropometría avanzada" message="No hay una organización activa seleccionada." source={viewSource} />;
  }

  if (isLoading) {
    return <AnthropometryState title="Antropometría avanzada" message="Cargando módulo de antropometría..." source={viewSource} />;
  }

  if (isError) {
    return (
      <AnthropometryState
        title="Antropometría avanzada"
        message={errorMessage ?? "No se pudo cargar la información del módulo de antropometría."}
        source={viewSource}
        tone="error"
      />
    );
  }

  if (!patient || !protocol) {
    return (
      <AnthropometryState
        title="Antropometría avanzada"
        message="Este módulo aún no tiene pacientes o catálogos antropométricos reales configurados para este tenant."
        source={viewSource}
      />
    );
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{`Motor antropométrico - ${activeTenant?.slug ?? "tenant"}`}</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Antropometría avanzada"
        subtitle={`Paciente: ${patient.fullName ?? "Seleccionar paciente"} - Protocolo: ${protocol.name ?? "Sin protocolo"} - ${sites.length} sitios`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setShowSessionConfig(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Configurar sesión
            </Button>
            <Button
              size="sm"
              className="h-8 border-0 text-[12px] text-primary-foreground gradient-primary"
              onClick={() => void handleSaveSession()}
              disabled={saveAnthropometry.isPending || !canCreateAnthropometry}
              title={!canCreateAnthropometry ? "Sin permiso para guardar antropometría" : undefined}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saveAnthropometry.isPending ? "Guardando..." : "Guardar sesión"}
            </Button>
          </div>
        }
      />

      <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-0 xl:grid-cols-[280px_1fr_340px]">
        <aside className="space-y-4 border-r border-border bg-surface/30 p-3">
          {viewSource === "fallback" && (
            <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2 text-[11px] text-muted-foreground">
              La consola sigue operativa mientras terminan de sincronizarse catálogos y referencias del tenant.
            </div>
          )}
          <Field label="Paciente">
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Protocolo">
            <Select
              value={protocolId}
              onValueChange={(value) => {
                setProtocolId(value);
                const nextProtocol = protocols.find((item) => item.id === value);
                const nextProtocolSiteIds = nextProtocol?.siteIds ?? [];
                setCategory(
                  nextProtocolSiteIds.length > 0
                    ? sitesCatalog.find((site) => nextProtocolSiteIds.includes(site.id))?.category ?? "basic"
                    : "basic",
                );
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona protocolo" />
              </SelectTrigger>
              <SelectContent>
                {protocols.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="border-t border-border pt-4">
            <div className="mb-2 px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Categorías</div>
            <div className="space-y-1">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                    category === item ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-raised"
                  }`}
                >
                  <span>{CATEGORY_LABELS[item]}</span>
                  <span className="text-[10px] font-mono">{sites.filter((site) => site.category === item).length}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 border-t border-border px-2 pt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Calidad de sesión</div>
            <div className="flex items-end gap-2">
              <span
                className={`text-2xl font-serif italic ${
                  quality >= 85 ? "text-risk-low" : quality >= 60 ? "text-risk-moderate" : "text-risk-high"
                }`}
              >
                {quality}
              </span>
              <span className="pb-1 text-[10px] font-mono text-muted-foreground">/ 100</span>
            </div>
          </div>
        </aside>

        <main className="p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{CATEGORY_LABELS[category]}</h2>
              <p className="text-[12px] text-muted-foreground">{protocol.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            {visibleSites.map((site, index) => {
              const validation = validations.find((item) => item.siteId === site.id);
              const siteValues = values[site.id] ?? {};
              return (
                <div key={site.id} className="panel grid grid-cols-1 items-center gap-3 p-4 lg:grid-cols-[1fr_120px_120px_86px]">
                  <div>
                    <div className="text-[13px] font-medium">{site.name}</div>
                    <div className="mt-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                      {`Sitio #${index + 1} - ${site.code} - tol +/-${site.tolerance}${site.unit}`}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{site.anatomicalHint}</div>
                  </div>
                  <MeasurementInput label="Medición 1" value={siteValues.attempt1} onChange={(value) => updateMeasurement(site.id, "attempt1", value)} />
                  <MeasurementInput label="Medición 2" value={siteValues.attempt2} onChange={(value) => updateMeasurement(site.id, "attempt2", value)} />
                  <div className="text-center">
                    <div className="mb-1 text-[9px] font-mono uppercase text-muted-foreground">Delta</div>
                    <div
                        className={`inline-flex items-center gap-1 text-[13px] font-mono tabular ${
                          validation?.withinTolerance
                            ? "text-risk-low"
                            : validation?.severity === "missing" || !validation
                              ? "text-muted-foreground"
                              : "text-risk-high"
                        }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {validation ? validation.delta.toFixed(1) : "--"}
                    </div>
                    <div className="mt-1 text-[9px] text-muted-foreground">{validation?.message ?? "Pendiente de mediciones"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <aside className="space-y-4 border-l border-border bg-surface/30 p-5">
          {(formError || saveAnthropometry.isError) && (
            <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                {formError ??
                  (saveAnthropometry.error instanceof Error
                    ? saveAnthropometry.error.message
                    : "No se pudo guardar la sesión antropométrica.")}
            </div>
          )}
          {saveMessage && (
            <div className="rounded-md border border-risk-low/30 bg-risk-low/10 px-3 py-2 text-[12px] text-risk-low">
              {saveMessage}
            </div>
          )}
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Resultados derivados</div>
            <div className="text-[10px] text-muted-foreground">
              Motor: <span className="font-mono text-foreground">formula_versions</span>
            </div>
          </div>
          <div className="space-y-2">
            {derivedResults.slice(0, 8).map((result) => (
              <div key={result.key} className="rounded-md bg-surface-raised/50 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">{result.label}</div>
                <div className="mt-1 text-[14px] font-semibold">
                  {String(result.value)} {result.unit}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <Sheet open={showSessionConfig} onOpenChange={setShowSessionConfig}>
        <SheetContent side="right" className="w-[640px] overflow-y-auto sm:max-w-[640px]">
          <SheetHeader>
            <SheetTitle>Configurar sesión antropométrica</SheetTitle>
            <SheetDescription>
              Prepara paciente, protocolo y notas sin salir de la consola.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-4">
            <Field label="Paciente">
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Protocolo">
              <Select value={protocolId} onValueChange={setProtocolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona protocolo" />
                </SelectTrigger>
                <SelectContent>
                  {protocols.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nota de sesión">
              <Input value={sessionNote} onChange={(event) => setSessionNote(event.target.value)} />
            </Field>
            {saveAnthropometry.isError && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                  {saveAnthropometry.error instanceof Error
                    ? saveAnthropometry.error.message
                    : "No se pudo guardar la sesión antropométrica."}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowSessionConfig(false)}>
              Cerrar
            </Button>
            <Button onClick={() => setShowSessionConfig(false)}>Aplicar configuración</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AnthropometryState({
  title,
  message,
  source,
  tone = "neutral",
}: {
  title: string;
  message: string;
  source: "real" | "fallback" | "demo";
  tone?: "neutral" | "error";
}) {
  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>Motor antropométrico</span>
            <SourceStateBadge source={source} />
          </div>
        }
        title={title}
        subtitle="Estación antropométrica con estados seguros de carga, permisos y datos."
      />
      <div className="p-6">
        <div className={`panel p-6 text-[13px] ${tone === "error" ? "text-risk-high" : "text-muted-foreground"}`}>
          {message}
        </div>
      </div>
    </div>
  );
}

function MeasurementInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <Input value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder="0.0" className="h-9 text-[12px]" />
    </div>
  );
}
