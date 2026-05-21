import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleState } from "@/components/common/ModuleState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MODULE_AREAS, MODULE_AREA_LABELS, type ModuleArea, type ModuleStatus } from "@/config/moduleRegistry";
import { useModuleRegistry } from "@/hooks/useModuleRegistry";
import { groupModulesByArea } from "@/lib/moduleAccess";
import { cn } from "@/lib/utils";

type AreaFilter = "all" | ModuleArea;

const statusLabel: Record<ModuleStatus, string> = {
  active: "Activo",
  partial: "Parcial",
  coming_soon: "Proximamente",
  blocked: "Bloqueado",
};

const statusClasses: Record<ModuleStatus, string> = {
  active: "border-primary/25 bg-primary/10 text-primary",
  partial: "border-risk-moderate/30 bg-risk-moderate/10 text-risk-moderate",
  coming_soon: "border-muted bg-muted/15 text-muted-foreground",
  blocked: "border-risk-high/30 bg-risk-high/10 text-risk-high",
};

export default function ModulesCenter() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<AreaFilter>("all");
  const { modules } = useModuleRegistry(query);

  const filteredModules = useMemo(
    () => modules.filter((module) => area === "all" || module.area === area),
    [area, modules],
  );
  const groups = useMemo(() => groupModulesByArea(filteredModules), [filteredModules]);
  const activeCount = filteredModules.filter((module) => module.access.canOpen).length;
  const blockedCount = filteredModules.filter((module) => module.access.disabled).length;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        meta="Sistema de modulos"
        title="Centro de modulos"
        subtitle="Mapa operativo de areas, permisos y estados. Solo abre rutas reales; lo pendiente queda marcado sin simular funcionalidad."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/module-settings">Configurar areas</Link>
          </Button>
        }
        className=""
      />

      <main className="space-y-6 p-6">
        <section className="grid gap-3 md:grid-cols-3">
          <Metric label="Modulos visibles" value={filteredModules.length} />
          <Metric label="Abribles ahora" value={activeCount} />
          <Metric label="Limitados o bloqueados" value={blockedCount} />
        </section>

        <section className="panel space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar modulo, permiso, pack o pendiente..."
                className="pl-9"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterButton active={area === "all"} onClick={() => setArea("all")}>
                Todas
              </FilterButton>
              {MODULE_AREAS.map((item) => (
                <FilterButton key={item} active={area === item} onClick={() => setArea(item)}>
                  {MODULE_AREA_LABELS[item]}
                </FilterButton>
              ))}
            </div>
          </div>
        </section>

        {groups.length === 0 ? (
          <ModuleState
            tone="empty"
            title="No hay modulos para esta busqueda"
            description="Ajusta el filtro de area o busca por nombre, permiso, pack o pendiente."
          />
        ) : (
          groups.map((group) => (
            <section key={group.area} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Area</div>
                  <h2 className="text-lg font-semibold text-foreground">{MODULE_AREA_LABELS[group.area]}</h2>
                </div>
                <Badge variant="outline">{group.modules.length} modulos</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Card key={module.id} className="border-border bg-surface/75">
                      <CardHeader className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-md border border-border bg-surface-raised p-2 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{module.label}</CardTitle>
                              <p className="mt-1 text-[11px] font-mono uppercase text-muted-foreground">{module.id}</p>
                            </div>
                          </div>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase", statusClasses[module.status])}>
                            {statusLabel[module.status]}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4 pt-0">
                        <p className="min-h-[42px] text-[13px] leading-6 text-muted-foreground">{module.description}</p>
                        <div className="grid gap-2 text-[12px] text-muted-foreground">
                          <Info label="Permiso" value={module.permission ?? "Sesion y tenant activo"} />
                          <Info label="Datos" value={module.status === "coming_soon" ? "Sin flujo activo" : "Supabase/RLS o contexto local seguro"} />
                          <Info label="Estado" value={module.access.reason ?? module.access.label} />
                          {module.pack && <Info label="Pack" value={module.pack} />}
                          {module.pending && <Info label="Pendiente" value={module.pending} />}
                        </div>
                        {module.access.canOpen && module.route ? (
                          <Button asChild size="sm" className="w-full">
                            <Link to={module.route}>Abrir modulo</Link>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full" disabled title={module.access.reason ?? module.pending}>
                            {module.access.label}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md border px-3 py-1.5 text-[12px] transition-colors",
        active
          ? "border-primary/40 bg-primary/12 text-primary"
          : "border-border bg-surface/60 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border/70 pt-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[65%] text-right text-foreground">{value}</span>
    </div>
  );
}
