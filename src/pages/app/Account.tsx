import { useState } from "react";
import { CreditCard, Gauge, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { ActionDialog } from "@/components/common/ActionDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PlanLimitNotice } from "@/components/common/PlanLimitNotice";
import { SubscriptionBadge } from "@/components/common/SubscriptionBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { usePlanEntitlements, useTenantSubscription } from "@/hooks/useSubscription";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { getPlanLimit, normalizePlanCode } from "@/lib/subscriptionAccess";
import { submitAccessRequest } from "@/services/saasAdminService";

type RequestKind = "upgrade" | "courtesy";

export default function Account() {
  const { user } = useAuth();
  const { activeTenant, plans, source } = useTenantRuntime();
  const tenantSubscription = useTenantSubscription(activeTenant?.id);
  const planEntitlements = usePlanEntitlements();
  const [requestKind, setRequestKind] = useState<RequestKind | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!activeTenant) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-[13px] text-muted-foreground">
          Selecciona un espacio para revisar tu cuenta.
        </div>
      </div>
    );
  }

  const planCode = normalizePlanCode(tenantSubscription.data?.planCode ?? "free");
  const subscription = {
    planCode,
    status: tenantSubscription.data?.status ?? (tenantSubscription.data ? "active" : "missing"),
    startsAt: tenantSubscription.data?.startsAt,
    endsAt: tenantSubscription.data?.endsAt,
    trialEndsAt: tenantSubscription.data?.trialEndsAt,
    courtesyEndsAt: tenantSubscription.data?.courtesyEndsAt,
    entitlements: (planEntitlements.data ?? [])
      .filter((item) => normalizePlanCode(item.planCode) === planCode)
      .map(({ featureKey, enabled, limitValue }) => ({ featureKey, enabled, limitValue })),
  };
  const activePlan = plans.find((plan) => normalizePlanCode(plan.id) === planCode) ?? null;
  const patientLimit = getPlanLimit(subscription, "patients.manage") ?? activeTenant.limits.activePatients;
  const reportLimit = getPlanLimit(subscription, "reports.read") ?? activeTenant.limits.monthlyReports;
  const isPersonal = planCode === "free" || planCode === "pro";

  async function submitRequest() {
    if (!requestKind) return;
    setSubmitting(true);
    setRequestError(null);
    setRequestSuccess(null);
    try {
      const label = requestKind === "upgrade" ? "upgrade de plan" : "cortesia temporal";
      await submitAccessRequest({
        fullName: user?.name ?? "Usuario Nutri",
        jobTitle: user?.title ?? "Cuenta SaaS",
        requestedTenantId: activeTenant.id,
        message:
          requestMessage.trim() ||
          `Solicitud de ${label} para el espacio ${activeTenant.name}. Plan actual: ${planCode}.`,
      });
      setRequestSuccess("Solicitud enviada. ysalek/platform admin la revisara desde SaaS Admin.");
      setRequestMessage("");
      setRequestKind(null);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        meta={`Cuenta SaaS - ${source}`}
        title={isPersonal ? "Mi cuenta" : "Cuenta institucional"}
        subtitle={
          isPersonal
            ? "Tu espacio personal de Nutri. Puedes cargar datos propios dentro de los limites de tu plan."
            : "Resumen del tenant activo, plan comercial y limites institucionales."
        }
        actions={<SubscriptionBadge subscription={subscription} />}
      />

      <main className="space-y-6 p-6">
        {requestSuccess && (
          <PlanLimitNotice title="Solicitud registrada" description={requestSuccess} tone="info" />
        )}

        <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="panel p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {isPersonal ? "Mi espacio" : "Tenant activo"}
                </div>
                <h2 className="mt-1 text-2xl font-semibold">{activeTenant.name}</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {isPersonal
                    ? "Espacio personal tenant-scoped: tus datos quedan aislados por RLS y no administras otros usuarios."
                    : "Espacio institucional con administracion habilitada solo si el plan y rol lo permiten."}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Usage label="Pacientes" value={activeTenant.usage.activePatients} limit={patientLimit} />
              <Usage label="Packs" value={activeTenant.usage.enabledPacks} limit={activeTenant.limits.enabledPacks} />
              <Usage label="Reportes" value={activeTenant.usage.monthlyReports} limit={reportLimit} />
              <Usage label="Storage GB" value={activeTenant.usage.storageGb} limit={activeTenant.limits.storageGb} />
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="text-[15px] font-medium">Mi plan</h3>
            </div>
            <div className="mt-4 rounded-lg border border-border bg-surface-raised/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Plan actual</div>
                  <div className="mt-1 text-xl font-semibold">{activePlan?.name ?? planCode}</div>
                  <div className="mt-1 text-[12px] text-muted-foreground">
                    {activePlan?.marketPosition ?? "Plan sincronizado desde el tenant activo."}
                  </div>
                </div>
                <SubscriptionBadge subscription={subscription} />
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Capability
                title="Administracion de plataforma"
                enabled={false}
                description="Solo ysalek/platform admin puede administrar usuarios, planes y suscripciones SaaS."
              />
              <Capability
                title="Administracion institucional"
                enabled={planCode === "clinic_hospital"}
                description="Disponible para Clinic/Hospital con rol de tenant adecuado."
              />
              <Capability
                title="Pagos en linea"
                enabled={false}
                description="Billing real pendiente. No se ejecutan cobros ni se guardan tarjetas."
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setRequestKind("upgrade")}>
                Solicitar upgrade
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRequestKind("courtesy")}>
                Solicitar cortesia
              </Button>
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-[15px] font-medium">Modelo comercial aplicado</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <PlanCard title="Free" active={planCode === "free"} text="Cuenta personal basica con espacio propio y limites bajos." />
            <PlanCard title="Pro" active={planCode === "pro"} text="Profesional individual con modulos funcionales premium, sin SaaS Admin." />
            <PlanCard title="Clinic/Hospital" active={planCode === "clinic_hospital"} text="Institucional, multiusuario, roles, organizacion y auditoria." />
          </div>
        </section>
      </main>

      <ActionDialog
        open={Boolean(requestKind)}
        onOpenChange={(open) => {
          if (!open) {
            setRequestKind(null);
            setRequestError(null);
          }
        }}
        title={requestKind === "courtesy" ? "Solicitar cortesia temporal" : "Solicitar upgrade"}
        description="La solicitud no cambia tu plan automaticamente. Un platform admin debe aprobarla."
        loading={submitting}
        error={requestError}
        submitLabel="Enviar solicitud"
        onSubmit={submitRequest}
      >
        <div className="space-y-2">
          <Label htmlFor="upgradeMessage">Mensaje opcional</Label>
          <Textarea
            id="upgradeMessage"
            rows={4}
            value={requestMessage}
            onChange={(event) => setRequestMessage(event.target.value)}
            placeholder="Describe que plan o cortesia necesitas y para que flujo operativo."
          />
        </div>
      </ActionDialog>
    </div>
  );
}

function Usage({ label, value, limit }: { label: string; value: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((value / limit) * 100)) : 0;
  return (
    <div className="rounded-md bg-surface-raised/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="font-mono text-[14px] font-semibold">
        {value.toLocaleString("es")} / {limit ?? "sin limite"}
      </div>
      {limit != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function Capability({ title, enabled, description }: { title: string; enabled: boolean; description: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-surface-raised/40 p-3">
      <LockKeyhole className={enabled ? "mt-0.5 h-4 w-4 text-risk-low" : "mt-0.5 h-4 w-4 text-muted-foreground"} />
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        <div className="mt-1 text-[12px] text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

function PlanCard({ title, active, text }: { title: string; active: boolean; text: string }) {
  return (
    <div className={`rounded-lg border p-4 ${active ? "border-primary/45 bg-primary/10" : "border-border bg-surface-raised/40"}`}>
      <div className="text-[13px] font-medium">{title}</div>
      <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{text}</p>
      {active && <div className="mt-3 text-[10px] font-mono uppercase text-primary">Plan activo</div>}
    </div>
  );
}
