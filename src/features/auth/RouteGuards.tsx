import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthorization } from "@/hooks/useAuthorization";
import { usePlanEntitlements, useTenantSubscription } from "@/hooks/useSubscription";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { explainBlockedFeature, hasPlanFeature, normalizePlanCode, type SubscriptionSnapshot } from "@/lib/subscriptionAccess";
import { useAuth } from "./auth-context";

function GuardLoadingState() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowFallback(true), 3500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-lg border border-border bg-surface-raised/40 p-6 text-center">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Contexto seguro
        </div>
        <h2 className="mt-2 text-lg font-semibold">
          {showFallback ? "Resolviendo sesión y tenant" : "Cargando contexto seguro..."}
        </h2>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {showFallback
            ? "La autenticación tardó más de lo normal. Si no avanza, vuelve a iniciar sesión."
            : "Estamos validando sesión, memberships y permisos del tenant activo."}
        </p>
      </div>
    </div>
  );
}

export function RequireTenantAccess() {
  const location = useLocation();
  const { loading, isAuthenticated, activationRequired, activeTenantId } = useAuth();

  if (loading) {
    return <GuardLoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (activationRequired) {
    return <Navigate to="/activate" replace state={{ from: location.pathname }} />;
  }

  if (!activeTenantId) {
    return <Navigate to="/app/tenants" replace />;
  }

  return <Outlet />;
}

export function RequireAuthenticatedAccess() {
  const location = useLocation();
  const { loading, isAuthenticated, activationRequired } = useAuth();

  if (loading) {
    return <GuardLoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (activationRequired) {
    return <Navigate to="/activate" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequireTenantPermission({ permission, planFeature }: { permission: string; planFeature?: string }) {
  const location = useLocation();
  const { loading, isAuthenticated, activationRequired, activeTenantId } = useAuth();
  const { hasPermission, isPlatformSuperadmin } = useAuthorization();
  const { activeTenant, isLoading: tenantLoading } = useTenantRuntime();
  const { subscription, isLoading: subscriptionLoading } = useActiveSubscriptionSnapshot(activeTenant, Boolean(planFeature));

  if (loading || tenantLoading || subscriptionLoading) {
    return <GuardLoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (activationRequired) {
    return <Navigate to="/activate" replace state={{ from: location.pathname }} />;
  }

  if (!activeTenantId) {
    return <Navigate to="/app/tenants" replace />;
  }

  if (!isPlatformSuperadmin && !hasPermission(permission)) {
    return <ForbiddenState />;
  }

  if (planFeature && !isPlatformSuperadmin) {
    if (!hasPlanFeature(subscription, planFeature)) {
      return <PlanBlockedState featureKey={planFeature} subscription={subscription} />;
    }
  }

  return <Outlet />;
}

export function RequirePlanFeature({ featureKey }: { featureKey: string }) {
  const location = useLocation();
  const { loading, isAuthenticated, activationRequired, activeTenantId } = useAuth();
  const { isPlatformSuperadmin } = useAuthorization();
  const { activeTenant, isLoading: tenantLoading } = useTenantRuntime();
  const { subscription, isLoading: subscriptionLoading } = useActiveSubscriptionSnapshot(activeTenant, true);

  if (loading || tenantLoading || subscriptionLoading) {
    return <GuardLoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (activationRequired) {
    return <Navigate to="/activate" replace state={{ from: location.pathname }} />;
  }

  if (!activeTenantId) {
    return <Navigate to="/app/tenants" replace />;
  }

  if (!isPlatformSuperadmin) {
    if (!hasPlanFeature(subscription, featureKey)) {
      return <PlanBlockedState featureKey={featureKey} subscription={subscription} />;
    }
  }

  return <Outlet />;
}

export function RequirePlatformAdmin() {
  const location = useLocation();
  const { loading, isAuthenticated } = useAuth();
  const { isPlatformSuperadmin } = useAuthorization();

  if (loading) {
    return <GuardLoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isPlatformSuperadmin) {
    return <Navigate to="/app" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function ForbiddenState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-lg border border-border bg-surface-raised/40 p-6 text-center">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Permisos</div>
        <h2 className="mt-2 text-lg font-semibold">No tienes acceso a esta vista</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">
          El rol activo del tenant no habilita esta operación. Solicita acceso institucional o cambia de tenant.
        </p>
      </div>
    </div>
  );
}

function useActiveSubscriptionSnapshot(
  activeTenant: ReturnType<typeof useTenantRuntime>["activeTenant"],
  includeEntitlements: boolean,
): { subscription: SubscriptionSnapshot; isLoading: boolean } {
  const tenantSubscription = useTenantSubscription(activeTenant?.id);
  const planEntitlements = usePlanEntitlements();
  const planCode = normalizePlanCode(tenantSubscription.data?.planCode ?? "free");

  return {
    subscription: {
      planCode,
      status: tenantSubscription.data?.status ?? (tenantSubscription.data ? "active" : "missing"),
      startsAt: tenantSubscription.data?.startsAt,
      endsAt: tenantSubscription.data?.endsAt,
      trialEndsAt: tenantSubscription.data?.trialEndsAt,
      courtesyEndsAt: tenantSubscription.data?.courtesyEndsAt,
      entitlements: (planEntitlements.data ?? [])
        .filter((item) => normalizePlanCode(item.planCode) === planCode)
        .map(({ featureKey, enabled, limitValue }) => ({ featureKey, enabled, limitValue })),
    },
    isLoading: Boolean(activeTenant?.id && tenantSubscription.isLoading) || (includeEntitlements && planEntitlements.isLoading),
  };
}

function PlanBlockedState({ featureKey, subscription }: { featureKey: string; subscription: SubscriptionSnapshot }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-lg border border-border bg-surface-raised/40 p-6 text-center">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Plan SaaS</div>
        <h2 className="mt-2 text-lg font-semibold">Funcion no incluida en tu plan</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {explainBlockedFeature(subscription, featureKey)}
        </p>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Revisa Mi cuenta para solicitar upgrade o pide al administrador SaaS que cambie tu plan.
        </p>
      </div>
    </div>
  );
}
