import { Building2, CheckCircle2, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";

export default function TenantSelector() {
  const navigate = useNavigate();
  const { activationRequired } = useAuth();
  const { isPlatformSuperadmin } = useAuthorization();
  const { activeTenant, plans, setActiveTenant, source, tenants, isLoading } = useTenantRuntime();

  return (
    <div>
      <PageHeader
        meta={`Selector de workspaces · ${source}`}
        title="Selector de tenant"
        subtitle="Cambia entre organizaciones aisladas. Cada tenant conserva su plan, branding, packs y límites."
        actions={
          isPlatformSuperadmin ? (
            <Button asChild size="sm" className="h-8 border-0 text-primary-foreground gradient-primary">
              <Link to="/onboarding">Nuevo tenant</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid max-w-6xl gap-3 p-6 lg:grid-cols-2">
        {!isLoading && tenants.length === 0 && (
          <div className="panel p-5 text-[13px] text-muted-foreground">
            {activationRequired
              ? "Tu usuario aún no tiene membresías activas. Canjea una invitación para habilitar el tenant."
              : "No hay tenants visibles en el catálogo activo."}
          </div>
        )}

        {tenants.map((tenant) => {
          const plan = plans.find((item) => item.id === tenant.planId);
          const active = tenant.id === activeTenant?.id;

          return (
            <button
              key={tenant.id}
              onClick={() => {
                setActiveTenant(tenant.id);
                navigate("/app");
              }}
              className="panel min-w-0 p-5 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-border"
                  style={{ background: `${tenant.branding?.primaryColor ?? "#13c8df"}22`, color: tenant.branding?.primaryColor ?? "#13c8df" }}
                >
                  <span className="font-mono text-[12px] font-bold">{tenant.branding?.logoInitials ?? tenant.name?.slice(0, 2).toUpperCase() ?? "TN"}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[15px] font-semibold">{tenant.name ?? "Tenant sin nombre"}</h2>
                    {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {plan?.name ?? tenant.planId} · {tenant.status} · {tenant.region}
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <Metric label="Usuarios" value={tenant.usage?.users ?? 0} />
                    <Metric label="Pacientes" value={tenant.usage?.activePatients ?? 0} />
                    <Metric label="Sedes" value={tenant.usage?.branches ?? 0} />
                    <Metric label="Packs" value={tenant.usage?.enabledPacks ?? (tenant.enabledPacks ?? []).length} />
                  </div>
                </div>

                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {(tenant.enabledPacks ?? []).slice(0, 6).map((packId) => (
                  <span
                    key={packId}
                    className="rounded-full border border-border px-2 py-1 text-[10px] font-mono text-muted-foreground"
                  >
                    {packId}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-6 pb-6">
        <div className="flex gap-2">
          {activationRequired && (
            <Button asChild size="sm" className="border-0 text-primary-foreground gradient-primary">
              <Link to="/activate">Canjear invitación</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to="/app/platform">
              Abrir dashboard SaaS <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-surface-raised/60 px-2 py-2">
      <div className="tabular text-[13px] font-semibold">{value.toLocaleString("es")}</div>
      <div className="truncate text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
