import { Link } from "react-router-dom";
import { ArrowUpRight, Lock, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleState } from "@/components/common/ModuleState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULE_AREAS, MODULE_AREA_LABELS } from "@/config/moduleRegistry";
import { getProfileModules, OPERATIONAL_PROFILES } from "@/config/operationalProfiles";
import { useModuleRegistry } from "@/hooks/useModuleRegistry";
import { getModulesForArea } from "@/lib/moduleAccess";

export default function ModuleSettings() {
  const { modules } = useModuleRegistry("");

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        meta="Configuracion local"
        title="Configuracion por perfiles operativos"
        subtitle="Perfiles para hospitales, consulta clinica, deporte, pediatria, nutricion operativa y administracion. Esta vista no guarda cambios hasta tener persistencia tenant-scoped."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/modules">Centro de modulos</Link>
          </Button>
        }
      />

      <main className="space-y-6 p-6">
        <ModuleState
          tone="warning"
          title="Configuracion persistente pendiente"
          description="Aplicar perfil esta deshabilitado: no existe aun backend tenant-scoped con RLS y auditoria para guardar preferencias por organizacion."
        >
          <div className="grid gap-2 text-[12px] text-muted-foreground md:grid-cols-3">
            <div>Modo actual: visual/local</div>
            <div>Persistencia: pendiente</div>
            <div>Auditoria: pendiente hasta backend real</div>
          </div>
        </ModuleState>

        <section className="grid gap-4 xl:grid-cols-2">
          {OPERATIONAL_PROFILES.map((profile) => {
            const profileModules = getProfileModules(profile, modules);
            const openableCount = profileModules.filter((module) => module.access?.canOpen).length;
            return (
              <Card key={profile.id} className="border-border bg-surface/75">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{profile.label}</CardTitle>
                        <Badge variant="outline">Perfil operativo</Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{profile.description}</p>
                    </div>
                    <Settings2 className="mt-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {profileModules.map((module) => (
                      <div key={module.id} className="rounded-md border border-border/70 bg-background/30 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-medium text-foreground">{module.label}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{module.permission ?? "Sin permiso especifico"}</div>
                          </div>
                          <Badge variant={module.access?.canOpen ? "default" : "outline"} className="shrink-0">
                            {module.access?.label ?? "Config."}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border border-border bg-background/25 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pendientes</div>
                    <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                      {profile.blockedRequirements.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[12px] text-muted-foreground">
                      {openableCount} abribles de {profileModules.length} modulos del perfil.
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/app/modules?profile=${profile.id}`}>
                          Ver modulos <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" disabled title="Configuracion persistente pendiente">
                        Aplicar perfil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Areas del sistema</div>
            <h2 className="text-lg font-semibold text-foreground">Detalle por area</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MODULE_AREAS.map((area) => {
              const areaModules = getModulesForArea(modules, area);
              return (
                <Card key={area} className="border-border bg-surface/75">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{MODULE_AREA_LABELS[area]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 pt-0">
                    {areaModules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-foreground">{module.label}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{module.permission ?? "Sin permiso especifico"}</div>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          {module.access?.label ?? "Config."}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
