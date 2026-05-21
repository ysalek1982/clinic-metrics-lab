import { Building2, Network, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PackPill } from "@/components/common/PackPill";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useTenantReferences } from "@/hooks/useClinicalData";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { resolveViewSource } from "@/lib/view-source";

function careSettingLabel(value: string) {
  const labels: Record<string, string> = {
    inpatient: "Hospitalización",
    outpatient: "Consulta externa",
    mixed: "Mixto",
    sports: "Deportivo",
    telehealth: "Teleconsulta",
  };

  return labels[value] ?? value;
}

export default function Organization() {
  const { activeTenant } = useTenantRuntime();
  const { isAuthenticated } = useAuth();
  const { data: referenceResult } = useTenantReferences();
  const { data: institutionResult } = useInstitutionSettings();
  const safeReferenceResult = referenceResult ?? { source: "supabase" as const, data: { organizations: [] } };
  const organizations = (safeReferenceResult.data?.organizations ?? []).map((organization) => ({
    ...organization,
    branches: organization.branches ?? [],
    departments: organization.departments ?? [],
    services: organization.services ?? [],
  }));
  const institution = institutionResult?.data ?? null;
  const tenantEnabledPacks = activeTenant?.enabledPacks ?? [];
  const enabledPacks = institution?.enabledPacks ?? tenantEnabledPacks;
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [safeReferenceResult.source, institutionResult?.source ?? "supabase"],
  });

  if (!activeTenant) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-[13px] text-muted-foreground">
          Selecciona un tenant para revisar su estructura organizacional.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>Jerarquía institucional</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title={organizations[0]?.name ?? activeTenant?.name ?? "Organizacion"}
        subtitle="Tenant, sedes, departamentos, servicios, packs y configuración institucional."
        actions={
          <Button size="sm" className="h-8" variant="outline" disabled title="Próximamente">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva sede · Próximamente
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {viewSource === "fallback" && (
          <div className="panel px-4 py-3 text-[12px] text-muted-foreground">
            La estructura mantiene el mapa institucional mientras terminan de consolidarse sedes, servicios o settings del tenant.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Tipo" value={(activeTenant?.institutionType ?? "institucion").replaceAll("_", " ")} />
          <Metric label="Sedes" value={organizations.flatMap((organization) => organization.branches).length} />
          <Metric label="Servicios" value={organizations.flatMap((organization) => organization.services).length} />
          <Metric label="Packs activos" value={`${enabledPacks.length} / ${tenantEnabledPacks.length}`} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Network className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-[15px] font-medium">Estructura operativa</h3>
                <p className="text-[12px] text-muted-foreground">Sedes, departamentos y servicios con packs por defecto.</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {organizations.map((organization) => (
                <div key={organization.id} className="px-5 py-4">
                  <div className="mb-3 text-[13px] font-medium">{organization.name}</div>
                  {organization.branches.map((branch) => {
                    const departments = organization.departments.filter((department) => department.branchId === branch.id);
                    return (
                      <div key={branch.id} className="mb-4 last:mb-0">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[13px] font-medium">{branch.name}</div>
                            <div className="text-[11px] text-muted-foreground">{branch.city} · {branch.timezone}</div>
                          </div>
                        </div>
                        <div className="ml-11 space-y-2">
                          {departments.map((department) => {
                            const services = organization.services.filter((service) => service.departmentId === department.id);
                            return (
                              <div key={department.id} className="rounded-md bg-surface-raised/50 p-3">
                                <div className="text-[12px] font-medium">{department.name}</div>
                                <div className="mb-3 text-[10px] font-mono text-muted-foreground">{department.clinicalArea}</div>
                                <div className="space-y-2">
                                  {services.map((service) => (
                                    <div key={service.id} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2">
                                      <div>
                                        <div className="text-[12px]">{service.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{careSettingLabel(service.careSetting)}</div>
                                      </div>
                                      <PackPill pack={service.defaultPack} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-medium">Packs de especialidad</h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Cada pack habilita módulos, formulas, dashboards y protocolos específicos.
              </p>
            </div>
            <div className="max-h-[680px] divide-y divide-border overflow-auto">
              {enabledPacks.map((packId) => (
                <div key={packId} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <div className="text-[13px] font-medium capitalize">{packId.replaceAll("_", " ")}</div>
                    <div className="text-[11px] text-muted-foreground">Pack habilitado en configuración institucional</div>
                  </div>
                  <PackPill pack={packId} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-[14px] font-medium capitalize">{value}</div>
    </div>
  );
}
