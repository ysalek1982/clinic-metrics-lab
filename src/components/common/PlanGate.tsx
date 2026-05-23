import type { ReactNode } from "react";
import { ModuleState } from "@/components/common/ModuleState";
import { explainBlockedFeature, hasPlanFeature, type SubscriptionSnapshot } from "@/lib/subscriptionAccess";

type PlanGateProps = {
  subscription?: SubscriptionSnapshot | null;
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
};

export function PlanGate({ subscription, featureKey, children, fallback, title }: PlanGateProps) {
  if (hasPlanFeature(subscription, featureKey)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <ModuleState
      tone="warning"
      title={title ?? "Funcion bloqueada por plan"}
      description={explainBlockedFeature(subscription, featureKey)}
    />
  );
}
