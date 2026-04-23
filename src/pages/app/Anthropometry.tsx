import { useState } from "react";
import { Ruler, Save, Plus, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ANTHRO_SESSIONS, PATIENTS } from "@/data/demo";

const SITES = {
  "Básicas": ["Peso (kg)", "Talla (cm)", "Talla sentado (cm)", "Envergadura (cm)"],
  "Pliegues cutáneos": ["Tríceps", "Subescapular", "Bíceps", "Cresta ilíaca", "Supraespinal", "Abdominal", "Muslo frontal", "Pierna medial"],
  "Perímetros": ["Cabeza", "Cuello", "Brazo relajado", "Brazo flex.", "Antebrazo", "Tórax", "Cintura", "Cadera", "Muslo medio", "Pierna máx."],
  "Longitudes": ["Acromiale-radiale", "Radiale-stylion", "Mid-stylion-dactylion", "Iliospinale altura", "Trochanterion altura"],
  "Diámetros": ["Biacromial", "Biiliocrestal", "Tórax transverso", "Tórax A-P", "Húmero", "Fémur", "Muñeca", "Tobillo"],
};

export default function Anthropometry() {
  const [section, setSection] = useState<keyof typeof SITES>("Básicas");
  const sessions = ANTHRO_SESSIONS;
  const sportPatient = PATIENTS.find((p) => p.id === "p-004")!;

  return (
    <div>
      <PageHeader
        meta="Pack Deportivo · Protocolo ISAK Restringido"
        title="Sesión antropométrica"
        subtitle={`Paciente: ${sportPatient.firstName} ${sportPatient.lastName} · Evaluador: J. Pulido (TEM 1.8%)`}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-[12px]">Repetir medición</Button>
            <Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0"><Save className="w-3.5 h-3.5 mr-1.5" />Guardar sesión</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr,300px] gap-0 min-h-[calc(100vh-7rem-7rem)]">
        {/* Section nav */}
        <aside className="border-r border-border bg-surface/30 p-3 space-y-0.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 mb-2">Categorías</div>
          {Object.keys(SITES).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s as any)}
              className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
                section === s ? "bg-primary/15 text-primary" : "hover:bg-surface-raised text-muted-foreground"
              }`}
            >
              <span>{s}</span>
              <span className="font-mono text-[10px]">{SITES[s as keyof typeof SITES].length}</span>
            </button>
          ))}
          <div className="border-t border-border my-3 pt-3 px-2 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Calidad sesión</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-serif italic text-risk-low">98</span>
              <span className="text-[10px] text-muted-foreground font-mono pb-1">/ 100</span>
            </div>
            <div className="text-[10px] text-muted-foreground">TEM intra-evaluador dentro de tolerancia ISAK.</div>
          </div>
        </aside>

        {/* Form */}
        <main className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">{section}</h2>
              <p className="text-[12px] text-muted-foreground">Doble medición. La diferencia se resalta si excede TEM permitido.</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground"><Plus className="w-3 h-3 mr-1" />Sitio personalizado</Button>
          </div>

          <div className="space-y-2">
            {SITES[section].map((site, i) => (
              <div key={site} className="panel p-4 grid grid-cols-1 md:grid-cols-[1fr,140px,140px,80px,1fr] gap-3 items-center">
                <div>
                  <div className="text-[13px] font-medium">{site}</div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">Sitio #{i + 1} · ISAK</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Medición 1</div>
                  <Input placeholder="0.0" className="h-9 text-[13px] tabular text-center bg-surface-raised border-border" />
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Medición 2</div>
                  <Input placeholder="0.0" className="h-9 text-[13px] tabular text-center bg-surface-raised border-border" />
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Δ</div>
                  <div className="text-[13px] font-mono tabular text-risk-low">0.0</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Notas</div>
                  <Input placeholder="—" className="h-9 text-[12px] bg-surface-raised border-border" />
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Live derived */}
        <aside className="border-l border-border bg-surface/30 p-5 space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Cálculos en vivo</div>
            <div className="text-[10px] text-muted-foreground">Fórmula: <span className="text-foreground font-mono">Yuhasz 1987 v1.2</span></div>
          </div>
          <div className="space-y-2">
            <DerivedRow label="IMC" value="21.7" unit="kg/m²" />
            <DerivedRow label="ΣP6" value="51.6" unit="mm" trend={-3.4} />
            <DerivedRow label="ΣP8" value="73.4" unit="mm" trend={-4.2} />
            <DerivedRow label="% Grasa" value="7.4" unit="%" trend={-0.5} accent="--pack-sport" />
            <DerivedRow label="MLG" value="64.1" unit="kg" trend={-0.2} />
            <DerivedRow label="MM esquelética" value="35.8" unit="kg" trend={+0.2} />
            <DerivedRow label="ICC" value="0.78" unit="" />
          </div>

          <div className="border-t border-border pt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Somatotipo</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <SomatoChip label="Endo" value="1.8" />
              <SomatoChip label="Meso" value="5.7" accent="--pack-sport" />
              <SomatoChip label="Ecto" value="3.1" />
            </div>
            <div className="text-[10px] text-center text-muted-foreground mt-2 font-mono">Mesomorfo balanceado</div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" /> Asistente IA
            </div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              Reducción consistente de panículo adiposo (-17% en 90 días) sin pérdida de masa magra. Recomposición exitosa.
            </div>
            <div className="text-[9px] text-muted-foreground mt-2 flex items-center gap-1 italic">
              <AlertCircle className="w-3 h-3" /> Sugerencia automática · revisión profesional requerida
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DerivedRow({ label, value, unit, trend, accent }: { label: string; value: string; unit: string; trend?: number; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1.5 tabular">
        {trend !== undefined && (
          <span className={`text-[10px] font-mono ${trend < 0 ? "text-risk-low" : trend > 0 ? "text-risk-high" : "text-muted-foreground"}`}>
            {trend > 0 ? "+" : ""}{trend}
          </span>
        )}
        <span className="font-medium" style={accent ? { color: `hsl(var(${accent}))` } : undefined}>{value}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{unit}</span>
      </div>
    </div>
  );
}

function SomatoChip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="panel-raised p-2">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-serif italic" style={accent ? { color: `hsl(var(${accent}))` } : undefined}>{value}</div>
    </div>
  );
}
