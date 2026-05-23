import { describe, expect, it } from "vitest";
import {
  explainBlockedFeature,
  getPlanLimit,
  getPlanStatus,
  getSubscriptionBadge,
  hasPlanFeature,
  isCourtesyActive,
  isPlanActive,
  isSubscriptionExpired,
  isTrialActive,
  type SubscriptionSnapshot,
} from "./subscriptionAccess";

const now = new Date("2026-05-21T12:00:00Z");

describe("subscriptionAccess", () => {
  it("detecta plan free activo y limita features premium", () => {
    const subscription: SubscriptionSnapshot = { planCode: "free", status: "active" };

    expect(isPlanActive(subscription, now)).toBe(true);
    expect(hasPlanFeature(subscription, "dashboard.read", now)).toBe(true);
    expect(hasPlanFeature(subscription, "reports.generate", now)).toBe(false);
    expect(hasPlanFeature(subscription, "settings.manage", now)).toBe(false);
    expect(getPlanLimit(subscription, "patients.read")).toBe(25);
  });

  it("separa administracion personal e institucional por plan", () => {
    expect(hasPlanFeature({ planCode: "free", status: "active" }, "settings.manage", now)).toBe(false);
    expect(hasPlanFeature({ planCode: "pro", status: "active" }, "settings.manage", now)).toBe(false);
    expect(hasPlanFeature({ planCode: "clinic_hospital", status: "active" }, "settings.manage", now)).toBe(true);
    expect(hasPlanFeature({ planCode: "clinic_hospital", status: "active" }, "saas.manage", now)).toBe(false);
  });

  it("prioriza entitlements cargados desde tenant_subscriptions sobre defaults locales", () => {
    const subscription: SubscriptionSnapshot = {
      planCode: "clinic_hospital",
      status: "active",
      entitlements: [
        { featureKey: "settings.manage", enabled: false },
        { featureKey: "patients.manage", enabled: true, limitValue: 10 },
      ],
    };

    expect(hasPlanFeature(subscription, "settings.manage", now)).toBe(false);
    expect(hasPlanFeature(subscription, "patients.manage", now)).toBe(true);
    expect(getPlanLimit(subscription, "patients.manage")).toBe(10);
  });

  it("detecta cortesia activa y vencida", () => {
    const active: SubscriptionSnapshot = {
      planCode: "courtesy",
      status: "courtesy",
      courtesyEndsAt: "2026-05-22T12:00:00Z",
    };
    const expired: SubscriptionSnapshot = {
      planCode: "courtesy",
      status: "courtesy",
      courtesyEndsAt: "2026-05-20T12:00:00Z",
    };

    expect(isCourtesyActive(active, now)).toBe(true);
    expect(isCourtesyActive(expired, now)).toBe(false);
    expect(getSubscriptionBadge(expired, now)).toBe("Cortesia vencida");
  });

  it("detecta trial activo y subscription vencida", () => {
    const trial: SubscriptionSnapshot = {
      planCode: "trial",
      status: "trialing",
      trialEndsAt: "2026-05-25T00:00:00Z",
    };
    const expired: SubscriptionSnapshot = {
      planCode: "trial",
      status: "trialing",
      trialEndsAt: "2026-05-01T00:00:00Z",
    };

    expect(isTrialActive(trial, now)).toBe(true);
    expect(isSubscriptionExpired(expired, now)).toBe(true);
  });

  it("explica feature bloqueada y fallback sin suscripcion", () => {
    expect(getPlanStatus(null, now).status).toBe("missing");
    expect(explainBlockedFeature(null, "copilot.read", now)).toContain("requiere");
    expect(explainBlockedFeature({ planCode: "free", status: "active" }, "copilot.read", now)).toContain("no esta incluida");
  });

  it("normaliza planes legacy hacia Pro o Clinic/Hospital", () => {
    const subscription: SubscriptionSnapshot = { planCode: "enterprise", status: "active" };
    expect(hasPlanFeature(subscription, "enteral.manage", now)).toBe(true);
    expect(hasPlanFeature(subscription, "saas.manage", now)).toBe(false);
    expect(getSubscriptionBadge({ planCode: "professional", status: "active" }, now)).toBe("Pro");
    expect(getSubscriptionBadge({ planCode: "hospital", status: "active" }, now)).toBe("Clinic/Hospital");
  });
});
