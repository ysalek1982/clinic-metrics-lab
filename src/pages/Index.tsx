import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Baby, Flower2, Droplets, Dumbbell, Stethoscope, ShieldCheck, BarChart3, Layers, Sparkles, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const PACKS_PREVIEW = [
  { icon: Stethoscope, name: "Clínico Hospitalario", color: "var(--pack-clinical)" },
  { icon: Baby, name: "Pediatría & Crecimiento", color: "var(--pack-pediatric)" },
  { icon: Flower2, name: "Gineco-Obstetricia", color: "var(--pack-gineco)" },
  { icon: Droplets, name: "Nutrición Enteral", color: "var(--pack-enteral)" },
  { icon: Dumbbell, name: "Nutrición Deportiva", color: "var(--pack-sport)" },
  { icon: Activity, name: "Oncología & Cuidados", color: "var(--pack-onco)" },
];

const FEATURES = [
  { icon: Layers, title: "Núcleo + Packs especializados", desc: "Una arquitectura modular que se adapta a hospital, consulta, deporte y centros pediátricos sin reescribir flujos." },
  { icon: Activity, title: "Antropometría avanzada ISAK", desc: "Pliegues, perímetros, longitudes, somatotipo y motor de fórmulas configurable y versionado." },
  { icon: ShieldCheck, title: "Screening clínico configurable", desc: "NRS-2002, MNA-SF, MUST, STAMP y tus propios protocolos. Motor de reglas, no formularios estáticos." },
  { icon: BarChart3, title: "Analítica longitudinal", desc: "Dashboards ejecutivos, evolución temporal, comparativas inter-evaluador y KPIs institucionales." },
  { icon: Sparkles, title: "IA asistida con guardrails", desc: "Resúmenes, alertas y borradores de evolución — siempre bajo revisión profesional." },
  { icon: Lock, title: "Multi-tenant & auditable", desc: "RLS por organización, versionado de fórmulas, log de cambios y trazabilidad de extremo a extremo." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center ring-glow">
              <span className="text-primary-foreground font-mono font-bold text-[11px]">N</span>
            </div>
            <span className="font-semibold text-[14px]">Nutrition OS</span>
            <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 ml-1">v1.0</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-muted-foreground">
            <a href="#packs" className="hover:text-foreground transition-colors">Packs</a>
            <a href="#features" className="hover:text-foreground transition-colors">Plataforma</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Arquitectura</a>
            <a href="#security" className="hover:text-foreground transition-colors">Seguridad</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-[12px]">
              <Link to="/app">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm" className="text-[12px] gradient-primary text-primary-foreground border-0 hover:opacity-90">
              <Link to="/app">Entrar al sistema <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-aurora pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground border border-border rounded-full px-3 py-1 mb-6">
              <span className="status-dot bg-primary animate-pulse-glow" />
              Plataforma clínico-deportiva · Multi-tenant
            </div>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.02] tracking-tight">
              El sistema operativo<br />
              de la <em className="text-primary">nutrición clínica</em><br />
              y deportiva.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Un núcleo modular que se transforma según el área: hospital, pediatría, gineco-obstetricia,
              soporte enteral, alto rendimiento. Antropometría rigurosa, screening configurable y analítica
              de clase ejecutiva en una sola plataforma.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground border-0 hover:opacity-90 h-11">
                <Link to="/app">Ver el sistema en vivo <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 border-border">
                <a href="#packs">Explorar packs</a>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Multi-tenant RLS</span>
              <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Roles granulares</span>
              <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> Fórmulas versionadas</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> IA con guardrails</span>
            </div>
          </motion.div>

          {/* Floating stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { k: "14", l: "Packs de especialidad", c: "primary" },
              { k: "48+", l: "Sitios antropométricos", c: "pack-sport" },
              { k: "ISAK", l: "Estándar de medición", c: "pack-pediatric" },
              { k: "100%", l: "Trazabilidad clínica", c: "pack-gineco" },
            ].map((s) => (
              <div key={s.l} className="panel p-4">
                <div className="text-3xl font-serif italic" style={{ color: `hsl(var(--${s.c}))` }}>{s.k}</div>
                <div className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Packs */}
      <section id="packs" className="border-t border-border py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-primary mb-3">Packs de especialidad</div>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
              Una plataforma. <em className="text-muted-foreground/80">Catorce mundos clínicos.</em>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Activa solo lo que tu institución necesita. Cada pack habilita formularios, fórmulas,
              dashboards y protocolos diseñados específicamente para esa especialidad.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PACKS_PREVIEW.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="panel p-5 group hover:border-border/80 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, hsl(${p.color}), transparent)` }} />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: `hsl(${p.color} / 0.12)`, color: `hsl(${p.color})` }}>
                    <p.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Activable por org</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-[12px] text-muted-foreground font-mono">
            + Neonatología · Parenteral · Oncología · Nefrología · Gastro · Endocrino · Geriatría · Wellness · Tele
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border py-24 bg-surface/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-primary mb-3">Plataforma</div>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight max-w-2xl">
            Profundidad clínica. <em className="text-muted-foreground/80">Estética premium.</em>
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-background p-7 hover:bg-surface transition-colors">
                <f.icon className="w-5 h-5 text-primary mb-4" />
                <h3 className="font-medium text-[15px] mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="border-t border-border py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-primary mb-3">Arquitectura</div>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
              Núcleo + Packs.<br />
              <em className="text-muted-foreground/80">Construido para crecer.</em>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Un esquema relacional multi-tenant con +30 entidades, motor de fórmulas versionado,
              motor de reglas clínicas y separación estricta entre configuración, lógica y datos del paciente.
              Listo para integraciones HIS/HL7, telemetría y analítica avanzada.
            </p>
            <ul className="mt-6 space-y-2.5">
              {["Esquema multi-tenant con RLS por organización",
                "Fórmulas versionadas — reproducibilidad clínica",
                "Mediciones key-value — extensibilidad sin migrar",
                "Roles separados de perfiles (anti-escalada de privilegios)",
                "Edge functions para cálculos pesados e IA"].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[13px]">
                  <span className="w-1 h-1 mt-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-6 font-mono text-[11px] leading-relaxed">
            <div className="text-muted-foreground mb-3 text-[10px] uppercase tracking-wider">// schema preview</div>
            <pre className="text-foreground/80 overflow-x-auto">
{`organizations ──┬── branches
                ├── organization_packs
                └── org_settings

profiles ──┬── user_roles ──── role_permissions
           └── org_memberships

patients ──┬── encounters
           ├── allergies, medications
           ├── anthropometry_sessions
           │     └── measurements
           ├── nutrition_screenings
           ├── clinical_assessments
           ├── nutrition_plans
           ├── pediatric_records
           ├── pregnancy_records
           ├── enteral_plans
           ├── parenteral_plans
           ├── sports_profiles
           └── evolution_entries

formula_library ── formula_versions
alerts · tasks · reports · audit_logs`}
            </pre>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-t border-border py-24 bg-surface/20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Lock className="w-6 h-6 text-primary mx-auto mb-5" />
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight">Diseñado para <em>cumplir</em>.</h2>
          <p className="mt-5 text-muted-foreground">
            Roles granulares, auditoría exhaustiva, versionado de evaluaciones, log de acceso y
            arquitectura preparada para cumplimiento normativo. La IA siempre es opcional y revisada.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-5xl md:text-6xl tracking-tight">
            El futuro del software<br />de nutrición <em className="text-primary">empieza hoy.</em>
          </h2>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground border-0 hover:opacity-90 h-12 px-6">
              <Link to="/app">Entrar al sistema <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-muted-foreground">
          <div>© 2025 Nutrition OS · Hospital Universitario San Mateo (demo)</div>
          <div className="flex gap-5">
            <span>Multi-tenant</span>
            <span>Auditable</span>
            <span>Configurable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
