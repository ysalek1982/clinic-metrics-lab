import { Bell, Brain, ChevronDown, Plus, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PACKS } from "@/data/packs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-context";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useTenantAlerts } from "@/hooks/useClinicalData";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useUnreadMessageCount } from "@/hooks/useMessages";
import { presentStatus } from "@/lib/presentation";
import { cn } from "@/lib/utils";
import type { PackId } from "@/types/domain";

function formatPlanId(planId?: string | null) {
  return (planId ?? "plan").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AppTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user, signOut } = useAuth();
  const { data: alertResult } = useTenantAlerts();
  const { hasPermission, isPlatformSuperadmin } = useAuthorization();
  const canReadMessages = hasPermission("messages.read");
  const { data: unreadMessageCount = 0 } = useUnreadMessageCount(canReadMessages);
  const {
    activePack,
    activeTenant,
    enabledPacks,
    setActivePack,
    setActiveTenant,
    tenants,
    isDemoMode,
  } = useTenantRuntime();

  const currentPack = activePack === "all" ? null : PACKS[activePack];
  const alertCount =
    alertResult?.data?.filter((alert) => alert.status === "active" || alert.status === "attended").length ?? 0;
  const notificationCount = alertCount + unreadMessageCount;
  const canUseCopilot = hasPermission("ai.assist");
  const tenantName = activeTenant?.name ?? (authLoading ? "Validando sesión" : isAuthenticated ? "Selecciona tenant" : "Modo demo");
  const tenantSubtitle = activeTenant
    ? "Sede Central"
    : authLoading
      ? "Contexto seguro"
      : isAuthenticated
        ? "Sin tenant activo"
        : "Catálogo preventa";
  const tenantInitials = activeTenant?.branding?.logoInitials ?? (authLoading ? "VS" : isAuthenticated ? "ST" : "NT");

  function handlePackSelection(packId: PackId | "all") {
    setActivePack(packId);

    if (packId === "all") {
      if (location.pathname.startsWith("/app/pack/")) {
        navigate("/app");
      }
      return;
    }

    navigate(`/app/pack/${packId}`);
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-surface/55 px-4 backdrop-blur-md">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex h-10 items-center gap-2 rounded-md px-2.5 text-left transition-colors hover:bg-surface-raised">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/15">
              <span className="text-[10px] font-mono font-bold text-primary">
                {tenantInitials}
              </span>
            </div>

            <div className="leading-tight">
              <div className="max-w-[220px] truncate text-[12px] font-medium">
                {tenantName}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {tenantSubtitle}
              </div>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Tenant activo
          </DropdownMenuLabel>

          {tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => setActiveTenant(tenant.id)}
              className="flex items-center gap-3 py-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-[10px] font-mono text-primary">
                {tenant.branding?.logoInitials ?? tenant.name?.slice(0, 2).toUpperCase() ?? "TN"}
              </div>

              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium">{tenant.name ?? "Tenant sin nombre"}</div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {formatPlanId(tenant.planId)} - {(tenant.enabledPacks ?? []).length} packs
                </div>
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/app/tenants">Abrir selector de tenants</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-6 w-px bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
                "flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] font-medium transition-colors",
                currentPack
                  ? "border-transparent text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
            )}
            style={
              currentPack
                ? {
                    background: `hsl(var(${currentPack.cssVar}) / 0.12)`,
                    color: `hsl(var(${currentPack.cssVar}))`,
                    boxShadow: `inset 0 0 0 1px hsl(var(${currentPack.cssVar}) / 0.4)`,
                  }
                : undefined
            }
          >
            <span
              className="status-dot"
              style={{ background: currentPack ? `hsl(var(${currentPack.cssVar}))` : "hsl(var(--muted-foreground))" }}
            />
            {currentPack ? currentPack.shortName : "Todos los packs"}
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuItem onClick={() => handlePackSelection("all")}>
            <span className="status-dot mr-2 bg-muted-foreground" /> Todos los packs
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {enabledPacks
            .filter((packId) => PACKS[packId])
            .map((packId) => {
              const pack = PACKS[packId];
              return (
                <DropdownMenuItem key={packId} onClick={() => handlePackSelection(packId)}>
                  <span className="status-dot mr-2" style={{ background: `hsl(var(${pack.cssVar}))` }} />
                  {pack.name}
                </DropdownMenuItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-2 max-w-xl flex-1">
        <button
          type="button"
          className="flex h-9 w-full items-center gap-2.5 rounded-md border border-border bg-surface-raised/40 px-3 text-[12px] text-muted-foreground transition-colors hover:border-border/70 hover:bg-surface-raised"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Buscar paciente, MRN, evaluación...</span>
          <span className="kbd">Ctrl</span>
          <span className="kbd">K</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          asChild
          size="sm"
          className="h-8 gap-1.5 border-0 text-[12px] text-primary-foreground gradient-primary hover:opacity-90"
        >
          <Link to="/app/evaluations/new">
            <Plus className="h-3.5 w-3.5" /> Nueva evaluación
          </Link>
        </Button>

        {canUseCopilot && (
          <Button asChild variant="outline" size="sm" className="hidden h-8 gap-1.5 text-[12px] lg:inline-flex">
            <Link to="/app/copilot" aria-label="Abrir Copilot clínico">
              <Brain className="h-3.5 w-3.5" />
              Copilot
              {alertCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-mono text-primary">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Link>
          </Button>
        )}

        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          title={`${alertCount} alertas activas, ${unreadMessageCount} mensajes no leídos`}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-destructive px-1 text-[9px] font-mono leading-4 text-destructive-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex h-8 items-center gap-2 rounded-md pl-1 pr-2 hover:bg-surface-raised">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-primary-glow text-[10px] font-mono font-bold text-primary-foreground">
                {user?.initials ?? "ND"}
              </div>

              <div className="hidden text-left leading-tight sm:block">
                <div className="text-[11px] font-medium">{user?.name ?? "Modo demo"}</div>
                <div className="text-[9px] font-mono uppercase text-muted-foreground">
                    {user?.title ?? (isDemoMode ? "exploración" : "Dir. nutrición")}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>{user?.name ?? "Exploración"}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/app/users">Mi equipo y permisos</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/settings">Preferencias institucionales</Link>
            </DropdownMenuItem>

            {isPlatformSuperadmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/platform">Panel de plataforma</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/onboarding">Crear nuevo tenant</Link>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            {user ? (
              <DropdownMenuItem onClick={() => void signOut()}>Cerrar sesión</DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/login">Iniciar sesión</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
