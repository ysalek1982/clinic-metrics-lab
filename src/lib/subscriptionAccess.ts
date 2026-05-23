export const SAAS_PLAN_CODES = [
  "free",
  "courtesy",
  "pro",
  "clinic_hospital",
] as const;

export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "courtesy",
  "past_due",
  "cancelled",
  "expired",
] as const;

export type SaasPlanCode = (typeof SAAS_PLAN_CODES)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type PlanEntitlement = {
  featureKey: string;
  enabled: boolean;
  limitValue?: number | null;
};

export type SubscriptionSnapshot = {
  planCode?: string | null;
  status?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  courtesyEndsAt?: string | null;
  entitlements?: PlanEntitlement[];
};

export type PlanStatus = {
  planCode: string;
  status: SubscriptionStatus | "missing";
  active: boolean;
  expired: boolean;
  badgeLabel: string;
  explanation: string;
};

export const DEFAULT_PLAN_ENTITLEMENTS: Record<string, PlanEntitlement[]> = {
  free: [
    { featureKey: "dashboard.read", enabled: true },
    { featureKey: "patients.read", enabled: true, limitValue: 25 },
    { featureKey: "patients.manage", enabled: true, limitValue: 25 },
    { featureKey: "anthropometry.basic", enabled: true },
    { featureKey: "agenda.read", enabled: true, limitValue: 25 },
    { featureKey: "agenda.manage", enabled: true, limitValue: 25 },
    { featureKey: "reports.read", enabled: true, limitValue: 5 },
    { featureKey: "reports.generate", enabled: false, limitValue: 0 },
    { featureKey: "copilot.read", enabled: false, limitValue: 0 },
    { featureKey: "settings.manage", enabled: false, limitValue: 0 },
    { featureKey: "saas.manage", enabled: false, limitValue: 0 },
    { featureKey: "users.manage", enabled: false, limitValue: 0 },
    { featureKey: "audit.read", enabled: false, limitValue: 0 },
    { featureKey: "enteral.read", enabled: false, limitValue: 0 },
    { featureKey: "parenteral.read", enabled: false, limitValue: 0 },
    { featureKey: "pediatric.read", enabled: true },
  ],
  courtesy: [
    { featureKey: "dashboard.read", enabled: true },
    { featureKey: "patients.manage", enabled: true, limitValue: 250 },
    { featureKey: "labs.read", enabled: true },
    { featureKey: "reports.generate", enabled: true, limitValue: 25 },
    { featureKey: "copilot.read", enabled: true, limitValue: 100 },
    { featureKey: "nutrition.operational", enabled: true },
    { featureKey: "enteral.read", enabled: true },
    { featureKey: "parenteral.read", enabled: true },
    { featureKey: "sports.read", enabled: true },
    { featureKey: "pediatric.read", enabled: true },
    { featureKey: "settings.manage", enabled: false, limitValue: 0 },
    { featureKey: "saas.manage", enabled: false, limitValue: 0 },
  ],
  pro: [
    { featureKey: "dashboard.read", enabled: true },
    { featureKey: "patients.read", enabled: true, limitValue: 500 },
    { featureKey: "patients.manage", enabled: true, limitValue: 500 },
    { featureKey: "labs.read", enabled: true },
    { featureKey: "labs.manage", enabled: true },
    { featureKey: "reports.read", enabled: true, limitValue: 100 },
    { featureKey: "reports.generate", enabled: true, limitValue: 100 },
    { featureKey: "copilot.read", enabled: true, limitValue: 300 },
    { featureKey: "agenda.manage", enabled: true, limitValue: 150 },
    { featureKey: "nutrition.operational", enabled: true },
    { featureKey: "sports.read", enabled: true },
    { featureKey: "pediatric.read", enabled: true },
    { featureKey: "enteral.read", enabled: true },
    { featureKey: "parenteral.read", enabled: false, limitValue: 0 },
    { featureKey: "settings.manage", enabled: false, limitValue: 0 },
    { featureKey: "saas.manage", enabled: false, limitValue: 0 },
    { featureKey: "users.manage", enabled: false, limitValue: 0 },
    { featureKey: "audit.read", enabled: false, limitValue: 0 },
  ],
  clinic_hospital: [
    { featureKey: "dashboard.read", enabled: true },
    { featureKey: "patients.read", enabled: true, limitValue: 5000 },
    { featureKey: "patients.manage", enabled: true, limitValue: 5000 },
    { featureKey: "labs.manage", enabled: true },
    { featureKey: "reports.generate", enabled: true, limitValue: 500 },
    { featureKey: "copilot.read", enabled: true, limitValue: 2000 },
    { featureKey: "nutrition.operational", enabled: true },
    { featureKey: "enteral.manage", enabled: true },
    { featureKey: "parenteral.manage", enabled: true },
    { featureKey: "sports.read", enabled: true },
    { featureKey: "pediatric.read", enabled: true },
    { featureKey: "settings.manage", enabled: true },
    { featureKey: "saas.manage", enabled: false, limitValue: 0 },
    { featureKey: "users.manage", enabled: true, limitValue: 25 },
    { featureKey: "audit.read", enabled: true },
  ],
};

export function getPlanStatus(subscription?: SubscriptionSnapshot | null, now = new Date()): PlanStatus {
  if (!subscription) {
    return {
      planCode: "free",
      status: "missing",
      active: false,
      expired: true,
      badgeLabel: "Sin plan",
      explanation: "No hay suscripcion activa registrada para este tenant.",
    };
  }

  const planCode = normalizePlanCode(subscription.planCode);
  const status = normalizeSubscriptionStatus(subscription.status);
  const expired = isSubscriptionExpired(subscription, now);
  const active = !expired && ["active", "trialing", "courtesy"].includes(status);

  return {
    planCode,
    status,
    active,
    expired,
    badgeLabel: getSubscriptionBadge(subscription, now),
    explanation: active
      ? "La suscripcion esta activa para las funciones incluidas en el plan."
      : explainInactiveSubscription(subscription, now),
  };
}

export function hasPlanFeature(
  subscription: SubscriptionSnapshot | null | undefined,
  featureKey: string,
  now = new Date(),
) {
  const status = getPlanStatus(subscription, now);
  if (!status.active) return false;

  const entitlements = getEntitlements(subscription);
  const exact = entitlements.find((item) => item.featureKey === featureKey);
  if (exact) return exact.enabled;

  if (entitlements.some((item) => item.featureKey === "*" && item.enabled)) return true;

  const prefix = featureKey.split(".")[0];
  return entitlements.some((item) => item.enabled && item.featureKey === `${prefix}.*`);
}

export function getPlanLimit(
  subscription: SubscriptionSnapshot | null | undefined,
  featureKey: string,
): number | null {
  const entitlements = getEntitlements(subscription);
  const exact = entitlements.find((item) => item.featureKey === featureKey);
  if (exact && typeof exact.limitValue === "number") return exact.limitValue;
  return null;
}

export function isPlanActive(subscription: SubscriptionSnapshot | null | undefined, now = new Date()) {
  return getPlanStatus(subscription, now).active;
}

export function isCourtesyActive(subscription: SubscriptionSnapshot | null | undefined, now = new Date()) {
  if (!subscription) return false;
  const status = normalizeSubscriptionStatus(subscription.status);
  return normalizePlanCode(subscription.planCode) === "courtesy" && status === "courtesy" && !isSubscriptionExpired(subscription, now);
}

export function isTrialActive(subscription: SubscriptionSnapshot | null | undefined, now = new Date()) {
  if (!subscription) return false;
  const status = normalizeSubscriptionStatus(subscription.status);
  return status === "trialing" && !isSubscriptionExpired(subscription, now);
}

export function isSubscriptionExpired(subscription: SubscriptionSnapshot | null | undefined, now = new Date()) {
  if (!subscription) return true;
  const status = normalizeSubscriptionStatus(subscription.status);
  if (status === "expired" || status === "cancelled") return true;
  const endDate = pickRelevantEndDate(subscription);
  return Boolean(endDate && endDate.getTime() <= now.getTime());
}

export function getSubscriptionBadge(subscription: SubscriptionSnapshot | null | undefined, now = new Date()) {
  if (!subscription) return "Sin plan";
  const planCode = normalizePlanCode(subscription.planCode);
  const status = normalizeSubscriptionStatus(subscription.status);
  if (isSubscriptionExpired(subscription, now)) {
    return planCode === "courtesy" ? "Cortesia vencida" : status === "trialing" ? "Prueba vencida" : "Plan vencido";
  }
  if (status === "courtesy") return "Cortesia activa";
  if (status === "trialing") return "Prueba activa";
  if (status === "past_due") return "Pago pendiente";
  if (planCode === "free") return "Free";
  if (planCode === "pro") return "Pro";
  if (planCode === "clinic_hospital") return "Clinic/Hospital";
  return `Plan ${planCode}`;
}

export function explainBlockedFeature(
  subscription: SubscriptionSnapshot | null | undefined,
  featureKey: string,
  now = new Date(),
) {
  if (!subscription) return "Esta funcion requiere una suscripcion o aprobacion inicial.";
  if (isSubscriptionExpired(subscription, now)) {
    const planCode = normalizePlanCode(subscription.planCode);
    if (planCode === "courtesy") return "La cortesia vencio. El acceso premium queda bloqueado y se mantiene el nivel basico.";
    if (normalizeSubscriptionStatus(subscription.status) === "trialing") return "La prueba vencio. El acceso premium queda bloqueado y se mantiene el nivel basico.";
    return "La suscripcion no esta activa.";
  }
  if (!hasPlanFeature(subscription, featureKey, now)) {
    return `La funcion ${featureKey} no esta incluida en el plan ${normalizePlanCode(subscription.planCode)}.`;
  }
  return "La funcion esta disponible.";
}

export function normalizePlanCode(value?: string | null) {
  if (!value) return "free";
  if (value === "starter") return "free";
  if (value === "professional" || value === "clinic" || value === "sports_performance" || value === "paid" || value === "trial") return "pro";
  if (value === "hospital" || value === "enterprise" || value === "hospital_enterprise" || value === "custom") return "clinic_hospital";
  return value;
}

export function normalizeSubscriptionStatus(value?: string | null): SubscriptionStatus {
  if (value === "trial") return "trialing";
  if (SUBSCRIPTION_STATUSES.includes(value as SubscriptionStatus)) return value as SubscriptionStatus;
  return "active";
}

function getEntitlements(subscription: SubscriptionSnapshot | null | undefined) {
  const planCode = normalizePlanCode(subscription?.planCode);
  const fromSubscription = subscription?.entitlements ?? [];
  return fromSubscription.length > 0 ? fromSubscription : DEFAULT_PLAN_ENTITLEMENTS[planCode] ?? DEFAULT_PLAN_ENTITLEMENTS.free;
}

function pickRelevantEndDate(subscription: SubscriptionSnapshot) {
  const status = normalizeSubscriptionStatus(subscription.status);
  const raw =
    status === "courtesy"
      ? subscription.courtesyEndsAt ?? subscription.endsAt
      : status === "trialing"
        ? subscription.trialEndsAt ?? subscription.endsAt
        : subscription.endsAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function explainInactiveSubscription(subscription: SubscriptionSnapshot, now: Date) {
  if (isSubscriptionExpired(subscription, now)) {
    const planCode = normalizePlanCode(subscription.planCode);
    if (planCode === "courtesy") return "La cortesia esta vencida. Solo debe quedar disponible el acceso basico.";
    if (planCode === "trial") return "La prueba esta vencida. Solo debe quedar disponible el acceso basico.";
  }
  return "La suscripcion no esta activa para funciones premium.";
}
