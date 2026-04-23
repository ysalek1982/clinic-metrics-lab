import { Search, Command, Bell, ChevronDown, Plus } from "lucide-react";
import { useAppStore } from "@/store/app";
import { PACKS } from "@/data/packs";
import { DEMO_USER } from "@/data/demo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const { org, activePack, setActivePack } = useAppStore();
  const currentPack = activePack === "all" ? null : PACKS[activePack];

  return (
    <header className="h-14 px-4 border-b border-border bg-surface/40 backdrop-blur-md sticky top-0 z-40 flex items-center gap-3">
      {/* Org & Pack selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-9 px-2.5 rounded-md hover:bg-surface-raised transition-colors flex items-center gap-2 text-left">
            <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-primary">HSM</span>
            </div>
            <div className="leading-tight">
              <div className="text-[12px] font-medium truncate max-w-[180px]">{org.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">Sede Central</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Organización</DropdownMenuLabel>
          <DropdownMenuItem className="flex flex-col items-start gap-0.5">
            <span className="font-medium">{org.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">3 sedes · 6 packs activos</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Sedes</DropdownMenuLabel>
          {org.branches.map((b) => (
            <DropdownMenuItem key={b}>{b}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border" />

      {/* Pack pill */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "h-8 px-3 rounded-full border text-[12px] font-medium flex items-center gap-2 transition-colors",
              currentPack
                ? "border-transparent text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
            style={currentPack ? {
              background: `hsl(var(${currentPack.cssVar}) / 0.12)`,
              color: `hsl(var(${currentPack.cssVar}))`,
              boxShadow: `inset 0 0 0 1px hsl(var(${currentPack.cssVar}) / 0.4)`,
            } : undefined}
          >
            <span className="status-dot" style={{ background: currentPack ? `hsl(var(${currentPack.cssVar}))` : "hsl(var(--muted-foreground))" }} />
            {currentPack ? currentPack.shortName : "Todos los packs"}
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => setActivePack("all")}>
            <span className="status-dot bg-muted-foreground mr-2" /> Todos los packs
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {org.activePacks.map((pid) => {
            const p = PACKS[pid];
            return (
              <DropdownMenuItem key={pid} onClick={() => setActivePack(pid)}>
                <span className="status-dot mr-2" style={{ background: `hsl(var(${p.cssVar}))` }} />
                {p.name}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search */}
      <div className="flex-1 max-w-xl ml-2">
        <button className="w-full h-9 px-3 rounded-md border border-border bg-surface-raised/40 hover:bg-surface-raised hover:border-border/70 transition-colors flex items-center gap-2.5 text-muted-foreground text-[12px]">
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Buscar paciente, MRN, evaluación…</span>
          <span className="kbd">⌘</span>
          <span className="kbd">K</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-8 gap-1.5 text-[12px] gradient-primary text-primary-foreground border-0 hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> Nueva evaluación
        </Button>
        <button className="w-8 h-8 rounded-md hover:bg-surface-raised flex items-center justify-center text-muted-foreground hover:text-foreground relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 pr-2 pl-1 rounded-md hover:bg-surface-raised flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-[10px] font-mono font-bold text-primary-foreground">{DEMO_USER.initials}</div>
              <div className="leading-tight text-left hidden sm:block">
                <div className="text-[11px] font-medium">{DEMO_USER.name}</div>
                <div className="text-[9px] text-muted-foreground font-mono uppercase">Dir. Nutrición</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{DEMO_USER.name}</DropdownMenuLabel>
            <DropdownMenuItem>Mi perfil</DropdownMenuItem>
            <DropdownMenuItem>Preferencias</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
