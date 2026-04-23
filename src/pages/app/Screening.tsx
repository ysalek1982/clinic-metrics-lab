import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { Button } from "@/components/ui/button";
import { SCREENINGS, PATIENTS } from "@/data/demo";
import { Plus, Filter } from "lucide-react";

const PROTOCOLS = [
  { id: "nrs", name: "NRS-2002", desc: "Tamizaje hospitalario adultos", uses: 142 },
  { id: "mna", name: "MNA-SF", desc: "Mini Nutritional Assessment geriátrico", uses: 88 },
  { id: "must", name: "MUST", desc: "Malnutrition Universal Screening Tool", uses: 64 },
  { id: "stamp", name: "STAMP", desc: "Pediátrico hospitalario", uses: 41 },
  { id: "saga", name: "SAGA", desc: "Subjective Assessment Global Adapted", uses: 22 },
];

export default function Screening() {
  return (
    <div>
      <PageHeader
        meta="Motor de reglas clínicas · Configurable"
        title="Screening nutricional"
        subtitle="Protocolos validados internacionalmente y reglas personalizadas por institución."
        actions={<Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0"><Plus className="w-3.5 h-3.5 mr-1.5" />Nuevo screening</Button>}
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-3">
        <div className="panel">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-[15px] font-medium">Screenings recientes</h3>
            <Button variant="outline" size="sm" className="h-7 text-[11px]"><Filter className="w-3 h-3 mr-1.5" />Filtros</Button>
          </div>
          <table className="w-full text-[13px] tabular">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-raised/30">
                <th className="text-left px-5 py-2.5 font-normal">Paciente</th>
                <th className="text-left px-5 py-2.5 font-normal">Protocolo</th>
                <th className="text-left px-5 py-2.5 font-normal">Score</th>
                <th className="text-left px-5 py-2.5 font-normal">Riesgo</th>
                <th className="text-left px-5 py-2.5 font-normal">Banderas</th>
                <th className="text-left px-5 py-2.5 font-normal">Próx. revisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SCREENINGS.map((s) => {
                const p = PATIENTS.find((x) => x.id === s.patientId);
                return (
                  <tr key={s.id} className="hover:bg-surface-raised/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <RiskDot level={s.level} />
                        <span className="font-medium">{p?.firstName} {p?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px]">{s.protocol}</td>
                    <td className="px-5 py-3 font-medium">{s.score}</td>
                    <td className="px-5 py-3"><RiskBadge level={s.level} /></td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.flags.map((f) => (
                          <span key={f} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised text-muted-foreground">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">{new Date(s.nextReview).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="panel p-5 space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Protocolos disponibles</div>
            <h3 className="text-[15px] font-medium mt-0.5">Configurables por pack</h3>
          </div>
          {PROTOCOLS.map((p) => (
            <div key={p.id} className="border border-border rounded-md p-3 hover:border-primary/40 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">{p.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{p.uses}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
