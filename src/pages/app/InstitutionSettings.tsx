import {
  BellRing,
  Globe2,
  Palette,
  Settings2,
  ShieldCheck,
  type LucideIcon,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PACKS } from "@/data/packs";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useInstitutionSettings, useUpdateInstitutionSettings } from "@/hooks/useInstitutionSettings";
import { useClinicalModuleCatalog, useSpecialtyPackCatalog } from "@/hooks/useSaasCatalogs";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { resolveViewSource, viewSourceDescription } from "@/lib/view-source";
import { cn } from "@/lib/utils";
import type { PackId } from "@/types/domain";
import type { ClinicalModuleId } from "@/types/saas";

type SettingsFormState = {
  commercialName: string;
  logoInitials: string;
  primaryColor: string;
  accentColor: string;
  language: "es" | "en" | "pt";
  timezone: string;
  unitSystem: "metric" | "imperial";
  defaultFollowUpDays: number;
  strictFormulaVersioning: boolean;
  aiAssistEnabled: boolean;
  requirePlanApproval: boolean;
  enabledPacks: PackId[];
  enabledModules: ClinicalModuleId[];
};

export default function InstitutionSettings() {
  const { isAuthenticated } = useAuth();
  const { isPlatformSuperadmin } = useAuthorization();
  const { activePlan, activeTenant } = useTenantRuntime();
  const institutionQuery = useInstitutionSettings();
  const packCatalogQuery = useSpecialtyPackCatalog();
  const moduleCatalogQuery = useClinicalModuleCatalog();
  const updateSettings = useUpdateInstitutionSettings();
  const institutionResult = institutionQuery.data;
  const packCatalog = packCatalogQuery.data ?? { source: "supabase" as const, data: [] };
  const moduleCatalog = moduleCatalogQuery.data ?? { source: "supabase" as const, data: [] };
  const institution = institutionResult?.data ?? null;
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [institutionResult?.source ?? "supabase", packCatalog.source, moduleCatalog.source],
  });
  const [form, setForm] = useState<SettingsFormState>({
    commercialName: "",
    logoInitials: "",
    primaryColor: "#13c8df",
    accentColor: "#a6e13a",
    language: "es",
    timezone: "America/La_Paz",
    unitSystem: "metric",
    defaultFollowUpDays: 14,
    strictFormulaVersioning: true,
    aiAssistEnabled: false,
    requirePlanApproval: true,
    enabledPacks: [],
    enabledModules: [],
  });
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!institution) {
      return;
    }

    setForm({
      commercialName: institution.branding?.commercialName ?? institution.name,
      logoInitials: institution.branding?.logoInitials ?? "NT",
      primaryColor: institution.branding?.primaryColor ?? "#13c8df",
      accentColor: institution.branding?.accentColor ?? "#a6e13a",
      language: institution.settings?.language ?? "es",
      timezone: institution.settings?.timezone ?? "America/La_Paz",
      unitSystem: institution.settings?.unitSystem ?? "metric",
      defaultFollowUpDays: institution.settings?.defaultFollowUpDays ?? 14,
      strictFormulaVersioning: institution.settings?.strictFormulaVersioning ?? true,
      aiAssistEnabled: institution.settings?.aiAssistEnabled ?? false,
      requirePlanApproval: institution.settings?.requirePlanApproval ?? true,
      enabledPacks: institution.enabledPacks ?? [],
      enabledModules: (institution.enabledModules ?? []).map((module) => module.moduleId),
    });
    setLimitMessage(null);
  }, [institution]);

  const availablePacks = useMemo(() => (packCatalog.data ?? []).filter((pack) => pack.systemEnabled), [packCatalog.data]);
  const availableModules = useMemo(
    () => (moduleCatalog.data ?? []).filter((module) => module.systemEnabled),
    [moduleCatalog.data],
  );
  const allAvailablePackIds = useMemo(() => availablePacks.map((pack) => pack.id), [availablePacks]);
  const enabledPackSet = useMemo(() => new Set(form.enabledPacks), [form.enabledPacks]);
  const modulesByPack = useMemo(() => {
    return availableModules.reduce<Record<string, typeof availableModules>>((accumulator, module) => {
      accumulator[module.packId] = accumulator[module.packId] ?? [];
      accumulator[module.packId].push(module);
      return accumulator;
    }, {});
  }, [availableModules]);

  function moduleIdsForPacks(packIds: PackId[]) {
    const selectedPacks = new Set(packIds);
    return availableModules.filter((module) => selectedPacks.has(module.packId)).map((module) => module.id);
  }

  function enforcePackLimit(packIds: PackId[]) {
    const limit = activePlan?.enabledPackLimit ?? null;

    if (isPlatformSuperadmin || limit === null || limit === undefined || packIds.length <= limit) {
      return packIds;
    }

    setLimitMessage(
      `El plan ${activePlan?.name ?? "actual"} permite hasta ${limit} packs activos. Se seleccionaron los primeros ${limit} según el orden institucional.`,
    );
    return packIds.slice(0, limit);
  }

  function selectAllPacksAndModules() {
    setLimitMessage(null);

    setForm((current) => {
      const selectedPacks = enforcePackLimit(allAvailablePackIds);

      return {
        ...current,
        enabledPacks: selectedPacks,
        enabledModules: moduleIdsForPacks(selectedPacks),
      };
    });
  }

  function selectAllModulesForCurrentPacks() {
    setLimitMessage(null);

    setForm((current) => {
      if (current.enabledPacks.length === 0) {
        setLimitMessage("Selecciona al menos un pack antes de habilitar todos sus módulos.");
        return current;
      }

      return {
        ...current,
        enabledModules: moduleIdsForPacks(current.enabledPacks),
      };
    });
  }

  function clearPacksAndModules() {
    setLimitMessage(null);
    setForm((current) => ({
      ...current,
      enabledPacks: [],
      enabledModules: [],
    }));
  }

  function togglePack(packId: PackId, checked: boolean) {
    setLimitMessage(null);

      setForm((current) => {
        const enabledPackLimit = activePlan?.enabledPackLimit ?? null;
        const nextPacks = checked
          ? [...new Set([...current.enabledPacks, packId])]
          : current.enabledPacks.filter((item) => item !== packId);

      if (
        checked &&
        !isPlatformSuperadmin &&
        enabledPackLimit !== null &&
        nextPacks.length > enabledPackLimit
      ) {
        setLimitMessage(`El plan ${activePlan?.name ?? "actual"} permite hasta ${enabledPackLimit} packs activos.`);
        return current;
      }

      const nextModules = checked
        ? [
            ...new Set([
              ...current.enabledModules,
              ...(modulesByPack[packId] ?? []).filter((module) => module.defaultEnabled).map((module) => module.id),
            ]),
          ]
        : current.enabledModules.filter((moduleId) =>
            (modulesByPack[packId] ?? []).every((module) => module.id !== moduleId),
          );

      return {
        ...current,
        enabledPacks: nextPacks,
        enabledModules: nextModules,
      };
    });
  }

  function toggleModule(moduleId: ClinicalModuleId, checked: boolean) {
    setForm((current) => ({
      ...current,
      enabledModules: checked
        ? [...new Set([...current.enabledModules, moduleId])]
        : current.enabledModules.filter((item) => item !== moduleId),
    }));
  }

  async function handleSave() {
    if (!institution) {
      return;
    }

    await updateSettings.mutateAsync({
      tenantId: institution.tenantId,
      commercialName: form.commercialName,
      logoInitials: form.logoInitials,
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      language: form.language,
      timezone: form.timezone,
      unitSystem: form.unitSystem,
      defaultFollowUpDays: Number(form.defaultFollowUpDays),
      strictFormulaVersioning: form.strictFormulaVersioning,
      aiAssistEnabled: form.aiAssistEnabled,
      requirePlanApproval: form.requirePlanApproval,
      enabledPacks: form.enabledPacks,
      enabledModules: form.enabledModules,
      allowPackLimitOverride: isPlatformSuperadmin,
    });
  }

  if (!institution) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-[13px] text-muted-foreground">
          No hay configuración institucional visible para el tenant activo.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>Configuración del tenant</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Configuración institucional"
        subtitle="Branding, localización, guardrails, packs y módulos del tenant."
        actions={
          <Button
            size="sm"
            className="h-8 border-0 text-primary-foreground gradient-primary"
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        <div className="panel px-4 py-3 text-[12px] text-muted-foreground">{viewSourceDescription(viewSource)}</div>

        <div className="grid gap-3 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-md text-sm font-mono font-semibold text-primary-foreground"
                style={{ background: form.primaryColor }}
              >
                {form.logoInitials || "NT"}
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Tenant activo
                </div>
                <div className="text-[15px] font-medium">{activeTenant?.name ?? institution.name}</div>
                <div className="text-[12px] text-muted-foreground">
                  {activePlan ? `${activePlan.name} - ${form.enabledPacks.length} packs configurados` : institution.planId}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Field label="Nombre comercial">
                <Input
                  value={form.commercialName}
                  onChange={(event) => setForm({ ...form, commercialName: event.target.value })}
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Iniciales">
                  <Input
                    value={form.logoInitials}
                    onChange={(event) => setForm({ ...form, logoInitials: event.target.value.slice(0, 3).toUpperCase() })}
                  />
                </Field>
                <Field label="Color primario">
                  <Input
                    value={form.primaryColor}
                    onChange={(event) => setForm({ ...form, primaryColor: event.target.value })}
                  />
                </Field>
                <Field label="Color acento">
                  <Input
                    value={form.accentColor}
                    onChange={(event) => setForm({ ...form, accentColor: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          </div>

          <Tabs defaultValue="branding" className="space-y-3">
            <TabsList className="bg-surface-raised">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="locale">Localización</TabsTrigger>
              <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
              <TabsTrigger value="modules">Packs y módulos</TabsTrigger>
              <TabsTrigger value="protocols">Protocolos</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="mt-0">
              <ConfigPanel
                icon={Palette}
                title="Identidad institucional"
                subtitle="Marca visible por tenant y apariencia operativa."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Nombre legal visible">
                    <Input value={institution.name} disabled />
                  </Field>
                  <Field label="Plan contratado">
                    <Input value={activePlan?.name ?? institution.planId} disabled />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <ColorSwatch label="Primario" value={form.primaryColor} />
                  <ColorSwatch label="Acento" value={form.accentColor} />
                  <ColorSwatch label="Fondo" value="#0b0f14" />
                </div>
              </ConfigPanel>
            </TabsContent>

            <TabsContent value="locale" className="mt-0">
              <ConfigPanel
                icon={Globe2}
                title="Localización"
                subtitle="Idioma, zona horaria y sistema de unidades del tenant."
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Idioma">
                    <Input
                      value={form.language}
                      onChange={(event) =>
                        setForm({ ...form, language: event.target.value as SettingsFormState["language"] })
                      }
                    />
                  </Field>
                  <Field label="Zona horaria">
                    <Input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
                  </Field>
                  <Field label="Sistema de unidades">
                    <Input
                      value={form.unitSystem}
                      onChange={(event) =>
                        setForm({ ...form, unitSystem: event.target.value as SettingsFormState["unitSystem"] })
                      }
                    />
                  </Field>
                </div>

                <Field label="Seguimiento por defecto (días)">
                  <Input
                    type="number"
                    value={form.defaultFollowUpDays}
                    onChange={(event) => setForm({ ...form, defaultFollowUpDays: Number(event.target.value) })}
                  />
                </Field>
              </ConfigPanel>
            </TabsContent>

            <TabsContent value="guardrails" className="mt-0">
              <ConfigPanel
                icon={ShieldCheck}
                title="Guardrails clínicos"
                subtitle="Controles de seguridad documental y gobierno clínico."
              >
                <ToggleRow
                  label="Versionado estricto de fórmulas"
                  description="Cada cálculo derivado debe guardar formula_version_id."
                  checked={form.strictFormulaVersioning}
                  onCheckedChange={(checked) => setForm({ ...form, strictFormulaVersioning: checked })}
                />
                <ToggleRow
                  label="Aprobación profesional de planes"
                  description="Los planes quedan en borrador hasta que un rol autorizado los apruebe."
                  checked={form.requirePlanApproval}
                  onCheckedChange={(checked) => setForm({ ...form, requirePlanApproval: checked })}
                />
                <ToggleRow
                  label="IA asistida"
                  description="Resume casos y detecta datos faltantes con validación humana."
                  checked={form.aiAssistEnabled}
                  onCheckedChange={(checked) => setForm({ ...form, aiAssistEnabled: checked })}
                />
              </ConfigPanel>
            </TabsContent>

            <TabsContent value="modules" className="mt-0">
              <ConfigPanel
                icon={Workflow}
                title="Packs y módulos"
                subtitle="Controla qué verticales compra el tenant y qué módulos clínicos habilita dentro de cada una."
              >
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-raised/30 p-3">
                  <Button type="button" size="sm" variant="outline" onClick={selectAllPacksAndModules}>
                    {isPlatformSuperadmin ? "Seleccionar todos (admin)" : "Seleccionar todos"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={selectAllModulesForCurrentPacks}>
                    Todos los módulos de packs activos
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={clearPacksAndModules}>
                    Limpiar selección
                  </Button>
                  <div className="ml-auto text-[11px] text-muted-foreground">
                    {form.enabledPacks.length} de {availablePacks.length} packs · {form.enabledModules.length} de{" "}
                    {availableModules.length} módulos
                  </div>
                </div>

                {isPlatformSuperadmin && (
                  <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[12px] text-primary">
                    Modo desarrollo: como superadministrador puedes habilitar todos los packs aunque el plan comercial tenga límite.
                  </div>
                )}

                {limitMessage && (
                  <div className="rounded-md border border-risk-moderate/30 bg-risk-moderate/10 px-3 py-2 text-[12px] text-risk-moderate">
                    {limitMessage}
                  </div>
                )}

                <div className="grid gap-3 xl:grid-cols-2">
                  {availablePacks.map((pack) => {
                    const visualPack = PACKS[pack.id];
                    const isEnabled = enabledPackSet.has(pack.id);
                    const modules = modulesByPack[pack.id] ?? [];

                    return (
                      <div key={pack.id} className="rounded-lg border border-border bg-surface-raised/40 p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox checked={isEnabled} onCheckedChange={(checked) => togglePack(pack.id, checked === true)} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  background: visualPack ? `hsl(var(${visualPack.cssVar}))` : "hsl(var(--primary))",
                                }}
                              />
                              <div className="text-[14px] font-medium">{pack.name}</div>
                            </div>
                            <div className="mt-1 text-[12px] text-muted-foreground">{pack.description}</div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {modules.length === 0 && (
                            <div className="text-[12px] text-muted-foreground">
                              Este pack no tiene módulos clínicos configurados aún.
                            </div>
                          )}

                          {modules.map((module) => (
                            <div
                              key={module.id}
                              className={cn(
                                "flex items-start gap-3 rounded-md border px-3 py-2",
                                isEnabled ? "border-border bg-background/20" : "border-border/50 bg-background/10 opacity-60",
                              )}
                            >
                              <Checkbox
                                checked={form.enabledModules.includes(module.id)}
                                disabled={!isEnabled}
                                onCheckedChange={(checked) => toggleModule(module.id, checked === true)}
                              />
                              <div className="min-w-0">
                                <div className="text-[13px] font-medium">{module.name}</div>
                                <div className="text-[11px] text-muted-foreground">{module.description}</div>
                                <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                  {module.routeKey}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ConfigPanel>
            </TabsContent>

            <TabsContent value="protocols" className="mt-0">
              <ConfigPanel
                icon={BellRing}
                title="Protocolos y reglas"
                subtitle="Baselines operativos visibles mientras se completan las reglas remotas del tenant."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <ProtocolCard
                    title="Protocolos activos"
                    items={[
                      "NRS-2002 inicial en hospitalización",
                      "MNA-SF en geriatría",
                      "STAMP en pediatría",
                      "Checklist enteral diario",
                    ]}
                  />
                  <ProtocolCard
                    title="Alertas derivadas"
                    items={[
                      "Reevaluación vencida",
                      "Pérdida ponderal > 5%",
                      "Tolerancia enteral baja",
                      "Sesiones antropométricas fuera de TEM",
                    ]}
                  />
                </div>
              </ConfigPanel>
            </TabsContent>
          </Tabs>
        </div>

        {updateSettings.isSuccess && (
          <div className="panel p-4 text-[12px] text-risk-low">Configuración institucional actualizada correctamente.</div>
        )}

        {updateSettings.isError && (
          <div className="panel p-4 text-[12px] text-risk-high">
            {updateSettings.error instanceof Error ? updateSettings.error.message : "No se pudo guardar la configuración."}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigPanel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-[15px] font-medium">{title}</h3>
          <p className="text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-border bg-surface-raised/30 px-4 py-3">
      <div className="flex-1">
        <div className="text-[13px] font-medium">{label}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ColorSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/20 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-6 w-6 rounded-full border border-border" style={{ background: value }} />
        <span className="text-[12px] text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

function ProtocolCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised/30 p-4">
      <div className="text-[13px] font-medium">{title}</div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-md bg-background/20 px-3 py-2 text-[12px] text-muted-foreground">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
