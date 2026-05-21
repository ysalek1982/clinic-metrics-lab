import { GitBranch, LockKeyhole, Plus, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PackPill } from "@/components/common/PackPill";
import { Button } from "@/components/ui/button";
import { useFormulaCatalog } from "@/hooks/useClinicalCatalogs";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";

export default function Formulas() {
  const { activeTenant } = useTenantRuntime();
  const { data: formulaCatalog, isLoading } = useFormulaCatalog();
  const formulas = formulaCatalog?.data ?? [];
  const versions = formulas.flatMap((formula) => formula.versions.map((version) => ({ ...version, formula })));
  const dataSource = formulaCatalog?.source ?? "demo";
  const tenantSettings = activeTenant?.settings ?? {
    strictFormulaVersioning: true,
    aiAssistEnabled: false,
    requirePlanApproval: true,
    unitSystem: "metric",
  };

  if (!activeTenant) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-[13px] text-muted-foreground">
          Selecciona un tenant para revisar formulas institucionales.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        meta={`Motor de formulas · versionado · reproducibilidad clínica · ${dataSource}`}
        title="Motor de formulas"
        subtitle="Cada cálculo queda anclado a una versión inmutable y a reglas de aplicabilidad por edad, sexo, pack, población y protocolo."
        actions={
          <Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nueva versión
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid md:grid-cols-4 gap-3">
          <Metric label="Formulas" value={isLoading ? "..." : formulas.length} />
          <Metric label="Versiones activas" value={isLoading ? "..." : versions.filter((item) => item.status === "active").length} />
          <Metric label="Auditoría requerida" value={isLoading ? "..." : formulas.filter((item) => item.auditRequired).length} />
          <Metric label="Modo tenant" value={tenantSettings.strictFormulaVersioning ? "estricto" : "flexible"} accent="--primary" />
        </div>

        <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-3">
          <div className="panel overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-[15px] font-medium">Biblioteca versionada</h3>
                <p className="text-[12px] text-muted-foreground">Las versiones históricas no se modifican; se deprecan y se activan nuevas.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] tabular">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-raised/30">
                    <th className="text-left px-5 py-2.5 font-normal">Formula</th>
                    <th className="text-left px-5 py-2.5 font-normal">Categoría</th>
                    <th className="text-left px-5 py-2.5 font-normal">Versión</th>
                    <th className="text-left px-5 py-2.5 font-normal">Outputs</th>
                    <th className="text-left px-5 py-2.5 font-normal">Packs</th>
                    <th className="text-left px-5 py-2.5 font-normal">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!isLoading && versions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                        No hay formulas cargadas en el catálogo activo.
                      </td>
                    </tr>
                  )}
                  {versions.map((version) => (
                    <tr key={version.id} className="hover:bg-surface-raised/30">
                      <td className="px-5 py-3">
                        <div className="font-medium">{version.formula.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[260px] truncate">{version.expressionLabel}</div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{version.formula.category}</td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">v{version.version}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {version.outputs.map((output) => (
                            <span key={output} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised text-muted-foreground">
                              {output}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {version.applicability.packs.slice(0, 3).map((packId) => (
                            <PackPill key={packId} pack={packId} />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Status value={version.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <LockKeyhole className="w-4 h-4 text-primary" />
                <h3 className="text-[15px] font-medium">Política del tenant</h3>
              </div>
              <div className="space-y-2">
                <Policy label="Versionado estricto" value={tenantSettings.strictFormulaVersioning ? "Activo" : "Flexible"} />
                <Policy label="IA habilitada" value={tenantSettings.aiAssistEnabled ? "Sí" : "No"} />
                <Policy label="Aprobación de planes" value={tenantSettings.requirePlanApproval ? "Requerida" : "Opcional"} />
                <Policy label="Unidad" value={tenantSettings.unitSystem ?? "--"} />
              </div>
            </div>

            <div className="panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="text-[15px] font-medium">Aplicabilidad</h3>
              </div>
              <div className="space-y-3">
                {versions.slice(0, 3).map((version) => (
                  <div key={version.id} className="rounded-md bg-surface-raised/50 p-3">
                    <div className="text-[12px] font-medium">
                      {version.formula.name} v{version.version}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {version.applicability.populations.join(", ") || "general"} · {version.applicability.contexts.join(", ") || "general"}
                    </div>
                    <div className="text-[10px] font-mono text-primary mt-2">
                      {version.applicability.minAgeYears ?? 0}-{version.applicability.maxAgeYears ?? "∞"} años · {version.applicability.sex ?? "any"}
                    </div>
                  </div>
                ))}
                {!isLoading && versions.length === 0 && (
                  <div className="rounded-md bg-surface-raised/50 p-3 text-[12px] text-muted-foreground">
                    El tenant todavía no tiene un catálogo remoto visible para formulas.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="panel p-4" style={accent ? { boxShadow: `inset 3px 0 0 hsl(var(${accent}) / 0.6)` } : undefined}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[17px] font-semibold mt-2 capitalize">{value}</div>
    </div>
  );
}

function Policy({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-raised/50 px-3 py-2 flex justify-between gap-3 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-[10px] uppercase">{value}</span>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const color =
    value === "active"
      ? "text-risk-low bg-risk-low/10"
      : value === "deprecated"
        ? "text-risk-high bg-risk-high/10"
        : "text-muted-foreground bg-surface-raised";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-mono uppercase ${color}`}>{value}</span>;
}
