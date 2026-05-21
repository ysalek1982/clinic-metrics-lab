import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthorization } from "@/hooks/useAuthorization";
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

export function RequireTenantPermission({ permission }: { permission: string }) {
  const location = useLocation();
  const { loading, isAuthenticated, activationRequired, activeTenantId } = useAuth();
  const { hasPermission, isPlatformSuperadmin } = useAuthorization();

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

  if (!isPlatformSuperadmin && !hasPermission(permission)) {
    return <ForbiddenState />;
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
