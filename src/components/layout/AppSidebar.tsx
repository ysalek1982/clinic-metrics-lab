import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Ruler, ShieldAlert, FileText, Bell, Settings, Activity, Baby, Flower2, Droplets, Dumbbell, ChevronsLeft, ChevronsRight, FlaskConical, GraduationCap, Building2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { PACKS } from "@/data/packs";

const mainNav = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/patients", icon: Users, label: "Pacientes" },
  { to: "/app/anthropometry", icon: Ruler, label: "Antropometría" },
  { to: "/app/screening", icon: ShieldAlert, label: "Screening" },
  { to: "/app/plans", icon: FileText, label: "Planes" },
  { to: "/app/alerts", icon: Bell, label: "Alertas", badge: 6 },
  { to: "/app/reports", icon: FileText, label: "Reportes" },
];

const packNav: { id: keyof typeof PACKS; to: string; icon: any }[] = [
  { id: "clinical", to: "/app/pack/clinical", icon: Activity },
  { id: "pediatric", to: "/app/pack/pediatric", icon: Baby },
  { id: "gineco", to: "/app/pack/gineco", icon: Flower2 },
  { id: "enteral", to: "/app/pack/enteral", icon: Droplets },
  { id: "sport", to: "/app/pack/sport", icon: Dumbbell },
];

const adminNav = [
  { to: "/app/formulas", icon: FlaskConical, label: "Fórmulas" },
  { to: "/app/users", icon: GraduationCap, label: "Equipo" },
  { to: "/app/organization", icon: Building2, label: "Organización" },
  { to: "/app/settings", icon: Settings, label: "Configuración" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { activePack } = useAppStore();

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <aside
      className={cn(
        "shrink-0 h-screen sticky top-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-[width] duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center shrink-0 ring-glow">
          <span className="text-primary-foreground font-mono font-bold text-[11px]">N</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[13px] font-semibold leading-tight">Nutrition OS</div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">v1.0 · clinical</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        <NavSection label="Workspace" collapsed={collapsed}>
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to, item.end)} collapsed={collapsed} />
          ))}
        </NavSection>

        <NavSection label="Packs activos" collapsed={collapsed}>
          {packNav.map((item) => {
            const pack = PACKS[item.id];
            return (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={pack.shortName}
                active={isActive(item.to)}
                collapsed={collapsed}
                accentVar={pack.cssVar}
                indicator={activePack === item.id}
              />
            );
          })}
        </NavSection>

        <NavSection label="Administración" collapsed={collapsed}>
          {adminNav.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to)} collapsed={collapsed} />
          ))}
        </NavSection>
      </nav>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="h-10 border-t border-sidebar-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

function NavSection({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div>
      {!collapsed && (
        <div className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/70">
          {label}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  to, icon: Icon, label, active, collapsed, badge, accentVar, indicator,
}: {
  to: string; icon: any; label: string; active?: boolean; collapsed?: boolean;
  badge?: number; accentVar?: string; indicator?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
      style={accentVar && active ? { boxShadow: `inset 2px 0 0 hsl(var(${accentVar}))` } : undefined}
    >
      <Icon
        className="w-4 h-4 shrink-0"
        style={accentVar ? { color: active ? `hsl(var(${accentVar}))` : undefined } : undefined}
      />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">{badge}</span>
      )}
      {!collapsed && indicator && (
        <span className="status-dot animate-pulse-glow" style={accentVar ? { background: `hsl(var(${accentVar}))` } : undefined} />
      )}
    </Link>
  );
}
