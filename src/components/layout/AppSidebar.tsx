import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { MODULE_AREA_LABELS, type ModuleArea, type ModuleStatus } from "@/config/moduleRegistry";
import {
  getOperationalProfile,
  getProfileModuleIds,
  OPERATIONAL_PROFILES,
  suggestOperationalProfile,
  type OperationalProfileId,
} from "@/config/operationalProfiles";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTenantAlerts } from "@/hooks/useClinicalData";
import { useModuleRegistry } from "@/hooks/useModuleRegistry";
import { useUnreadMessageCount } from "@/hooks/useMessages";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { cn } from "@/lib/utils";

const SIDEBAR_AREA_ORDER: ModuleArea[] = [
  "operational-center",
  "clinical",
  "laboratory",
  "nutrition",
  "hospital",
  "pediatric",
  "sports",
  "administration",
  "reports",
  "system",
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<OperationalProfileId | "suggested">("suggested");
  const location = useLocation();
  const { loading: authLoading } = useAuth();
  const { enabledPacks, isDemoMode } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { data: alertResult } = useTenantAlerts();
  const canReadMessages = hasPermission("messages.read");
  const { data: unreadMessageCount = 0 } = useUnreadMessageCount(canReadMessages);
  const { sidebarGroups } = useModuleRegistry(query);
  const alertCount = alertResult?.data?.length ?? 0;
  const suggestedProfile = useMemo(
    () =>
      suggestOperationalProfile({
        enabledPacks,
        isAdmin: hasPermission("users.manage") || hasPermission("organization.manage") || hasPermission("audit_logs.read"),
      }),
    [enabledPacks, hasPermission],
  );
  const activeProfile = selectedProfileId === "suggested" ? suggestedProfile : getOperationalProfile(selectedProfileId) ?? suggestedProfile;
  const activeProfileModuleIds = useMemo(() => getProfileModuleIds(activeProfile.id), [activeProfile.id]);

  const groups = useMemo(
    () =>
      SIDEBAR_AREA_ORDER.map((area) => ({
        area,
        modules: sidebarGroups.find((group) => group.area === area)?.modules ?? [],
      })).filter((group) => group.modules.length > 0),
    [sidebarGroups],
  );

  const badgeFor = (moduleId: string) => {
    if (moduleId === "copilot" || moduleId === "alerts") return alertCount > 0 ? alertCount : undefined;
    if (moduleId === "messages") return unreadMessageCount > 0 ? unreadMessageCount : undefined;
    return undefined;
  };

  const isActive = (route?: string) => {
    if (!route) return false;
    return location.pathname === route || (route !== "/app" && location.pathname.startsWith(`${route}/`));
  };

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300",
        collapsed ? "w-16" : "w-72 xl:w-80",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="gradient-primary ring-glow flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <span className="text-[11px] font-mono font-bold text-primary-foreground">N</span>
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[13px] font-semibold leading-tight">Nutri</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {authLoading ? "V1.0 - SEGURO" : isDemoMode ? "V1.0 - DEMO" : "V1.0 - CLINICO"}
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="border-b border-sidebar-border px-3 py-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar modulo..."
              className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar-accent/30 pl-8 pr-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40"
            />
          </label>
          <div className="mt-2 rounded-md border border-sidebar-border bg-sidebar-accent/20 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Perfil sugerido</span>
              <span className="truncate text-[11px] text-primary">{suggestedProfile.label}</span>
            </div>
            <select
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value as OperationalProfileId | "suggested")}
              className="mt-2 h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-[12px] text-sidebar-foreground outline-none"
              aria-label="Perfil operativo visual"
            >
              <option value="suggested">Usar sugerido: {suggestedProfile.label}</option>
              {OPERATIONAL_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[10px] text-muted-foreground">
              Vista local: destaca modulos del perfil, no guarda configuracion.
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3">
        {groups.map((group) => (
          <NavSection key={group.area} label={MODULE_AREA_LABELS[group.area]} collapsed={collapsed}>
            {group.modules.map((module) => {
              const Icon = module.icon;
              return (
                <NavItem
                  key={module.id}
                  active={isActive(module.route)}
                  badge={badgeFor(module.id)}
                  collapsed={collapsed}
                  disabled={module.access.disabled}
                  highlighted={activeProfileModuleIds.has(module.id)}
                  icon={<Icon className="h-4 w-4 shrink-0" />}
                  label={module.label}
                  reason={module.access.reason}
                  route={module.route}
                  status={module.status}
                  statusLabel={module.access.label}
                />
              );
            })}
          </NavSection>
        ))}

        {!collapsed && groups.length === 0 && (
          <div className="rounded-md border border-dashed border-sidebar-border px-3 py-4 text-[12px] text-muted-foreground">
            No hay modulos visibles para la busqueda o permisos actuales.
          </div>
        )}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        className="flex h-10 items-center justify-center border-t border-sidebar-border text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}

function NavSection({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      {!collapsed && (
        <div className="mb-1.5 px-2 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/65">
          {label}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({
  active,
  badge,
  collapsed,
  disabled,
  highlighted,
  icon,
  label,
  reason,
  route,
  status,
  statusLabel,
}: {
  active: boolean;
  badge?: number;
  collapsed: boolean;
  disabled: boolean;
  highlighted: boolean;
  icon: ReactNode;
  label: string;
  reason?: string;
  route?: string;
  status: ModuleStatus;
  statusLabel: string;
}) {
  const content = (
    <>
      {icon}
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-mono text-destructive">{badge}</span>
      )}
      {!collapsed && shouldShowStatusBadge(status, disabled) && <ModuleBadge status={status} label={statusLabel} />}
    </>
  );

  const className = cn(
    "group relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
    active
      ? "bg-sidebar-accent/95 font-medium text-sidebar-accent-foreground shadow-sm shadow-black/10"
      : "text-sidebar-foreground/90 hover:bg-sidebar-accent/45 hover:text-sidebar-accent-foreground",
    highlighted && !active && "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-primary/55",
    highlighted && active && "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-primary",
    disabled && "cursor-not-allowed opacity-55 hover:bg-transparent hover:text-sidebar-foreground",
  );

  if (!disabled && route) {
    return (
      <Link to={route} className={className} title={reason ?? label}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} title={reason ?? statusLabel} aria-disabled="true">
      {content}
    </div>
  );
}

function shouldShowStatusBadge(status: ModuleStatus, disabled: boolean) {
  if (status === "active") return false;
  if (status === "partial") return disabled;
  return true;
}

function ModuleBadge({ status, label }: { status: ModuleStatus; label: string }) {
  const text =
    status === "coming_soon"
      ? "Proximamente"
      : status === "blocked"
        ? "Bloqueado"
        : status === "partial"
          ? "Parcial"
          : label;
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase",
        status === "blocked" && "bg-risk-high/15 text-risk-high",
        status === "coming_soon" && "bg-muted/20 text-muted-foreground",
        status === "partial" && "bg-primary/10 text-primary",
      )}
    >
      {text}
    </span>
  );
}
