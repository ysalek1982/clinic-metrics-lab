import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/integrations/supabase/client";

export default function ActivateInvite() {
  const navigate = useNavigate();
  const { session, user, signInWithPassword, signUpWithPassword, refreshSession } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(session ? "signin" : "signup");
  const [email, setEmail] = useState(user.source === "supabase" ? user.email : "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(user.source === "supabase" ? user.name : "");
  const [title, setTitle] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAuthenticated = Boolean(session);
  const defaultHint = useMemo(() => "Códigos demo: HSM-FOUNDATION-2026 o EP-PERFORMANCE-2026", []);

  async function ensureSession() {
    if (session) return { ok: true as const };

    if (mode === "signup") {
      const signUp = await signUpWithPassword(email, password, { full_name: fullName, name: fullName });
      if (signUp.error) return { ok: false as const, error: signUp.error };
      if (signUp.needsEmailConfirmation) {
        return {
          ok: false as const,
          error: "Tu proyecto requiere confirmación por email antes de canjear la invitación.",
        };
      }
      return { ok: true as const };
    }

    const signIn = await signInWithPassword(email, password);
    if (signIn.error) return { ok: false as const, error: signIn.error };
    return { ok: true as const };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const sessionResult = await ensureSession();
    if (!sessionResult.ok) {
      setSubmitting(false);
      setError(sessionResult.error);
      return;
    }

    if (!supabase) {
      setSubmitting(false);
      setError("Supabase no está configurado en esta app.");
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("redeem_tenant_invite", {
      p_invite_code: inviteCode.trim(),
      p_full_name: fullName.trim(),
      p_title: title.trim() || null,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const activatedTenant = Array.isArray(data) ? data[0] : null;
    await refreshSession();
    setMessage(`Acceso activado para ${activatedTenant.tenant_name ?? "el tenant seleccionado"}.`);
    navigate("/app/tenants");
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden flex items-center">
        <div className="absolute inset-0 gradient-aurora" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative px-8 lg:px-16 py-12 max-w-3xl">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-14">
            <div className="w-8 h-8 rounded-md gradient-primary flex items-center justify-center ring-glow">
              <span className="text-primary-foreground font-mono font-bold text-[11px]">N</span>
            </div>
            <span className="font-semibold text-[14px]">Nutri</span>
          </Link>
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-primary mb-4">
            Activación de tenant
          </div>
          <h1 className="font-serif text-5xl lg:text-7xl leading-[1.02] tracking-tight">
            Vincula tu usuario a un tenant sin romper el aislamiento.
          </h1>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl">
            El canje usa una función segura en Supabase que crea el perfil, la membresía y el rol base del usuario autenticado.
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-3 max-w-2xl">
            {["Canje de invitación", "Perfil de usuario", "Membresía + rol"].map((item) => (
              <div key={item} className="panel p-4">
                <ShieldCheck className="w-4 h-4 text-primary mb-3" />
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 border-l border-border bg-surface/25">
        <div className="w-full max-w-md">
          <div className="panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Activar invitación</h2>
                <p className="text-[12px] text-muted-foreground">{isAuthenticated ? "Sesión activa detectada" : "Inicia sesión o crea tu usuario primero"}</p>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button type="button" variant={mode === "signup" ? "default" : "outline"} className={mode === "signup" ? "gradient-primary text-primary-foreground border-0" : ""} onClick={() => setMode("signup")}>
                  Crear usuario
                </Button>
                <Button type="button" variant={mode === "signin" ? "default" : "outline"} className={mode === "signin" ? "gradient-primary text-primary-foreground border-0" : ""} onClick={() => setMode("signin")}>
                  Iniciar sesión
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isAuthenticated && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email institucional</Label>
                    <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Cargo</Label>
                <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Director de nutrición, antropometrista, etc." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteCode">Código de invitación</Label>
                <Input id="inviteCode" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="HSM-FOUNDATION-2026" />
                <div className="text-[11px] text-muted-foreground">{defaultHint}</div>
              </div>

              {error && (
                <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-md border border-risk-low/30 bg-risk-low/10 px-3 py-2 text-[12px] text-risk-low">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0" disabled={submitting}>
                {submitting ? "Procesando..." : "Canjear invitación"}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <Button asChild type="button" variant="outline" className="w-full">
                <Link to="/login">Volver a login</Link>
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
