import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Building2, CreditCard, ServerCog, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { useCatalogStatus } from "@/hooks/useCatalogStatus";
import { usePlatformTenantSummaries, useSubscriptionPlansCatalog, useTenantCatalog } from "@/hooks/useSaasCatalogs";

export default function PlatformAdmin() {
  const { data: catalogStatus, isLoading: catalogLoading, isError: catalogError } = useCatalogStatus();
  const { data: tenantCatalog } = useTenantCatalog();
  const { data: summariesCatalog } = usePlatformTenantSummaries();
  const { data: plansCatalog } = useSubscriptionPlansCatalog();

  const safeCatalogStatus = catalogStatus ?? {
    source: "supabase" as const,
    planCount: 0,
    packCount: 0,
    measurementSiteCount: 0,
    measurementProtocolCount: 0,
    formulaCount: 0,
    formulaVersionCount: 0,
    screeningTemplateCount: 0,
    checkedAt: "",
  };
  const tenants = tenantCatalog?.data ?? [];
  const summaries = summariesCatalog?.data ?? [];
  const plans = plansCatalog?.data ?? [];

  const activeTenants = tenants.filter((tenant) => tenant.status === "active").length;
  const trialTenants = tenants.filter((tenant) => tenant.status === "trial").length;
  const pastDueTenants = tenants.filter((tenant) => tenant.status === "past_due").length;
  const users = tenants.reduce((sum, tenant) => sum + (tenant.usage?.users ?? 0), 0);
  const patients = tenants.reduce((sum, tenant) => sum + (tenant.usage?.activePatients ?? 0), 0);

  const activityData = summaries.map((tenant) => ({
    name: (tenant.name ?? "Tenant").split(" ").slice(0, 2).join(" "),
    patients: tenant.activePatients,
    users: tenant.users,
  }));

  return (
    <div>
      <PageHeader
        meta={`Operaciones de plataforma · ${summariesCatalog?.source ?? "demo"}`}
        title="Dashboard SaaS de administración"
        subtitle="Vista interna para superadmin: tenants, actividad, planes, consumo y estado operativo."
        actions={
          <Button size="sm" className="h-8 gradient-primary text-primary-foreground border-0">
            Administrar planes
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Tenants activos"
            value={activeTenants}
            hint={`${trialTenants} en trial · ${pastDueTenants} vencidos`}
            icon={<Building2 className="w-3 h-3" />}
          />
          <KpiCard
            label="Usuarios totales"
            value={users}
            delta={{ value: 8.1, direction: "up", positive: "up" }}
            icon={<Users className="w-3 h-3" />}
          />
          <KpiCard
            label="Pacientes activos"
            value={patients.toLocaleString("es")}
            delta={{ value: 5.6, direction: "up", positive: "up" }}
            icon={<Activity className="w-3 h-3" />}
          />
          <KpiCard
            label="Planes del catálogo"
            value={safeCatalogStatus.planCount ?? plans.length}
            hint={safeCatalogStatus.source === "supabase" ? "Supabase activo" : "Modo demo"}
            accent="--pack-sport"
            icon={<CreditCard className="w-3 h-3" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="panel p-5 xl:col-span-2">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Consumo estimado
                </div>
                <h3 className="mt-0.5 text-[15px] font-medium">Pacientes y usuarios por tenant</h3>
              </div>
              <ServerCog className="h-4 w-4 text-primary" />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={activityData} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="patients" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="users" fill="hsl(var(--pack-sport))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="border-b border-border px-5 py-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Estado operativo
              </div>
              <h3 className="mt-0.5 text-[15px] font-medium">Plano de control SaaS</h3>
            </div>
            <div className="divide-y divide-border">
              {[
                ["Supabase Postgres", catalogError ? "No disponible" : catalogLoading ? "Verificando" : "Online"],
                ["Políticas RLS", summariesCatalog?.source === "supabase" ? "Metadata pública" : "Tenant scoped listo"],
                ["Auth", "Supabase configurado"],
                ["Billing", "Pendiente"],
                ["IA asistida", "Controlada por plan"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-5 py-3 text-[12px]">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono text-[10px] text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Plano de datos
              </div>
              <h3 className="mt-0.5 text-[15px] font-medium">Catálogos maestros desde Supabase</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                La app puede cargar catálogos globales antes del login; los datos clínicos por tenant siguen aislados por RLS.
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 md:min-w-[620px] md:grid-cols-6">
              <CatalogMetric label="Packs" value={safeCatalogStatus.packCount} loading={catalogLoading} />
              <CatalogMetric label="Sitios" value={safeCatalogStatus.measurementSiteCount} loading={catalogLoading} />
              <CatalogMetric label="Protocolos" value={safeCatalogStatus.measurementProtocolCount} loading={catalogLoading} />
              <CatalogMetric label="Formulas" value={safeCatalogStatus.formulaCount} loading={catalogLoading} />
              <CatalogMetric label="Versiones" value={safeCatalogStatus.formulaVersionCount} loading={catalogLoading} />
              <CatalogMetric label="Screenings" value={safeCatalogStatus.screeningTemplateCount} loading={catalogLoading} />
            </div>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tenants</div>
            <h3 className="mt-0.5 text-[15px] font-medium">Operación comercial y de uso</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-surface-raised/70 text-[10px] font-mono uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Tenant</th>
                  <th className="px-5 py-3 text-left">Plan</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-right">Usuarios</th>
                  <th className="px-5 py-3 text-right">Pacientes</th>
                  <th className="px-5 py-3 text-right">Reportes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaries.map((tenant) => (
                  <tr key={tenant.tenantId} className="hover:bg-surface-raised/40">
                    <td className="px-5 py-3 font-medium">{tenant.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {plans.find((plan) => plan.id === tenant.planId)?.name ?? tenant.planId}
                    </td>
                    <td className="px-5 py-3">
                      <Status value={tenant.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{tenant.users}</td>
                    <td className="px-5 py-3 text-right font-mono">{tenant.activePatients.toLocaleString("es")}</td>
                    <td className="px-5 py-3 text-right font-mono">{tenant.monthlyReports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogMetric({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-md bg-surface-raised/50 px-3 py-2 text-center">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-[16px] font-semibold tabular-nums">{loading ? "..." : value ?? "-"}</div>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const color =
    value === "active"
      ? "text-risk-low bg-risk-low/10"
      : value === "trial"
        ? "text-primary bg-primary/10"
        : "text-risk-high bg-risk-high/10";

  return <span className={`rounded-full px-2 py-1 text-[10px] font-mono uppercase ${color}`}>{value}</span>;
}
