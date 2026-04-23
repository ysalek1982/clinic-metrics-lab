import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Stethoscope, AlertTriangle, FileText, Activity, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { PackPill } from "@/components/common/PackPill";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PATIENTS, ANTHRO_SESSIONS, EVOLUTIONS, SCREENINGS, PLANS } from "@/data/demo";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";

function age(b: string) {
  const d = new Date(b); const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}

export default function PatientDetail() {
  const { id } = useParams();
  const p = PATIENTS.find((x) => x.id === id) ?? PATIENTS[0];
  const sessions = ANTHRO_SESSIONS.filter((s) => s.patientId === p.id);
  const evolutions = EVOLUTIONS.filter((e) => e.patientId === p.id);
  const screening = SCREENINGS.find((s) => s.patientId === p.id);
  const plan = PLANS.find((pl) => pl.patientId === p.id);

  const weightTrend = sessions.map((s) => ({
    date: new Date(s.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
    weight: s.measurements.find((m) => m.site === "Peso")?.value,
    fat: s.derived.fatMassPct,
    skinfolds: s.derived.sumSkinfolds6,
  }));

  return (
    <div>
      <div className="border-b border-border bg-surface/30">
        <div className="px-6 py-3">
          <Link to="/app/patients" className="text-[11px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3 h-3" /> Pacientes
          </Link>
        </div>
        <div className="px-6 pb-5 flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary-glow/10 border border-primary/20 flex items-center justify-center text-lg font-serif italic">
              {p.firstName[0]}{p.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight">{p.firstName} {p.lastName}</h1>
                <RiskBadge level={p.risk} size="md" />
              </div>
              <div className="flex items-center gap-3 mt-1 text-[12px] font-mono text-muted-foreground">
                <span>{p.mrn}</span>
                <span>·</span>
                <span>{age(p.birthDate)} años · {p.sex === "male" ? "Masculino" : "Femenino"}</span>
                <span>·</span>
                <span>{p.ward}{p.bed ? ` cama ${p.bed}` : ""}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {p.packs.map((pk) => <PackPill key={pk} pack={pk} />)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[12px]">Programar seguimiento</Button>
            <Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0">Nueva evaluación</Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick info strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <InfoTile label="Diagnósticos" value={p.diagnoses.length} hint={p.diagnoses[0]} />
          <InfoTile label="Alergias" value={p.allergies.length || "—"} hint={p.allergies.join(", ") || "Sin alergias"} accent={p.allergies.length ? "--risk-high" : undefined} />
          <InfoTile label="Última evaluación" value={p.lastEvaluation ? new Date(p.lastEvaluation).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) : "—"} hint="Hace 4 días" />
          <InfoTile label="Próximo seguimiento" value={p.nextFollowUp ? new Date(p.nextFollowUp).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) : "—"} hint="En 2 días" accent="--primary" />
        </div>

        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList className="bg-surface-raised/40 border border-border h-9 p-0.5">
            <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-background">Resumen</TabsTrigger>
            <TabsTrigger value="anthropometry" className="text-[12px] data-[state=active]:bg-background">Antropometría</TabsTrigger>
            <TabsTrigger value="screening" className="text-[12px] data-[state=active]:bg-background">Screening</TabsTrigger>
            <TabsTrigger value="plan" className="text-[12px] data-[state=active]:bg-background">Plan</TabsTrigger>
            <TabsTrigger value="evolution" className="text-[12px] data-[state=active]:bg-background">Evolución</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {weightTrend.length > 0 && (
              <div className="lg:col-span-2 panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Composición corporal</div>
                    <h3 className="text-[15px] font-medium">Evolución longitudinal</h3>
                  </div>
                  <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" />Peso</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-pack-sport" />% Grasa</span>
                  </div>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer>
                    <AreaChart data={weightTrend} margin={{ left: -10, right: 8 }}>
                      <defs>
                        <linearGradient id="gw" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                      <YAxis yAxisId="l" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                      <YAxis yAxisId="r" orientation="right" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Area yAxisId="l" type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gw)" />
                      <Line yAxisId="r" type="monotone" dataKey="fat" stroke="hsl(var(--pack-sport))" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {screening && (
              <div className="panel p-5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Screening activo</div>
                <h3 className="text-[15px] font-medium mb-3">{screening.protocol}</h3>
                <div className="text-4xl font-serif italic mb-1" style={{ color: `hsl(var(--risk-${screening.level}))` }}>{screening.score}</div>
                <RiskBadge level={screening.level} size="md" />
                <p className="text-[12px] text-muted-foreground mt-3">{screening.recommendation}</p>
                <div className="mt-3 pt-3 border-t border-border space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Banderas</div>
                  {screening.flags.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[11px]">
                      <AlertTriangle className="w-3 h-3 text-risk-high" />
                      <span className="font-mono">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pack-specific info */}
            {p.enteral && (
              <div className="lg:col-span-3 panel p-5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-pack-enteral mb-1">Pack Enteral</div>
                <h3 className="text-[15px] font-medium mb-4">Soporte nutricional activo</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 tabular">
                  <Stat label="Sonda" value={p.enteral.tubeType} />
                  <Stat label="Fórmula" value={p.enteral.formula} />
                  <Stat label="Velocidad" value={`${p.enteral.rateMlH} ml/h`} />
                  <Stat label="Total kcal/día" value={p.enteral.totalKcal} />
                  <Stat label="Tolerancia" value={p.enteral.tolerance} accent={p.enteral.tolerance !== "good" ? "--risk-moderate" : undefined} />
                </div>
              </div>
            )}

            {p.sport && (
              <div className="lg:col-span-3 panel p-5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-pack-sport mb-1">Pack Deportivo</div>
                <h3 className="text-[15px] font-medium mb-4">Perfil de rendimiento</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 tabular">
                  <Stat label="Disciplina" value={p.sport.discipline} />
                  <Stat label="Categoría" value={p.sport.category} />
                  <Stat label="Posición" value={p.sport.position || "—"} />
                  <Stat label="Fase" value={p.sport.phase} />
                  <Stat label="Objetivo" value={p.sport.objective} accent="--pack-sport" />
                </div>
              </div>
            )}

            {p.pregnancy && (
              <div className="lg:col-span-3 panel p-5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-pack-gineco mb-1">Pack Gineco-Obstétrico</div>
                <h3 className="text-[15px] font-medium mb-4">Embarazo en curso</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 tabular">
                  <Stat label="Semanas gestación" value={`${p.pregnancy.weeksGestation} sem`} accent="--pack-gineco" />
                  <Stat label="Peso pregestacional" value={`${p.pregnancy.prePregnancyWeight} kg`} />
                  <Stat label="Ganancia esperada" value={`${p.pregnancy.expectedGain[0]}–${p.pregnancy.expectedGain[1]} kg`} />
                  <Stat label="Ganancia actual" value={`${p.pregnancy.actualGain} kg`} />
                </div>
              </div>
            )}

            {p.pediatric && (
              <div className="lg:col-span-3 panel p-5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-pack-pediatric mb-1">Pack Pediátrico</div>
                <h3 className="text-[15px] font-medium mb-4">Crecimiento y desarrollo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 tabular">
                  {p.pediatric.weightForAgeZ !== undefined && <Stat label="Z peso/edad" value={p.pediatric.weightForAgeZ.toFixed(1)} accent={Math.abs(p.pediatric.weightForAgeZ) > 2 ? "--risk-high" : undefined} />}
                  {p.pediatric.heightForAgeZ !== undefined && <Stat label="Z talla/edad" value={p.pediatric.heightForAgeZ.toFixed(1)} />}
                  {p.pediatric.bmiForAgeZ !== undefined && <Stat label="Z IMC/edad" value={p.pediatric.bmiForAgeZ.toFixed(1)} accent={Math.abs(p.pediatric.bmiForAgeZ) > 2 ? "--risk-high" : undefined} />}
                  {p.pediatric.gestationalAgeWeeks && <Stat label="EG al nacer" value={`${p.pediatric.gestationalAgeWeeks} sem`} />}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="anthropometry" className="space-y-3">
            {sessions.length === 0 ? (
              <Empty msg="Aún no hay sesiones antropométricas." />
            ) : (
              <div className="panel">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Historial</div>
                    <h3 className="text-[15px] font-medium">{sessions.length} sesiones · Protocolo ISAK</h3>
                  </div>
                  <Button asChild size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0">
                    <Link to="/app/anthropometry">Nueva sesión</Link>
                  </Button>
                </div>
                <table className="w-full text-[13px] tabular">
                  <thead>
                    <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-raised/30">
                      <th className="text-left px-5 py-2.5 font-normal">Fecha</th>
                      <th className="text-left px-5 py-2.5 font-normal">Evaluador</th>
                      <th className="text-left px-5 py-2.5 font-normal">Peso</th>
                      <th className="text-left px-5 py-2.5 font-normal">IMC</th>
                      <th className="text-left px-5 py-2.5 font-normal">ΣP6</th>
                      <th className="text-left px-5 py-2.5 font-normal">% Grasa</th>
                      <th className="text-left px-5 py-2.5 font-normal">Calidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-raised/30">
                        <td className="px-5 py-3">{new Date(s.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td className="px-5 py-3 text-muted-foreground">{s.evaluator}</td>
                        <td className="px-5 py-3 font-medium">{s.measurements.find((m) => m.site === "Peso")?.value} kg</td>
                        <td className="px-5 py-3">{s.derived.bmi}</td>
                        <td className="px-5 py-3">{s.derived.sumSkinfolds6} mm</td>
                        <td className="px-5 py-3 font-medium" style={{ color: "hsl(var(--pack-sport))" }}>{s.derived.fatMassPct}%</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono">
                            <span className="w-12 h-1 rounded-full bg-surface-raised overflow-hidden">
                              <span className="block h-full bg-risk-low" style={{ width: `${s.qualityIndex}%` }} />
                            </span>
                            {s.qualityIndex}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="screening">
            {screening ? (
              <div className="panel p-6">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{screening.protocol} · {new Date(screening.date).toLocaleDateString()}</div>
                <h3 className="text-2xl font-semibold mt-1">Score {screening.score}</h3>
                <RiskBadge level={screening.level} size="md" />
                <p className="text-[13px] text-muted-foreground mt-4">{screening.recommendation}</p>
              </div>
            ) : <Empty msg="Sin screenings registrados." />}
          </TabsContent>

          <TabsContent value="plan">
            {plan ? (
              <div className="panel p-6">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Plan {plan.type} · activo desde {new Date(plan.startDate).toLocaleDateString()}</div>
                <h3 className="text-[15px] font-medium mt-1 mb-4">{plan.diet}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 tabular">
                  <Stat label="Energía" value={`${plan.kcal} kcal`} accent="--primary" />
                  <Stat label="Proteína" value={`${plan.protein_g} g`} />
                  <Stat label="Carbohidratos" value={`${plan.carbs_g} g`} />
                  <Stat label="Grasas" value={`${plan.fat_g} g`} />
                  <Stat label="Líquidos" value={`${plan.fluids_ml} ml`} />
                </div>
              </div>
            ) : <Empty msg="Sin plan asignado." />}
          </TabsContent>

          <TabsContent value="evolution">
            <div className="panel">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[15px] font-medium">Línea de tiempo clínica</h3>
              </div>
              <div className="p-5 space-y-0">
                {evolutions.map((e, i) => (
                  <div key={e.id} className="flex gap-4 pb-5 relative">
                    {i < evolutions.length - 1 && <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />}
                    <div className="w-3.5 h-3.5 rounded-full bg-primary/20 border border-primary mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                        <span>{new Date(e.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        <span>·</span>
                        <span className="uppercase">{e.type}</span>
                        <span>·</span>
                        <span>{e.author}</span>
                      </div>
                      <p className="text-[13px] mt-1">{e.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InfoTile({ label, value, hint, accent }: { label: string; value: any; hint?: string; accent?: string }) {
  return (
    <div className="panel p-3.5" style={accent ? { boxShadow: `inset 3px 0 0 hsl(var(${accent}) / 0.6)` } : undefined}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[15px] font-medium mt-1 tabular">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</div>}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[14px] font-medium mt-1" style={accent ? { color: `hsl(var(${accent}))` } : undefined}>{value}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="panel p-12 text-center text-[13px] text-muted-foreground">
      <FileText className="w-6 h-6 mx-auto mb-2 opacity-40" />
      {msg}
    </div>
  );
}
