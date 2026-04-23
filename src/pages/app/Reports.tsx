import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { FileText, Download, Plus } from "lucide-react";

const TEMPLATES = [
  { name: "Reporte antropométrico premium", desc: "Sesión completa, fórmulas, somatotipo y comparativa.", pack: "Deportivo" },
  { name: "Reporte clínico hospitalario", desc: "Screening + evaluación + plan + diagnóstico.", pack: "Clínico" },
  { name: "Reporte pediátrico con curvas", desc: "Crecimiento, percentiles, z-scores y recomendaciones.", pack: "Pediatría" },
  { name: "Reporte ejecutivo institucional", desc: "KPIs globales, riesgo y carga clínica para directivos.", pack: "Ejecutivo" },
  { name: "Reporte de embarazo", desc: "Ganancia gestacional, micronutrientes, evolución por trimestre.", pack: "Gineco" },
  { name: "Reporte enteral diario", desc: "Volumen, tolerancia, balances y signos digestivos.", pack: "Enteral" },
];

export default function Reports() {
  return (
    <div>
      <PageHeader
        meta="Generación PDF · Excel · CSV"
        title="Centro de reportes"
        subtitle="Plantillas configurables con identidad institucional."
        actions={<Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0"><Plus className="w-3.5 h-3.5 mr-1.5" />Nueva plantilla</Button>}
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATES.map((t) => (
          <div key={t.name} className="panel p-5 hover:border-primary/40 transition-colors group">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary"><FileText className="w-4 h-4" /></div>
              <div className="flex-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t.pack}</div>
                <h3 className="text-[14px] font-medium mt-0.5">{t.name}</h3>
                <p className="text-[12px] text-muted-foreground mt-1">{t.desc}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1">Vista previa</Button>
              <Button size="sm" className="h-7 text-[11px] flex-1"><Download className="w-3 h-3 mr-1" />Generar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
