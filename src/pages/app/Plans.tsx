import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { PLANS, PATIENTS } from "@/data/demo";
import { Plus, FileText } from "lucide-react";

export default function Plans() {
  return (
    <div>
      <PageHeader
        meta="Prescripción · Plantillas reutilizables"
        title="Planes nutricionales"
        actions={<Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0"><Plus className="w-3.5 h-3.5 mr-1.5" />Nuevo plan</Button>}
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLANS.map((pl) => {
          const p = PATIENTS.find((x) => x.id === pl.patientId);
          return (
            <div key={pl.id} className="panel p-5 space-y-3 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{pl.type} · {pl.diet}</div>
                  <h3 className="text-[15px] font-medium mt-0.5">{p?.firstName} {p?.lastName}</h3>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-risk-low/12 text-risk-low border border-risk-low/30 uppercase">{pl.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 tabular text-[12px]">
                <Mini label="Energía" value={`${pl.kcal} kcal`} />
                <Mini label="Proteína" value={`${pl.protein_g}g`} />
                <Mini label="Carbs" value={`${pl.carbs_g}g`} />
                <Mini label="Grasa" value={`${pl.fat_g}g`} />
                <Mini label="Líquidos" value={`${pl.fluids_ml}ml`} />
                <Mini label="Inicio" value={new Date(pl.startDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })} />
              </div>
            </div>
          );
        })}
        <div className="panel p-5 border-dashed flex items-center justify-center min-h-[200px] text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-center">
            <Plus className="w-5 h-5 mx-auto mb-2" />
            <div className="text-[12px]">Crear plan desde plantilla</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-raised/40 rounded p-2">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
