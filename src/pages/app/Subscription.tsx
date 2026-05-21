import { Check, CreditCard, Gauge, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";

export default function Subscription() {
  const { activePlan, activeTenant, source, plans } = useTenantRuntime();

  if (!activeTenant) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-[13px] text-muted-foreground">Selecciona un tenant para revisar sus límites y suscripción.</div>
      </div>
    );
  }
  const usage = activeTenant?.usage ?? {
    users: 0,
    branches: 0,
    activePatients: 0,
    monthlyReports: 0,
    aiEvents: 0,
    storageGb: 0,
  };
  const limits = activeTenant?.limits ?? {
    users: null,
    branches: null,
    activePatients: null,
    monthlyReports: null,
    aiEvents: null,
    storageGb: null,
  };

  return (
    <div>
      <PageHeader
        meta={`Base de facturación · ${source}`}
        title="Suscripción y límites"
        subtitle="Estructura preparada para trial, upgrades, downgrades, límites por plan y billing real."
        actions={<Button size="sm" className="h-8 gradient-primary text-primary-foreground border-0">Preparar checkout</Button>}
      />

      <div className="p-6 space-y-6">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-3">
          <div className="panel p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Plan actual</div>
                <h2 className="text-2xl font-semibold mt-1">{activePlan?.name ?? activeTenant?.planId ?? "Plan activo"}</h2>
                <p className="text-[13px] text-muted-foreground mt-1">{activePlan?.marketPosition ?? "Plan sincronizado desde el tenant activo."}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Usage label="Usuarios" value={usage.users} limit={limits.users} />
              <Usage label="Sedes" value={usage.branches} limit={limits.branches} />
              <Usage label="Pacientes" value={usage.activePatients} limit={limits.activePatients} />
              <Usage label="Reportes" value={usage.monthlyReports} limit={limits.monthlyReports} />
              <Usage label="Eventos IA" value={usage.aiEvents} limit={limits.aiEvents} />
              <Usage label="Storage GB" value={usage.storageGb} limit={limits.storageGb} />
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-[15px] font-medium">Feature gates activos</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {(activePlan?.features ?? []).map((feature) => (
                <div key={feature} className="rounded-md bg-surface-raised/50 px-3 py-2 flex items-center gap-2 text-[12px]">
                  <Check className="w-3.5 h-3.5 text-risk-low" />
                  {feature}
                </div>
              ))}
              <div className="rounded-md bg-surface-raised/50 px-3 py-2 flex items-center gap-2 text-[12px]">
                <Check className="w-3.5 h-3.5 text-risk-low" />
                {activePlan?.aiEnabled ? "IA asistida habilitada" : "IA bloqueada por plan"}
              </div>
              <div className="rounded-md bg-surface-raised/50 px-3 py-2 flex items-center gap-2 text-[12px]">
                <Check className="w-3.5 h-3.5 text-risk-low" />
                {activePlan?.whiteLabelEnabled ? "White-label preparado" : "Branding básico"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {plans.map((plan) => {
            const current = plan.id === activePlan?.id;
            return (
              <div key={plan.id} className={`panel p-5 ${current ? "ring-1 ring-primary/50" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-medium">{plan.name}</h3>
                    <p className="text-[12px] text-muted-foreground mt-1 min-h-10">{plan.marketPosition}</p>
                  </div>
                  {current && <span className="rounded-full bg-primary/10 text-primary px-2 py-1 text-[10px] font-mono">ACTUAL</span>}
                </div>
                <div className="mt-5 text-2xl font-semibold">{plan.monthlyPriceUsd === null ? "Custom" : `$${plan.monthlyPriceUsd}`}</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">USD / mes</div>
                <div className="mt-5 space-y-2">
                  {plan.features.slice(0, 4).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Usage({ label, value, limit }: { label: string; value: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((value / limit) * 100)) : 72;
  return (
    <div className="rounded-md bg-surface-raised/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Gauge className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-[14px] font-semibold font-mono">{value.toLocaleString("es")} / {limit ?? "∞"}</div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden mt-2">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
