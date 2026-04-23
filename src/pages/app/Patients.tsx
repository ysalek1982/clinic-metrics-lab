import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Plus, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { PackPill } from "@/components/common/PackPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATIENTS } from "@/data/demo";
import { useAppStore } from "@/store/app";

function age(birthDate: string) {
  const d = new Date(birthDate);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a;
}

export default function Patients() {
  const [q, setQ] = useState("");
  const { activePack } = useAppStore();

  const filtered = PATIENTS.filter((p) => {
    if (activePack !== "all" && !p.packs.includes(activePack)) return false;
    if (q && !`${p.firstName} ${p.lastName} ${p.mrn}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        meta="Personas · Multi-pack"
        title="Pacientes"
        subtitle={`${filtered.length} de ${PATIENTS.length} pacientes ${activePack !== "all" ? "en el pack activo" : "totales"}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-[12px]"><Filter className="w-3.5 h-3.5 mr-1.5" />Filtros</Button>
            <Button size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0"><Plus className="w-3.5 h-3.5 mr-1.5" />Nuevo paciente</Button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, MRN…" className="h-9 pl-9 text-[13px] bg-surface-raised/40 border-border" />
          </div>
        </div>

        <div className="panel overflow-hidden">
          <table className="w-full text-[13px] tabular">
            <thead>
              <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-normal w-8"></th>
                <th className="text-left px-4 py-2.5 font-normal">Paciente <ArrowUpDown className="inline w-3 h-3 ml-1 opacity-40" /></th>
                <th className="text-left px-4 py-2.5 font-normal">MRN</th>
                <th className="text-left px-4 py-2.5 font-normal">Edad/Sexo</th>
                <th className="text-left px-4 py-2.5 font-normal">Pack</th>
                <th className="text-left px-4 py-2.5 font-normal">Diagnóstico</th>
                <th className="text-left px-4 py-2.5 font-normal">Ubicación</th>
                <th className="text-left px-4 py-2.5 font-normal">Riesgo</th>
                <th className="text-left px-4 py-2.5 font-normal">Próx. seg.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-surface-raised/40 transition-colors group">
                  <td className="px-4 py-3"><RiskDot level={p.risk} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/app/patients/${p.id}`} className="font-medium hover:text-primary transition-colors">
                      {p.firstName} {p.lastName}
                    </Link>
                    {p.allergies.length > 0 && (
                      <div className="text-[10px] text-risk-high font-mono mt-0.5 uppercase">⚠ {p.allergies.join(", ")}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{p.mrn}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">{age(p.birthDate)}a · {p.sex === "male" ? "M" : p.sex === "female" ? "F" : "X"}</td>
                  <td className="px-4 py-3"><PackPill pack={p.primaryPack} /></td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground max-w-[280px] truncate">{p.diagnoses[0]}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    {p.ward}{p.bed ? ` · ${p.bed}` : ""}
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={p.risk} /></td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    {p.nextFollowUp ? new Date(p.nextFollowUp).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
