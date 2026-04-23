import { PageHeader } from "@/components/common/PageHeader";
import { useAppStore } from "@/store/app";
import { PACKS, PACK_LIST } from "@/data/packs";
import { Switch } from "@/components/ui/switch";

export default function Organization() {
  const { org } = useAppStore();
  return (
    <div>
      <PageHeader meta="Multi-tenant · Configuración" title={org.name} subtitle="Activa los packs que tu institución utilizará." />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tipo</div>
            <div className="text-[14px] font-medium mt-1 capitalize">{org.type}</div>
          </div>
          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Sedes</div>
            <div className="text-[14px] font-medium mt-1">{org.branches.length}</div>
          </div>
          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Packs activos</div>
            <div className="text-[14px] font-medium mt-1">{org.activePacks.length} de {PACK_LIST.length}</div>
          </div>
          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Plan</div>
            <div className="text-[14px] font-medium mt-1 text-primary">Enterprise</div>
          </div>
        </div>

        <div className="panel">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-[15px] font-medium">Packs de especialidad</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Cada pack habilita módulos, fórmulas, dashboards y protocolos específicos.</p>
          </div>
          <div className="divide-y divide-border">
            {PACK_LIST.map((p) => {
              const active = org.activePacks.includes(p.id);
              return (
                <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: `hsl(var(${p.cssVar}))` }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.description}</div>
                  </div>
                  <Switch checked={active} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
