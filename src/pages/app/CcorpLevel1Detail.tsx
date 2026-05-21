import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { getCcorpVariable } from "@/domain/ccorpLevel1/ccorpLevel1Formulas";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useCcorpAssessment } from "@/hooks/useCcorpLevel1";
import { resolveViewSource } from "@/lib/view-source";

export default function CcorpLevel1Detail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { hasPermission } = useAuthorization();
  const { data: detailResult, isLoading, isError, error } = useCcorpAssessment(id);
  const safeDetailResult = detailResult ?? { source: "supabase" as const, data: null };
  const detail = safeDetailResult.data ?? null;
  const results = detail?.results ?? null;
  const viewSource = resolveViewSource({ isAuthenticated, sources: [safeDetailResult.source] });
  const canPrint = hasPermission("ccorp_level1.print", "ccorp_level1.export");
  const somatoPoint = results && results.somatoX !== null && results.somatoY !== null
    ? [{ x: results.somatoX ?? 0, y: results.somatoY ?? 0, name: detail?.patientName ?? "Paciente" }]
    : [];

  if (isLoading) {
    return <div className="p-6 text-[13px] text-muted-foreground">Cargando informe CCORP Nivel 1...</div>;
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="panel border-risk-high/30 bg-risk-high/10 p-5 text-[13px] text-risk-high">
          {error instanceof Error ? error.message : "No se pudo cargar el informe CCORP Nivel 1."}
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6">
        <div className="panel p-5 text-[13px] text-muted-foreground">
          No se encontró la evaluación CCORP Nivel 1 solicitada.
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="p-6">
        <div className="panel p-5 text-[13px] text-muted-foreground">
          La evaluación existe, pero todavía no tiene resultados calculados para mostrar el informe.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>Informe imprimible - CCORP Nivel 1</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Informe de Composición Corporal Nivel 1"
        subtitle={`${detail.patientName} · ${new Date(detail.measuredAt).toLocaleDateString("es-BO")}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="h-8 text-[12px]">
              <Link to="/app/ccorp-level-1">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Volver
              </Link>
            </Button>
            <Button
              size="sm"
              className="h-8 border-0 text-[12px] text-primary-foreground gradient-primary"
              disabled
              title={canPrint ? "Vista imprimible interna pendiente de conectar." : "Sin permiso para imprimir o exportar."}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Imprimir Próximamente
            </Button>
          </>
        }
      />

      <div className="p-6 print:p-0">
        <div className="mx-auto max-w-6xl space-y-5 print:max-w-none">
          <section className="panel overflow-hidden print:border-0 print:shadow-none">
            <div className="grid gap-4 border-b border-border p-5 md:grid-cols-[1fr_320px]">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Nutri · Composición corporal</div>
                <h2 className="mt-2 text-2xl font-semibold">Informe de Composición Corporal Nivel 1</h2>
                <div className="mt-3 grid gap-2 text-[13px] text-muted-foreground md:grid-cols-2">
                  <div>Paciente: <span className="font-medium text-foreground">{detail.patientName}</span></div>
                  <div>Edad decimal: <span className="font-mono text-foreground">{detail.ageDecimal ?? "--"}</span></div>
                  <div>Fecha de medición: <span className="font-mono text-foreground">{new Date(detail.measuredAt).toLocaleDateString("es-BO")}</span></div>
                  <div>Sexo de referencia: <span className="font-mono text-foreground">{sexLabel(detail.sex)}</span></div>
                  <div>Episodio: <span className="text-foreground">{detail.encounterTitle ?? "Sin episodio asociado"}</span></div>
                  <div>Versión fórmula: <span className="font-mono text-foreground">{detail.formulaVersion}</span></div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-raised/40 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Resultado principal</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="% graso D&W" value={results.durninBodyFatPercent} suffix="%" />
                  <Metric label="% graso Withers" value={results.withersBodyFatPercent} suffix="%" />
                  <Metric label="Masa grasa" value={results.durninFatMassKg} suffix="kg" />
                  <Metric label="Masa magra" value={results.durninFatFreeMassKg} suffix="kg" />
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-5">
                <ReportBlock title="Resultados de medición">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-mono uppercase text-muted-foreground">
                          <th className="py-2 text-left font-normal">Variable</th>
                          <th className="py-2 text-left font-normal">Unidad</th>
                          <th className="py-2 text-right font-normal">Mediana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detail.measurements.map((measurement) => (
                          <tr key={measurement.id}>
                            <td className="py-2">{getCcorpVariable(measurement.variableCode).label ?? measurement.variableLabel}</td>
                            <td className="py-2 font-mono text-muted-foreground">{measurement.unit}</td>
                            <td className="py-2 text-right font-mono">{formatNumber(measurement.medianValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ReportBlock>

                <ReportBlock title="Índices y composición corporal">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Metric label="IMC" value={results.bmi} />
                    <Metric label="Índice cintura/cadera" value={results.waistHipRatio} />
                    <Metric label="Suma 6 pliegues" value={results.sum6Skinfolds} suffix="mm" />
                    <Metric label="FMI D&W" value={results.durninFmi} />
                    <Metric label="FFMI D&W" value={results.durninFfmi} />
                    <Metric label="Área muscular brazo" value={results.armMuscleAreaMm2} suffix="mm²" />
                    <Metric label="FMI Withers" value={results.withersFmi} />
                    <Metric label="FFMI Withers" value={results.withersFfmi} />
                    <Metric label="HWR" value={results.hwr} />
                  </div>
                </ReportBlock>
              </div>

              <div className="space-y-5">
                <ReportBlock title="Somatotipo de Heath & Carter">
                  <div className="grid grid-cols-3 gap-3">
                    <Metric label="Endomorfia" value={results.endomorphy} />
                    <Metric label="Mesomorfia" value={results.mesomorphy} />
                    <Metric label="Ectomorfia" value={results.ectomorphy} />
                  </div>
                  <div className="mt-4 h-[320px] rounded-lg border border-border bg-background/40 p-3">
                    <ResponsiveContainer>
                      <ScatterChart margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" domain={[-9, 9]} tick={{ fontSize: 10 }} label={{ value: "X: ecto - endo", position: "insideBottom", offset: -4, fontSize: 10 }} />
                        <YAxis type="number" dataKey="y" domain={[-10, 16]} tick={{ fontSize: 10 }} label={{ value: "Y", angle: -90, position: "insideLeft", fontSize: 10 }} />
                        <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                        <Scatter data={somatoPoint} fill="hsl(var(--primary))" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    X: {formatNumber(results.somatoX)} · Y: {formatNumber(results.somatoY)}
                  </div>
                </ReportBlock>

                <ReportBlock title="Cálculo de peso ideal">
                  <div className="space-y-3">
                    {(results.idealTargets ?? []).map((target) => (
                      <div key={target.method} className="rounded-lg border border-border bg-surface-raised/40 p-3">
                        <div className="text-[10px] font-mono uppercase text-muted-foreground">{target.method === "durnin" ? "Durnin & Womersley" : "Withers atletas"}</div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Metric label="Peso ideal" value={target.idealWeightKg} suffix="kg" />
                          <Metric label="Grasa a bajar" value={target.fatToLoseKg} suffix="kg" />
                          <Metric label="Magra objetivo" value={target.targetFatFreeMassKg} suffix="kg" />
                          <Metric label="Magra a subir" value={target.leanMassToGainKg} suffix="kg" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ReportBlock>
              </div>
            </div>
          </section>

          {(results.warnings ?? []).length ? (
            <div className="panel border-risk-moderate/30 bg-risk-moderate/10 p-4 text-[12px] text-risk-moderate">
              {(results.warnings ?? []).join(" ")}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReportBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface-raised/20 p-4">
      <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </section>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number | null; suffix: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-[13px] text-foreground">{formatNumber(value, suffix)}</div>
    </div>
  );
}

function formatNumber(value: number | null, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `${value.toFixed(2)}${suffix ? ` ${suffix}` : ""}`;
}

function sexLabel(value: string) {
  if (value === "male") return "Masculino";
  if (value === "female") return "Femenino";
  return "Otro";
}
