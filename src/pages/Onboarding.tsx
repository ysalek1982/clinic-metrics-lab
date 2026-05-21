import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Palette, Settings2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTenantBlueprint, useSpecialtyPackCatalog, useSubscriptionPlansCatalog } from "@/hooks/useSaasCatalogs";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { Tenant } from "@/types/saas";

const steps = [
  { icon: Building2, title: "Tenant e institucion", body: "Nombre comercial, tipo de institucion, region, idioma y zona horaria." },
  { icon: Stethoscope, title: "Packs clínicos", body: "Hospital, pediatría, gineco, enteral, parenteral, deporte y consulta privada." },
  { icon: Settings2, title: "Gobierno clínico", body: "Formulas activas, protocolos, aprobaciones, alertas y frecuencia de seguimiento." },
  { icon: Palette, title: "Branding", body: "Logo, colores, plantillas de reporte y experiencia white-label futura." },
];

const institutionTypes: Array<{ value: Tenant["institutionType"]; label: string }> = [
  { value: "general_hospital", label: "Hospital general" },
  { value: "pediatric_hospital", label: "Hospital pediátrico" },
  { value: "sports_center", label: "Centro deportivo" },
  { value: "private_clinic", label: "Clinica privada" },
  { value: "maternal_unit", label: "Unidad materna" },
  { value: "enterprise_health", label: "Salud ocupacional" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { isPlatformSuperadmin } = useAuthorization();
  const { data: planCatalog } = useSubscriptionPlansCatalog();
  const { data: packCatalog } = useSpecialtyPackCatalog();
  const createTenant = useCreateTenantBlueprint();
  const plans = useMemo(() => planCatalog.data ?? [], [planCatalog.data]);
  const packs = useMemo(() => packCatalog.data ?? [], [packCatalog.data]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    planId: "professional" as Tenant["planId"],
    institutionType: "general_hospital" as Tenant["institutionType"],
    region: "LatAm",
    language: "es" as Tenant["settings"]["language"],
    timezone: "America/La_Paz",
    unitSystem: "metric" as Tenant["settings"]["unitSystem"],
    primaryColor: "#13c8df",
    accentColor: "#a6e13a",
    logoInitials: "NS",
    organizationName: "",
    branchName: "Sede principal",
    departmentName: "Nutricion",
    serviceName: "Nutricion clinica",
  });
  const [selectedPacks, setSelectedPacks] = useState<Tenant["enabledPacks"]>(["clinical"]);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (slugTouched) return;
    const nextSlug = form.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    setForm((current) => ({ ...current, slug: nextSlug }));
  }, [form.name, slugTouched]);

  useEffect(() => {
    if (selectedPacks.length > 0 || packs.length === 0) return;
    setSelectedPacks([packs[0].id]);
  }, [packs, selectedPacks.length]);

  const canCreate = isAuthenticated && isPlatformSuperadmin;
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === form.planId) ?? null,
    [form.planId, plans],
  );

  async function handleCreateTenant() {
    if (!canCreate) return;
    if (!form.name.trim() || !form.slug.trim() || selectedPacks.length === 0) {
      toast({
        title: "Faltan datos obligatorios",
        description: "Completa nombre, slug y al menos un pack antes de crear el tenant.",
      });
      return;
    }

    try {
      const created = await createTenant.mutateAsync({
        name: form.name.trim(),
        slug: form.slug.trim(),
        planId: form.planId,
        institutionType: form.institutionType,
        region: form.region.trim() || "LatAm",
        language: form.language,
        timezone: form.timezone.trim() || "America/La_Paz",
        unitSystem: form.unitSystem,
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        logoInitials: form.logoInitials.trim() || "NS",
        enabledPacks: selectedPacks,
        organizationName: form.organizationName.trim() || form.name.trim(),
        branchName: form.branchName.trim() || "Sede principal",
        departmentName: form.departmentName.trim() || "Nutricion",
        serviceName: form.serviceName.trim() || "Nutricion clinica",
      });

      toast({
        title: "Tenant creado",
        description: `Se provisiono ${form.name.trim()} con el plan ${selectedPlan.name ?? form.planId}.`,
      });

      navigate("/app/tenants");
      return created;
    } catch (error) {
      toast({
        title: "No se pudo crear el tenant",
        description: error instanceof Error ? error.message : "Revisa el slug, el plan y tus permisos de plataforma.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-primary ring-glow">
            <span className="font-mono text-[11px] font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-[14px] font-semibold">Nutri</span>
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link to="/login">Ya tengo cuenta</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-3xl">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.16em] text-primary">Onboarding SaaS</div>
          <h1 className="font-serif text-5xl tracking-tight md:text-6xl">Provisiona una institucion en la plataforma.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            El alta de tenant ya esta conectada al control plane. La ejecucion real queda restringida a platform superadmin y crea tenant, suscripcion, branding, settings, estructura inicial y membership owner.
          </p>
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="panel p-5">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">0{index + 1}</span>
              </div>
              <h2 className="text-[15px] font-medium">{step.title}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="panel p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-medium">Estado del control plane</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {canCreate
                  ? "Tu sesión tiene permisos para crear tenants reales."
                  : isAuthenticated
                    ? "Tu sesión no tiene permiso de plataforma para crear tenants."
                    : "Necesitas autenticarte con un usuario platform superadmin para ejecutar el alta real."}
              </p>
            </div>
            <div className="space-y-3 text-[12px] text-muted-foreground">
              <StatusRow label="Sesión" value={isAuthenticated ? "Activa" : "No autenticada"} />
              <StatusRow label="Permiso plataforma" value={isPlatformSuperadmin ? "platform_superadmin" : "Sin permisos de alta"} />
              <StatusRow label="Planes" value={plans.length > 0 ? `${plans.length} disponibles` : "Sin catálogo"} />
              <StatusRow label="Packs" value={packs.length > 0 ? `${packs.length} disponibles` : "Sin catálogo"} />
            </div>

            <div className="mt-6 rounded-lg border border-border bg-surface-raised/40 p-4">
              <div className="text-[13px] font-medium">Provisionamiento automatico</div>
              <div className="mt-3 grid gap-2 text-[11px] text-muted-foreground">
                {[
    "Tenant, suscripción y límites por plan",
                  "Branding, locale y settings iniciales",
                  "Organizacion, sede, departamento y servicio base",
                  "Membership owner para el actor que crea el tenant",
                ].map((item) => (
                  <div key={item} className="rounded-md bg-background px-3 py-2">{item}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-medium">Crear tenant real</h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Provisiona la estructura inicial y deja el tenant listo para operar.</p>
              </div>
              <Button onClick={handleCreateTenant} disabled={!canCreate || createTenant.isPending}>
                {createTenant.isPending ? "Creando..." : "Crear tenant"}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre comercial">
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label="Slug">
                <Input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }));
                  }}
                />
              </Field>
              <Field label="Plan SaaS">
                <Select value={form.planId} onValueChange={(value) => setForm((current) => ({ ...current, planId: value as Tenant["planId"] }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tipo de institucion">
                <Select value={form.institutionType} onValueChange={(value) => setForm((current) => ({ ...current, institutionType: value as Tenant["institutionType"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {institutionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Region">
                <Input value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} />
              </Field>
              <Field label="Zona horaria">
                <Input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} />
              </Field>
              <Field label="Idioma">
                <Select value={form.language} onValueChange={(value) => setForm((current) => ({ ...current, language: value as Tenant["settings"]["language"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Espanol</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Portugues</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Unidades">
                <Select value={form.unitSystem} onValueChange={(value) => setForm((current) => ({ ...current, unitSystem: value as Tenant["settings"]["unitSystem"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metricas</SelectItem>
                    <SelectItem value="imperial">Imperiales</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Iniciales logo">
                <Input value={form.logoInitials} onChange={(event) => setForm((current) => ({ ...current, logoInitials: event.target.value.toUpperCase().slice(0, 4) }))} />
              </Field>
              <Field label="Color primario">
                <Input value={form.primaryColor} onChange={(event) => setForm((current) => ({ ...current, primaryColor: event.target.value }))} />
              </Field>
              <Field label="Color acento">
                <Input value={form.accentColor} onChange={(event) => setForm((current) => ({ ...current, accentColor: event.target.value }))} />
              </Field>
              <Field label="Organizacion inicial">
                <Input value={form.organizationName} onChange={(event) => setForm((current) => ({ ...current, organizationName: event.target.value }))} />
              </Field>
              <Field label="Sede inicial">
                <Input value={form.branchName} onChange={(event) => setForm((current) => ({ ...current, branchName: event.target.value }))} />
              </Field>
              <Field label="Departamento inicial">
                <Input value={form.departmentName} onChange={(event) => setForm((current) => ({ ...current, departmentName: event.target.value }))} />
              </Field>
              <Field label="Servicio inicial">
                <Input value={form.serviceName} onChange={(event) => setForm((current) => ({ ...current, serviceName: event.target.value }))} />
              </Field>
            </div>

            <div className="mt-6">
              <div className="mb-2 text-[12px] font-medium">Packs habilitados</div>
              <div className="grid gap-2 md:grid-cols-2">
                {packs.map((pack) => {
                  const checked = selectedPacks.includes(pack.id);
                  return (
                    <label key={pack.id} className="flex items-start gap-3 rounded-md border border-border bg-surface-raised/30 px-3 py-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) => {
                          setSelectedPacks((current) => {
                            if (nextChecked) {
                              return current.includes(pack.id) ? current : [...current, pack.id];
                            }
                            return current.filter((item) => item !== pack.id);
                          });
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium">{pack.name}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">{pack.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedPlan && (
              <div className="mt-6 rounded-lg border border-border bg-surface-raised/40 p-4">
                <div className="text-[13px] font-medium">Resumen del plan</div>
                <div className="mt-3 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                  <div className="rounded-md bg-background px-3 py-2">Usuarios incluidos: {selectedPlan.includedUsers ?? "Ilimitados"}</div>
                  <div className="rounded-md bg-background px-3 py-2">Pacientes activos: {selectedPlan.activePatientLimit ?? "Ilimitados"}</div>
                  <div className="rounded-md bg-background px-3 py-2">Sedes: {selectedPlan.branchLimit ?? "Ilimitadas"}</div>
                  <div className="rounded-md bg-background px-3 py-2">IA asistida: {selectedPlan.aiEnabled ? "Habilitada" : "No incluida"}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button asChild className="border-0 text-primary-foreground gradient-primary">
            <Link to="/app/tenants">Ir al selector <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/platform">Ver dashboard SaaS</Link>
          </Button>
        </div>
      </main>
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

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-surface-raised/40 px-3 py-2">
      <span>{label}</span>
      <span className="font-mono text-[11px] text-primary">{value}</span>
    </div>
  );
}
