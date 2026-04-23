import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch } from "lucide-react";

const FORMULAS = [
  { name: "Yuhasz (1987)", category: "% Grasa corporal", versions: 3, current: "v1.2", scope: "Adultos deportistas", uses: 1842 },
  { name: "Carter & Heath (1990)", category: "Somatotipo", versions: 2, current: "v1.0", scope: "Adultos", uses: 924 },
  { name: "Lee (2000)", category: "Masa muscular esquelética", versions: 1, current: "v1.0", scope: "Adultos", uses: 1248 },
  { name: "Slaughter (1988)", category: "% Grasa pediátrica", versions: 2, current: "v1.1", scope: "8–18 años", uses: 412 },
  { name: "Mifflin-St Jeor", category: "Tasa metabólica basal", versions: 1, current: "v1.0", scope: "Adultos generales", uses: 2218 },
  { name: "OMS Z-scores", category: "Curvas crecimiento", versions: 4, current: "v2.1", scope: "0–19 años", uses: 688 },
];

export default function Formulas() {
  return (
    <div>
      <PageHeader
        meta="Motor de fórmulas · Versionado · Reproducibilidad clínica"
        title="Biblioteca de fórmulas"
        subtitle="Cada cálculo queda anclado a una versión inmutable. Las nuevas versiones no afectan evaluaciones históricas."
        actions={<Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0"><Plus className="w-3.5 h-3.5 mr-1.5" />Nueva fórmula</Button>}
      />
      <div className="p-6">
        <div className="panel">
          <table className="w-full text-[13px] tabular">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-raised/30">
                <th className="text-left px-5 py-2.5 font-normal">Fórmula</th>
                <th className="text-left px-5 py-2.5 font-normal">Categoría</th>
                <th className="text-left px-5 py-2.5 font-normal">Población</th>
                <th className="text-left px-5 py-2.5 font-normal">Versión actual</th>
                <th className="text-left px-5 py-2.5 font-normal">Versiones</th>
                <th className="text-left px-5 py-2.5 font-normal">Cálculos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FORMULAS.map((f) => (
                <tr key={f.name} className="hover:bg-surface-raised/30">
                  <td className="px-5 py-3 font-medium">{f.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{f.category}</td>
                  <td className="px-5 py-3 text-muted-foreground">{f.scope}</td>
                  <td className="px-5 py-3"><span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{f.current}</span></td>
                  <td className="px-5 py-3"><span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground"><GitBranch className="w-3 h-3" />{f.versions}</span></td>
                  <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">{f.uses.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
