import { Link } from "react-router-dom";
import { ArrowRight, Building2, FileText, LockKeyhole, Ruler, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

const metrics = [
  ["14", "packs de especialidad"],
  ["48+", "sitios antropométricos"],
  ["ISAK", "estándar de medición"],
  ["100%", "trazabilidad clínica"],
];

const packs = ["Hospital", "Pediatría", "Gineco-obstetricia", "Enteral", "Parenteral", "Deportivo", "Consulta privada", "Wellness"];

export default function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="gradient-primary ring-glow flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-[11px] font-mono font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-[15px] font-semibold">Nutri</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[12px] text-muted-foreground md:flex">
            <a href="#packs" className="hover:text-foreground">Packs</a>
            <a href="#platform" className="hover:text-foreground">Plataforma</a>
            <a href="#architecture" className="hover:text-foreground">Arquitectura</a>
            <a href="#security" className="hover:text-foreground">Seguridad</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-[12px]">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm" className="border-0 bg-primary text-[12px] text-primary-foreground hover:bg-primary/90">
              <Link to="/app">Entrar al sistema</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen border-b border-border pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_15%,hsl(var(--primary)/0.18),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--surface)))]" />
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-primary">
              Clinical command center
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
              El sistema operativo de la <span className="font-serif italic text-primary">nutrición clínica</span> y deportiva.
            </h1>
            <p className="mt-7 max-w-2xl text-[17px] leading-8 text-muted-foreground">
              Un núcleo modular que se transforma según el área: hospital, pediatría, gineco-obstetricia, soporte enteral, alto rendimiento. Antropometría rigurosa, screening configurable y analítica de clase ejecutiva en una sola plataforma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 border-0 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/app">Ver el sistema en vivo <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11">
                <a href="#packs">Explorar packs</a>
              </Button>
            </div>
            <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-4">
              {metrics.map(([value, label]) => (
                <div key={label} className="rounded-xl border border-border bg-card/70 p-4">
                  <div className="text-2xl font-semibold text-foreground">{value}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <ProductPanel />
        </div>
      </section>

      <section id="packs" className="border-b border-border py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionKicker>Packs de especialidad</SectionKicker>
          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">Un producto base, múltiples entornos clínicos.</h2>
          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {packs.map((pack) => (
              <div key={pack} className="panel p-5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Pack</div>
                <div className="mt-2 text-lg font-semibold">{pack}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="border-b border-border bg-surface/35 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-3">
          <Feature icon={Stethoscope} title="Profundidad clínica. Estética premium." body="Flujos clínicos densos, lectura rápida y componentes diseñados para equipos de nutrición." />
          <Feature icon={Building2} title="Núcleo + Packs. Construido para crecer." body="Tenants, permisos, branding y módulos habilitables por institución sin duplicar producto." />
          <Feature icon={FileText} title="Diseñado para cumplir." body="Auditoría, trazabilidad, RLS y reportes como base para operación interna y madurez enterprise." />
        </div>
      </section>

      <section id="architecture" className="border-b border-border py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <SectionKicker>Arquitectura modular</SectionKicker>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Cada institución activa solo lo que necesita.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Nutri separa núcleo clínico, configuración SaaS, packs especializados y motores de cálculo para evolucionar sin romper datos históricos.
          </p>
        </div>
      </section>

      <section id="security" className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <LockKeyhole className="mx-auto mb-5 h-7 w-7 text-primary" />
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Seguridad por diseño.</h2>
          <p className="mt-5 text-muted-foreground">
            Aislamiento por tenant, roles, permisos y auditoría operacional para una base SaaS clínica seria.
          </p>
          <div className="mt-8 flex justify-center gap-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> RLS</span>
            <span className="inline-flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Trazabilidad</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductPanel() {
  return (
    <div className="hidden rounded-2xl border border-border bg-card/80 p-4 shadow-2xl lg:block">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Hospital Universitario San Mateo</div>
          <div className="mt-1 text-lg font-semibold">Panel ejecutivo institucional</div>
        </div>
        <div className="rounded-lg bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground">Nueva evaluación</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {["336", "38", "218", "84%"].map((value, index) => (
          <div key={value} className="rounded-xl border border-border bg-surface p-4">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="mt-2 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              {["Pacientes", "Riesgo", "Evaluaciones", "Adherencia"][index]}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-72 rounded-xl border border-border bg-surface p-5">
        <div className="mb-5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tendencia institucional</div>
        <div className="flex h-52 items-end gap-4">
          {[38, 44, 52, 60, 68, 72, 78, 86].map((height, index) => (
            <div key={index} className="flex-1 rounded-t-lg bg-primary/70" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof Stethoscope; title: string; body: string }) {
  return (
    <div className="panel p-6">
      <Icon className="mb-6 h-6 w-6 text-primary" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-primary">{children}</div>;
}
