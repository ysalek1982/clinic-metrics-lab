import { Filter, GitBranch, Plus, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { PackPill } from "@/components/common/PackPill";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
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
import { calculateScreeningFromAnswers, type ScreeningAnswerDraft } from "@/domain/clinical/screeningTemplateEngine";
import { useAuth } from "@/features/auth/auth-context";
import { useScreeningCatalog } from "@/hooks/useClinicalCatalogs";
import { useSaveScreeningResult, useTenantPatients, useTenantScreenings } from "@/hooks/useClinicalData";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { resolveViewSource } from "@/lib/view-source";
import type { ScreeningTemplate } from "@/types/clinical";

export default function Screening() {
  const { isAuthenticated } = useAuth();
  const { activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const patientQuery = useTenantPatients();
  const screeningQuery = useTenantScreenings();
  const screeningCatalogQuery = useScreeningCatalog();
  const saveScreening = useSaveScreeningResult();
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const patientResult = patientQuery.data ?? { source: "supabase" as const, data: [] };
  const screeningResult = screeningQuery.data ?? { source: "supabase" as const, data: [] };
  const screeningCatalog = screeningCatalogQuery.data ?? { source: "supabase" as const, data: [] };
  const isLoading = patientQuery.isLoading || screeningQuery.isLoading || screeningCatalogQuery.isLoading;
  const templates = useMemo(() => screeningCatalog.data ?? [], [screeningCatalog.data]);
  const patients = useMemo(() => patientResult.data ?? [], [patientResult.data]);
  const executions = useMemo(() => screeningResult.data ?? [], [screeningResult.data]);
  const canCreateScreening = hasPermission("screening.create");
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [screeningResult.source, patientResult.source, screeningCatalog.source],
  });

  const defaultTemplate = templates[0];
  const [form, setForm] = useState({
    patientId: "",
    templateId: "",
  });
  const [answers, setAnswers] = useState<ScreeningAnswerDraft>({});

  useEffect(() => {
    if (!form.patientId && patients[0]?.id) {
      setForm((current) => ({ ...current, patientId: patients[0].id }));
    }
    if (!form.templateId && defaultTemplate?.id) {
      setForm((current) => ({ ...current, templateId: defaultTemplate.id }));
    }
  }, [defaultTemplate?.id, form.patientId, form.templateId, patients]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.templateId) ?? defaultTemplate,
    [defaultTemplate, form.templateId, templates],
  );
  const calculatedScreening = useMemo(
    () => (selectedTemplate && Array.isArray(selectedTemplate.items) ? calculateScreeningFromAnswers(selectedTemplate, answers) : null),
    [answers, selectedTemplate],
  );

  useEffect(() => {
    if (!selectedTemplate) return;
    setAnswers((current) => seedAnswers(selectedTemplate, current));
  }, [selectedTemplate]);

  async function handleCreateScreening() {
    setFormError(null);

    if (!activeTenantId) {
      setFormError("Selecciona un tenant activo antes de guardar screenings.");
      return;
    }

    if (!canCreateScreening) {
      setFormError("Tu rol no permite guardar screenings en este tenant.");
      return;
    }

    if (!form.patientId) {
      setFormError("Selecciona un paciente.");
      return;
    }

    if (!selectedTemplate || !calculatedScreening) {
      setFormError("Selecciona una plantilla y responde el cuestionario.");
      return;
    }

    const missingRequired = (selectedTemplate.items ?? []).find((item) => {
      if (!item.required) return false;
      const value = answers[item.id];
      return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    });

    if (missingRequired) {
      setFormError(`Responde la pregunta obligatoria: ${missingRequired.label}.`);
      return;
    }

    try {
      await saveScreening.mutateAsync({
        tenantId: activeTenantId,
        patientId: form.patientId,
        templateId: selectedTemplate.id,
        templateVersion: selectedTemplate.version,
        score: calculatedScreening.score,
        riskLevel: calculatedScreening.riskLevel,
        flags: calculatedScreening.flags,
        recommendation: calculatedScreening.recommendation,
        nextReviewAt: new Date(Date.now() + calculatedScreening.nextReviewDays * 24 * 60 * 60 * 1000).toISOString(),
        answers: calculatedScreening.answers,
      });

      setShowCreate(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar el screening.");
    }
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>Motor de reglas clínicas - configurable</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Screening nutricional"
        subtitle="Protocolos validados internacionalmente y reglas personalizadas por institución."
        actions={
          <Button
            size="sm"
            className="h-8 border-0 text-[12px] text-primary-foreground gradient-primary"
            onClick={() => (canCreateScreening ? setShowCreate(true) : setFormError("Tu rol no permite guardar screenings en este tenant."))}
            disabled={!canCreateScreening}
            title={!canCreateScreening ? "Sin permiso para crear screenings" : undefined}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo screening
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 p-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {viewSource === "fallback" && (
            <div className="panel px-4 py-3 text-[12px] text-muted-foreground">
              La consola usa fallback visual porque faltan datos remotos completos del tenant.
            </div>
          )}

          <div className="panel">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-[15px] font-medium">Screenings recientes</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Resultados asociados al tenant activo.</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[11px]">
                <Filter className="mr-1.5 h-3 w-3" />
                Filtros
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full tabular text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-surface-raised/30 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 text-left font-normal">Paciente</th>
                    <th className="px-5 py-2.5 text-left font-normal">Plantilla</th>
                    <th className="px-5 py-2.5 text-left font-normal">Puntaje</th>
                    <th className="px-5 py-2.5 text-left font-normal">Riesgo</th>
                    <th className="px-5 py-2.5 text-left font-normal">Banderas</th>
                    <th className="px-5 py-2.5 text-left font-normal">Reevaluación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {executions.map((execution) => {
                    const patient = patients.find((item) => item.id === execution.patientId);
                    const template = templates.find((item) => item.id === execution.templateId);
                    return (
                      <tr key={execution.id} className="hover:bg-surface-raised/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <RiskDot level={execution.level} />
                            <span className="font-medium">{patient?.fullName ?? execution.patientId}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-[11px] font-mono">{template?.name ?? execution.templateName ?? execution.templateId}</div>
                          <div className="text-[10px] text-muted-foreground">v{template?.version ?? execution.templateVersion}</div>
                        </td>
                        <td className="px-5 py-3 font-medium">{execution.score}</td>
                        <td className="px-5 py-3">
                          <RiskBadge level={execution.level} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {execution.flags.map((flag) => (
                              <span
                                key={flag}
                                className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[11px] font-mono text-muted-foreground">{execution.nextReviewDays} días</td>
                      </tr>
                    );
                  })}
                  {executions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                        Sin screenings ejecutados para este tenant. Las plantillas siguen disponibles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-[15px] font-medium">Reglas automáticas</h3>
                <p className="text-[12px] text-muted-foreground">
                  Cada plantilla puede producir alertas, tareas y frecuencia de reevaluación.
                </p>
              </div>
            </div>
            <div className="grid gap-px bg-border md:grid-cols-2">
              {!isLoading &&
                templates.flatMap((template) => (template.rules ?? []).map((rule) => ({ template, rule }))).map(({ template, rule }) => (
                  <div key={rule.id} className="bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13px] font-medium">{rule.label}</div>
                      <RiskBadge level={rule.severity} />
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-primary">
                      {template.name} - {rule.when}
                    </div>
                    <p className="mt-2 text-[12px] text-muted-foreground">{rule.recommendation}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="panel p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Plantillas disponibles</div>
            <h3 className="mt-0.5 text-[15px] font-medium">Configurables por pack</h3>
            <div className="mt-4 space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="rounded-md border border-border p-3 transition-colors hover:border-primary/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{template.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">v{template.version}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{template.description}</div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.packIds.map((packId) => (
                      <PackPill key={packId} pack={packId} />
                    ))}
                  </div>
                </div>
              ))}
              {!isLoading && templates.length === 0 && (
                <div className="rounded-md border border-border p-4 text-[12px] text-muted-foreground">
                  No hay plantillas visibles en el catálogo activo.
                </div>
              )}
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <h3 className="text-[15px] font-medium">Versionado</h3>
            </div>
            <p className="leading-relaxed text-[12px] text-muted-foreground">
              Los resultados guardan template, versión, respuestas y puntajes por pregunta. Cambios futuros crean nuevas versiones sin alterar históricos.
            </p>
          </div>
        </aside>
      </div>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="right" className="w-[760px] overflow-y-auto sm:max-w-[760px]">
          <SheetHeader>
            <SheetTitle>Nuevo screening</SheetTitle>
            <SheetDescription>
              Responde el cuestionario real de la plantilla. El puntaje y las banderas se calculan automáticamente.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Paciente">
              <Select value={form.patientId} onValueChange={(value) => setForm({ ...form, patientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona paciente" />
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
            <Field label="Plantilla">
              <Select value={form.templateId} onValueChange={(value) => setForm({ ...form, templateId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="space-y-3 md:col-span-2">
              {(selectedTemplate?.items ?? []).map((item) => (
                <QuestionField
                  key={item.id}
                  item={item}
                  value={answers[item.id]}
                  onChange={(value) => setAnswers((current) => ({ ...current, [item.id]: value }))}
                />
              ))}
              {selectedTemplate && (selectedTemplate.items ?? []).length === 0 && (
                <div className="rounded-md border border-border px-3 py-3 text-[12px] text-muted-foreground">
                  La plantilla seleccionada no tiene preguntas configuradas.
                </div>
              )}
            </div>

            {calculatedScreening && (
              <div className="grid gap-2 rounded-md border border-border bg-surface-raised/40 p-3 text-[12px] md:col-span-2 md:grid-cols-4">
                <Mini label="Puntaje" value={String(calculatedScreening.score)} />
                <Mini label="Riesgo" value={riskLabel(calculatedScreening.riskLevel)} />
                <Mini label="Reevaluación" value={`${calculatedScreening.nextReviewDays} días`} />
                <Mini label="Banderas" value={calculatedScreening.flags.length ? calculatedScreening.flags.join(", ") : "Sin banderas"} />
                <div className="md:col-span-4 text-muted-foreground">{calculatedScreening.recommendation}</div>
              </div>
            )}

            {(formError || saveScreening.isError) && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high md:col-span-2">
                  {formError ?? (saveScreening.error instanceof Error ? saveScreening.error.message : "No se pudo guardar el screening.")}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreateScreening()} disabled={saveScreening.isPending || !activeTenantId || !canCreateScreening}>
              {saveScreening.isPending ? "Guardando..." : "Guardar screening"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function QuestionField({
  item,
  value,
  onChange,
}: {
  item: ScreeningTemplate["items"][number];
  value: ScreeningAnswerDraft[string];
  onChange: (value: ScreeningAnswerDraft[string]) => void;
}) {
  if (item.type === "numeric") {
    return (
      <Field label={`${item.label}${item.required ? " *" : ""}`}>
        <Input
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
          placeholder={item.unit ?? "Valor"}
        />
      </Field>
    );
  }

  if (item.type === "multi_choice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <Label>{`${item.label}${item.required ? " *" : ""}`}</Label>
        <div className="flex flex-wrap gap-2">
          {(item.options ?? []).map((option) => {
            const active = selected.includes(option.value);
            return (
              <Button
                key={option.value}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                className="h-8 text-[12px]"
                onClick={() =>
                  onChange(active ? selected.filter((itemValue) => itemValue !== option.value) : [...selected, option.value])
                }
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  if (item.type === "boolean") {
    return (
      <Field label={`${item.label}${item.required ? " *" : ""}`}>
        <Select value={String(Boolean(value))} onValueChange={(nextValue) => onChange(nextValue === "true")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">No</SelectItem>
            <SelectItem value="true">Sí</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    );
  }

  return (
    <Field label={`${item.label}${item.required ? " *" : ""}`}>
      <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona respuesta" />
        </SelectTrigger>
        <SelectContent>
          {(item.options ?? []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function seedAnswers(template: ScreeningTemplate, current: ScreeningAnswerDraft): ScreeningAnswerDraft {
  return Object.fromEntries(
    (template.items ?? []).map((item) => {
      if (current[item.id] !== undefined) return [item.id, current[item.id]];
      if (item.type === "multi_choice") return [item.id, []];
      if (item.type === "boolean") return [item.id, false];
      if (item.type === "numeric") return [item.id, null];
        return [item.id, item.options?.[0]?.value ?? ""];
    }),
  );
}

function riskLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Bajo",
    moderate: "Moderado",
    high: "Alto",
    critical: "Crítico",
  };
  return labels[value] ?? value;
}
