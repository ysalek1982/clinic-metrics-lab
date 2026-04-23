import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Activity, Users, ShieldAlert, TrendingDown, ArrowUpRight, Stethoscope, Baby, Flower2, Droplets, Dumbbell, Bell } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { PackPill } from "@/components/common/PackPill";
import { Button } from "@/components/ui/button";
import { PATIENTS, ALERTS } from "@/data/demo";
import { Link } from "react-router-dom";

const trendData = [
  { d: "Ene", risk: 12, eval: 142, plan: 98 },
  { d: "Feb", risk: 15, eval: 168, plan: 121 },
  { d: "Mar", risk: 18, eval: 195, plan: 145 },
  { d: "Abr", risk: 22, eval: 218, plan: 172 },
];

const sparkline = [{ v: 8 }, { v: 12 }, { v: 10 }, { v: 14 }, { v: 18 }, { v: 22 }, { v: 26 }];

const packDistribution = [
  { name: "Clínico", value: 142, color: "var(--pack-clinical)" },
  { name: "Pediatría", value: 68, color: "var(--pack-pediatric)" },
  { name: "Gineco", value: 41, color: "var(--pack-gineco)" },
  { name: "Enteral", value: 22, color: "var(--pack-enteral)" },
  { name: "Deportivo", value: 35, color: "var(--pack-sport)" },
  { name: "Geriátrico", value: 28, color: "var(--pack-geriatric)" },
];

const riskGauge = [{ name: "score", value: 72, fill: "hsl(var(--primary))" }];

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        meta="Hospital Universitario San Mateo · Sede Central"
        title="Panel ejecutivo institucional"
        subtitle="Visión consolidada del estado nutricional, alertas activas y carga clínica."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-[12px]">Últimos 30 días</Button>
            <Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0">Generar informe</Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Pacientes activos"
            value="336"
            delta={{ value: 4.2, direction: "up", positive: "up" }}
            hint="vs mes anterior"
            icon={<Users className="w-3 h-3" />}
            sparkline={
              <ResponsiveContainer><AreaChart data={sparkline}><defs><linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#g1)" /></AreaChart></ResponsiveContainer>
            }
          />
          <KpiCard
            label="Riesgo nutricional alto/crítico"
            value="38"
            delta={{ value: 12, direction: "up", positive: "down" }}
            hint="requiere intervención"
            accent="--risk-high"
            icon={<ShieldAlert className="w-3 h-3" />}
          />
          <KpiCard
            label="Evaluaciones esta semana"
            value="218"
            delta={{ value: 9.4, direction: "up", positive: "up" }}
            hint="antropometría + clínicas"
            icon={<Activity className="w-3 h-3" />}
          />
          <KpiCard
            label="Adherencia media plan"
            value="84"
            unit="%"
            delta={{ value: 1.8, direction: "down", positive: "up" }}
            hint="reportada por pacientes"
            accent="--pack-sport"
            icon={<TrendingDown className="w-3 h-3" />}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Trend */}
          <div className="lg:col-span-2 panel p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tendencia institucional</div>
                <h3 className="text-[15px] font-medium mt-0.5">Riesgo, evaluaciones y planes activos</h3>
              </div>
              <div className="flex gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-risk-high" />Riesgo</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-primary" />Eval</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-pack-sport" />Planes</span>
              </div>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer>
                <AreaChart data={trendData} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gb" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="hsl(var(--pack-sport))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--pack-sport))" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="eval" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ga)" />
                  <Area type="monotone" dataKey="plan" stroke="hsl(var(--pack-sport))" strokeWidth={2} fill="url(#gb)" />
                  <Line type="monotone" dataKey="risk" stroke="hsl(var(--risk-high))" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk gauge */}
          <div className="panel p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Índice nutricional global</div>
            <h3 className="text-[15px] font-medium mt-0.5">NRS Institucional</h3>
            <div className="h-[200px] relative">
              <ResponsiveContainer>
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={riskGauge} startAngle={210} endAngle={-30}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={20} fill="hsl(var(--primary))" background={{ fill: "hsl(var(--surface-raised))" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-4xl font-serif italic text-primary">72</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">de 100</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Cobertura</span><span className="font-mono">94%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reevaluación</span><span className="font-mono">88%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Adherencia</span><span className="font-mono">84%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tiempo medio</span><span className="font-mono">11min</span></div>
            </div>
          </div>
        </div>

        {/* Distribution + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="panel p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Distribución por pack</div>
            <h3 className="text-[15px] font-medium mt-0.5 mb-4">Casos activos · {packDistribution.reduce((a, b) => a + b.value, 0)}</h3>
            <div className="h-[220px]">
              <ResponsiveContainer>
                <BarChart data={packDistribution} layout="vertical" margin={{ left: -10 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} width={75} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {packDistribution.map((p, i) => <rect key={i} fill={`hsl(${p.color})`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Critical patients */}
          <div className="lg:col-span-2 panel">
            <div className="px-5 py-4 flex items-center justify-between border-b border-border">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pacientes críticos</div>
                <h3 className="text-[15px] font-medium mt-0.5">Requieren intervención inmediata</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-[12px] text-muted-foreground hover:text-foreground">
                <Link to="/app/patients">Ver todos <ArrowUpRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {PATIENTS.filter((p) => p.risk === "critical" || p.risk === "high").slice(0, 5).map((p) => (
                <Link key={p.id} to={`/app/patients/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised/50 transition-colors">
                  <RiskDot level={p.risk} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium truncate">{p.firstName} {p.lastName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{p.mrn}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{p.diagnoses[0]}</div>
                  </div>
                  <PackPill pack={p.primaryPack} />
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">{p.ward}</div>
                    {p.bed && <div className="text-[10px] text-muted-foreground font-mono">cama {p.bed}</div>}
                  </div>
                  <RiskBadge level={p.risk} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent alerts */}
        <div className="panel">
          <div className="px-5 py-4 flex items-center justify-between border-b border-border">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Alertas activas</div>
              <h3 className="text-[15px] font-medium mt-0.5">Motor de reglas clínicas</h3>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-[12px] text-muted-foreground"><Link to="/app/alerts">Centro de alertas <ArrowUpRight className="w-3 h-3 ml-1" /></Link></Button>
          </div>
          <div className="divide-y divide-border">
            {ALERTS.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-4 px-5 py-3">
                <RiskDot level={a.severity} className="mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium">{a.patientName}</span>
                    {a.ward && <span className="text-[10px] font-mono text-muted-foreground">· {a.ward}</span>}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">{a.message}</div>
                </div>
                <RiskBadge level={a.severity} />
                <div className="text-[10px] text-muted-foreground font-mono w-24 text-right tabular">
                  {new Date(a.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
