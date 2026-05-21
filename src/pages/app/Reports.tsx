import { BarChart3, Download, Eye, FileText, Lock, Play, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ActionDialog } from "@/components/common/ActionDialog";
import { AsyncActionFooter } from "@/components/common/AsyncActionFooter";
import { ModuleState } from "@/components/common/ModuleState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useExportReportAudit, usePrintReportAudit, useGenerateReportRun, useReportDataBundle, useReportRuns, useReportTemplates } from "@/hooks/useReports";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  createReportPreviewExcelArtifact,
  createReportPreviewPdfArtifact,
  downloadExportArtifact,
} from "@/lib/exportArtifacts";
import {
  periodLabel,
  previewReport,
  type ReportAvailability,
  type ReportParameters,
  type ReportPreview,
  type ReportTemplate,
  type ReportType,
} from "@/services/reportService";

const PERIOD_OPTIONS: Array<{ value: ReportParameters["period"]; label: string }> = [
  { value: "last_7_days", label: "Últimos 7 días" },
  { value: "last_30_days", label: "Últimos 30 días" },
  { value: "this_month", label: "Mes actual" },
  { value: "all", label: "Todo el historial" },
];

const REPORT_TYPE_VALUES: ReportType[] = [
  "executive",
  "patient_clinical",
  "anthropometry",
  "labs",
  "plans",
  "alerts",
  "agenda",
  "operational_nutrition",
  "recipes",
  "ccorp",
  "sports_performance",
  "pediatric",
];

function isReportType(value: string | null): value is ReportType {
  return Boolean(value && REPORT_TYPE_VALUES.includes(value as ReportType));
}

export default function Reports() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { activeTenant, isDemoMode, requiresActivation } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const templates = useReportTemplates();
  const bundleQuery = useReportDataBundle();
  const runsQuery = useReportRuns();
  const generateRun = useGenerateReportRun();
  const printAudit = usePrintReportAudit();
  const exportAudit = useExportReportAudit();

  const [period, setPeriod] = useState<ReportParameters["period"]>("last_30_days");
  const [patientId, setPatientId] = useState<string>("");
  const [category, setCategory] = useState<string>("Todos");
  const [previewType, setPreviewType] = useState<ReportType | null>(null);
  const [lastGeneratedRunId, setLastGeneratedRunId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);
  const [printPreviewDialog, setPrintPreviewDialog] = useState<ReportPreview | null>(null);

  const canReadReports = hasPermission("reports.read", "reports.export");
  const canGenerateReports = hasPermission("reports.generate", "reports.export");
  const canPrintReports = hasPermission("reports.print", "reports.export");
  const canExportReports = hasPermission("reports.export", "reports.generate");

  const parameters = useMemo<ReportParameters>(
    () => ({ period, patientId: patientId || null }),
    [patientId, period],
  );
  const bundle = bundleQuery.data;
  const runs = runsQuery.data ?? [];

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(templates.map((template) => template.category)))], [templates]);
  const filteredTemplates = useMemo(
    () => templates.filter((template) => category === "Todos" || template.category === category),
    [category, templates],
  );

  const previewMap = useMemo(() => {
    if (!bundle) return new Map<ReportType, ReportPreview>();
    return new Map(templates.map((template) => [template.type, previewReport(bundle, template.type, parameters)]));
  }, [bundle, parameters, templates]);

  const activePreview = previewType ? previewMap.get(previewType) ?? null : null;
  const isLoading = bundleQuery.isLoading || runsQuery.isLoading;
  const errorMessage =
    operationError ??
    (bundleQuery.error instanceof Error ? bundleQuery.error.message : null) ??
    (runsQuery.error instanceof Error ? runsQuery.error.message : null) ??
    (generateRun.error instanceof Error ? generateRun.error.message : null);

  useEffect(() => {
    const requestedPatient = searchParams.get("patient");
    const requestedType = searchParams.get("type");
    if (requestedPatient) setPatientId(requestedPatient);
    if (isReportType(requestedType)) {
      setPreviewType(requestedType);
      const template = templates.find((item) => item.type === requestedType);
      if (template) setCategory(template.category);
    }
  }, [searchParams, templates]);

  async function handleGenerate(template: ReportTemplate) {
    setOperationError(null);
    setOperationSuccess(null);
    try {
      const run = await generateRun.mutateAsync({ reportType: template.type, parameters });
      setLastGeneratedRunId(run.id);
      setPreviewType(template.type);
      setOperationSuccess("Reporte generado y auditado.");
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "No se pudo generar el reporte.");
    }
  }

  async function handlePrint(preview: ReportPreview) {
    setOperationError(null);
    setOperationSuccess(null);
    try {
      await printAudit.mutateAsync({ preview, reportRunId: lastGeneratedRunId });
      setPrintPreviewDialog(preview);
      setOperationSuccess("Vista imprimible preparada y auditoria registrada.");
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "No se pudo imprimir el reporte.");
    }
  }

  async function handleExport(preview: ReportPreview, format: "pdf" | "xlsx") {
    setOperationError(null);
    setOperationSuccess(null);
    try {
      const artifact =
        format === "pdf"
          ? createReportPreviewPdfArtifact(preview)
          : await createReportPreviewExcelArtifact(preview);
      await exportAudit.mutateAsync({ preview, format, reportRunId: lastGeneratedRunId });
      downloadExportArtifact(artifact);
      setOperationSuccess(`Exportación ${format.toUpperCase()} generada y auditada.`);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "No se pudo exportar el reporte.");
    }
  }

  if (isAuthenticated && requiresActivation) {
    return (
      <ReportShell>
        <StatePanel
          title="Organización requerida"
          message="Debes activar o seleccionar una organización para consultar reportes reales."
        />
      </ReportShell>
    );
  }

  if (isAuthenticated && !isDemoMode && !canReadReports) {
    return (
      <ReportShell>
        <StatePanel
          title="Sin permiso para reportes"
          message="Tu rol no tiene permisos para consultar reportes en este tenant."
          icon={<Lock className="h-5 w-5" />}
        />
      </ReportShell>
    );
  }

  return (
    <div>
      <PageHeader
        meta={<span>Generación institucional · Datos reales</span>}
        title="Centro de reportes"
        subtitle="Plantillas configurables con vista previa, generación persistida y salida imprimible."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled className="h-10 text-[12px]">
              PDF desde vista previa
            </Button>
            <Button variant="outline" disabled className="h-10 text-[12px]">
              Excel desde vista previa
            </Button>
          </div>
        }
      />

      <div className="space-y-5 p-6">
        {isDemoMode && (
          <div className="panel border-primary/30 px-4 py-3 text-[12px] text-primary">
            DEMO: las plantillas se muestran solo como navegación visual. Inicia sesión y selecciona tenant para datos reales.
          </div>
        )}

        {errorMessage && (
          <div className="panel border-risk-high/30 bg-risk-high/10 px-4 py-3 text-[12px] text-risk-high">
            {errorMessage}
          </div>
        )}

        {operationSuccess && (
          <div className="panel border-success/30 bg-success/10 px-4 py-3 text-[12px] text-success">
            {operationSuccess}
          </div>
        )}

        <section className="panel p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <Field label="Periodo">
              <select value={period} onChange={(event) => setPeriod(event.target.value as ReportParameters["period"])} className="field h-10">
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Paciente opcional">
              <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="field h-10" disabled={!bundle}>
                <option value="">Todos los pacientes</option>
                {(bundle?.patients ?? []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} · {patient.mrn}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de reporte">
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="field h-10">
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-xl border border-border bg-background/25 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tenant</div>
              <div className="mt-1 max-w-[220px] truncate text-[13px] font-semibold">{activeTenant?.name ?? "Sin tenant activo"}</div>
            </div>
          </div>
        </section>

        {isLoading && (
          <StatePanel title="Cargando reportes" message="Consultando datasets reales del tenant activo." />
        )}

        {!isLoading && !bundle && !isDemoMode && (
          <StatePanel title="Sin datos de reportes" message="No hay datos reales suficientes para generar reportes en este tenant." />
        )}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredTemplates.map((template) => {
              const preview = previewMap.get(template.type);
              const availability = preview?.availability ?? { status: "requires_data", label: "Cargando", reason: "Esperando datos reales." };
              const canPreview = Boolean(bundle) && availability.status !== "soon";
              const canGenerate = canGenerateReports && availability.status === "available" && Boolean(bundle);

              return (
                <ReportCard
                  key={template.type}
                  template={template}
                  availability={availability}
                  canPreview={canPreview}
                  canGenerate={canGenerate}
                  isGenerating={generateRun.isPending}
                  onPreview={() => {
                    setOperationError(null);
                    setLastGeneratedRunId(null);
                    setPreviewType(template.type);
                  }}
                  onGenerate={() => void handleGenerate(template)}
                />
              );
            })}
          </div>

          <aside className="space-y-4">
            <div className="panel p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Resumen de fuente</div>
                  <h3 className="text-[15px] font-semibold">Datos reales del tenant</h3>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniStat label="Pacientes" value={bundle?.patients.length ?? 0} />
                <MiniStat label="Labs" value={bundle?.labResults.length ?? 0} />
                <MiniStat label="Citas" value={bundle?.appointments.length ?? 0} />
                <MiniStat label="Menús" value={bundle?.weeklyMenus.length ?? 0} />
              </div>
              {(bundle?.warnings ?? []).length ? (
                <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-[11px] text-warning">
                  {(bundle?.warnings ?? []).length} fuente(s) devolvieron advertencias. La vista previa las muestra sin ocultarlas.
                </div>
              ) : null}
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Reportes recientes</div>
                <h3 className="text-[15px] font-semibold">Ejecuciones persistidas</h3>
              </div>
              <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    className="block w-full px-5 py-4 text-left transition-colors hover:bg-surface-raised/60"
                    onClick={() => {
                      const payload = run.payload as Partial<ReportPreview>;
                      if (payload.reportType) {
                        setPreviewType(payload.reportType);
                        setLastGeneratedRunId(run.id);
                      }
                    }}
                  >
                    <div className="text-[13px] font-medium">{run.reportTitle}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span>{run.reportType}</span>
                      <span>{run.format}</span>
                      <span>{presentStatus(run.status)}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">{formatDateTime(run.createdAt)}</div>
                  </button>
                ))}
                {!runsQuery.isLoading && runs.length === 0 && (
                  <div className="px-5 py-10 text-center text-[12px] text-muted-foreground">
                    Todavía no hay reportes generados para este tenant.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>

      <Sheet open={Boolean(activePreview)} onOpenChange={(open) => !open && setPreviewType(null)}>
        <SheetContent side="right" className="w-[calc(100vw-16px)] overflow-y-auto border-border bg-background sm:max-w-[920px]">
          {activePreview && (
            <>
              <SheetHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge availability={activePreview.availability} />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {activePreview.category} · {activePreview.periodLabel}
                  </span>
                </div>
                <SheetTitle className="text-2xl">{activePreview.title}</SheetTitle>
                <SheetDescription>
                  Generado: {formatDateTime(activePreview.generatedAt)}
                  {activePreview.patientLabel ? ` · ${activePreview.patientLabel}` : ""}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  {activePreview.metrics.map((metric) => (
                    <MetricCard key={metric.label} metric={metric} />
                  ))}
                </div>

                {activePreview.sections.map((section) => (
                  <div key={section.title} className="rounded-xl border border-border bg-surface/60 p-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{section.title}</div>
                    <div className="mt-3 grid gap-2">
                      {section.items.map((item) => (
                        <div key={item} className="rounded-lg bg-background/40 px-3 py-2 text-[12px] text-muted-foreground">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {activePreview.tables.map((table) => (
                  <div key={table.title} className="overflow-hidden rounded-xl border border-border">
                    <div className="border-b border-border bg-surface/60 px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{table.title}</div>
                    </div>
                    {table.rows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-[12px]">
                          <thead className="bg-surface-raised/60 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            <tr>
                              {table.columns.map((column) => (
                                <th key={column} className="px-4 py-3 font-medium">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {table.rows.map((row) => (
                              <tr key={row.join("|")} className="text-muted-foreground">
                                {row.map((cell, index) => (
                                  <td key={`${cell}-${index}`} className="px-4 py-3">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">{table.emptyText}</div>
                    )}
                  </div>
                ))}
              </div>

              <SheetFooter className="mt-6 flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button
                    variant="outline"
                    onClick={() => void handleExport(activePreview, "pdf")}
                    disabled={!canExportReports || activePreview.availability.status === "soon" || exportAudit.isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleExport(activePreview, "xlsx")}
                    disabled={!canExportReports || activePreview.availability.status === "soon" || exportAudit.isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </div>
                <Button onClick={() => void handlePrint(activePreview)} disabled={!canPrintReports || activePreview.availability.status === "soon" || printAudit.isPending}>
                  <Printer className="mr-2 h-4 w-4" />
                  {printAudit.isPending ? "Preparando..." : "Vista imprimible"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ActionDialog
        open={Boolean(printPreviewDialog)}
        onOpenChange={(open) => !open && setPrintPreviewDialog(null)}
        title={printPreviewDialog?.title ?? "Vista imprimible"}
        description="Vista interna preparada sin abrir ventanas externas. Para archivo descargable usa PDF o Excel desde la vista previa."
        className="max-w-5xl"
        footer={<AsyncActionFooter cancelLabel="Cerrar" onCancel={() => setPrintPreviewDialog(null)} />}
      >
        {printPreviewDialog && <PrintableReportPreview preview={printPreviewDialog} />}
      </ActionDialog>
    </div>
  );
}

function ReportShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader
        meta={<span>Generación institucional</span>}
        title="Centro de reportes"
        subtitle="Plantillas configurables con datos reales del tenant."
      />
      <div className="p-6">{children}</div>
    </div>
  );
}

function ReportCard({
  template,
  availability,
  canPreview,
  canGenerate,
  isGenerating,
  onPreview,
  onGenerate,
}: {
  template: ReportTemplate;
  availability: ReportAvailability;
  canPreview: boolean;
  canGenerate: boolean;
  isGenerating: boolean;
  onPreview: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="panel flex min-h-[260px] flex-col justify-between p-5 transition-colors hover:border-primary/40">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <StatusBadge availability={availability} />
        </div>
        <div className="mt-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{template.category}</div>
        <h3 className="mt-1 text-[17px] font-semibold leading-tight text-foreground">{template.title}</h3>
        <p className="mt-2 min-h-[48px] text-[12px] leading-5 text-muted-foreground">{template.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {template.sources.slice(0, 4).map((source) => (
            <span key={source} className="rounded-full border border-border bg-surface-raised/50 px-2 py-1 text-[10px] font-mono text-muted-foreground">
              {source}
            </span>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">{availability.reason}</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-9 text-[12px]" onClick={onPreview} disabled={!canPreview}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Vista previa
        </Button>
        <Button className="h-9 text-[12px]" onClick={onGenerate} disabled={!canGenerate || isGenerating}>
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {isGenerating ? "Generando..." : "Generar"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ availability }: { availability: ReportAvailability }) {
  const className =
    availability.status === "available"
      ? "border-success/30 bg-success/10 text-success"
      : availability.status === "soon"
        ? "border-muted/30 bg-muted/10 text-muted-foreground"
        : "border-warning/30 bg-warning/10 text-warning";

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-wider ${className}`}>
      {availability.label}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-background/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function MetricCard({ metric }: { metric: ReportPreview["metrics"][number] }) {
  const tone =
    metric.tone === "red"
      ? "border-risk-high/40 text-risk-high"
      : metric.tone === "orange"
        ? "border-warning/40 text-warning"
        : metric.tone === "green"
          ? "border-success/40 text-success"
          : "border-primary/30 text-primary";

  return (
    <div className={`rounded-xl border bg-surface-raised/50 p-4 ${tone}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{metric.label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</div>
      {metric.detail && <div className="mt-1 text-[11px] text-muted-foreground">{metric.detail}</div>}
    </div>
  );
}

function StatePanel({ title, message, icon }: { title: string; message: string; icon?: React.ReactNode }) {
  const tone = title.toLowerCase().includes("permiso") ? "forbidden" : title.toLowerCase().includes("cargando") ? "loading" : "empty";
  return (
    <ModuleState tone={tone} title={title} description={message}>
      {icon ? <div className="sr-only">Estado con icono contextual</div> : null}
    </ModuleState>
  );
}

function PrintableReportPreview({ preview }: { preview: ReportPreview }) {
  return (
    <div className="space-y-6 rounded-xl border border-border bg-background p-5 text-foreground">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Reporte Nutri - {preview.category}
        </div>
        <h2 className="mt-2 text-2xl font-semibold">{preview.title}</h2>
        <div className="mt-1 text-[12px] text-muted-foreground">
          {preview.periodLabel} - {preview.patientLabel ?? "Tenant completo"} - {formatDateTime(preview.generatedAt)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {preview.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {preview.sections.map((section) => (
        <section key={section.title} className="rounded-xl border border-border bg-surface/60 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{section.title}</div>
          <div className="mt-3 grid gap-2">
            {section.items.map((item) => (
              <div key={item} className="rounded-lg bg-background/40 px-3 py-2 text-[12px] text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </section>
      ))}

      {preview.tables.map((table) => (
        <section key={table.title} className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-surface/60 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{table.title}</div>
          </div>
          {table.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-[12px]">
                <thead className="bg-surface-raised/60 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {table.rows.map((row) => (
                    <tr key={row.join("|")} className="text-muted-foreground">
                      {row.map((cell, index) => (
                        <td key={`${cell}-${index}`} className="px-4 py-3">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">{table.emptyText}</div>
          )}
        </section>
      ))}
    </div>
  );
}
function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  return new Date(value).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" });
}

function presentStatus(value: string) {
  const labels: Record<string, string> = {
    completed: "Completado",
    web: "Web",
    draft: "Borrador",
    active: "Activo",
    closed: "Cerrado",
  };
  return labels[value] ?? value;
}
