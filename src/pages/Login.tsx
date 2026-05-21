import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState("ysalek@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signInWithPassword(email, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    navigate("/app");
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative flex items-center overflow-hidden">
        <div className="absolute inset-0 gradient-aurora" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative max-w-3xl px-8 py-12 lg:px-16">
          <Link to="/" className="mb-14 inline-flex items-center gap-2.5">
            <div className="gradient-primary ring-glow flex h-8 w-8 items-center justify-center rounded-md">
              <span className="text-[11px] font-mono font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-[14px] font-semibold">Nutri</span>
          </Link>

          <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.16em] text-primary">
            Plataforma inteligente de nutrición clínica
          </div>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight lg:text-7xl">
            Acceso seguro para equipos de nutrición premium.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Multi-tenant, roles granulares, auditoría completa y configuración institucional desde el primer día.
          </p>

          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["RLS por tenant", "Gobierno de formulas", "Trazabilidad clínica"].map((item) => (
              <div key={item} className="panel p-4">
                <ShieldCheck className="mb-3 h-4 w-4 text-primary" />
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center border-l border-border bg-surface/25 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Iniciar sesión</h2>
                <p className="text-[12px] text-muted-foreground">
                  {isSupabaseConfigured ? "Supabase Auth configurado" : "Modo demo local"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email institucional</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>

              {error && (
                <div className="rounded-md border border-risk-moderate/30 bg-risk-moderate/10 px-3 py-2 text-[12px] text-risk-moderate">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full border-0 text-primary-foreground gradient-primary" disabled={submitting}>
                {submitting ? "Validando..." : "Entrar con Supabase"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button asChild type="button" variant="outline" className="w-full">
                <Link to="/">Ver presentación del producto</Link>
              </Button>
              <Button asChild type="button" variant="ghost" className="w-full">
                <Link to="/activate">Activar invitación de tenant</Link>
              </Button>
            </form>

            <div className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
              La autenticación real usa Supabase Auth. El modo demo conserva los datos seed para diseño, QA y preventa.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
