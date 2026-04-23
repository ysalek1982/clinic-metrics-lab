import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { PACKS } from "@/data/packs";
import { PATIENTS } from "@/data/demo";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { Link } from "react-router-dom";

export default function PackView() {
  const { packId } = useParams();
  const pack = PACKS[packId as keyof typeof PACKS];
  if (!pack) return <div className="p-6">Pack no encontrado</div>;

  const patients = PATIENTS.filter((p) => p.packs.includes(pack.id));

  return (
    <div>
      <PageHeader
        meta={`Pack · ${pack.name}`}
        title={
          <span className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: `hsl(var(${pack.cssVar}))` }} />
            {pack.name}
          </span>
        }
        subtitle={pack.description}
      />
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="panel p-4" style={{ boxShadow: `inset 3px 0 0 hsl(var(${pack.cssVar}))` }}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pacientes activos</div>
            <div className="text-2xl font-semibold mt-1 tabular" style={{ color: `hsl(var(${pack.cssVar}))` }}>{patients.length}</div>
          </div>
          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">En riesgo alto</div>
            <div className="text-2xl font-semibold mt-1 tabular text-risk-high">{patients.filter(p => p.risk === "high" || p.risk === "critical").length}</div>
          </div>
          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Evaluaciones / sem</div>
            <div className="text-2xl font-semibold mt-1 tabular">42</div>
          </div>
          <div className="panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Adherencia plan</div>
            <div className="text-2xl font-semibold mt-1 tabular">87%</div>
          </div>
        </div>

        <div className="panel">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-[15px] font-medium">Pacientes en este pack</h3>
          </div>
          <div className="divide-y divide-border">
            {patients.map((p) => (
              <Link key={p.id} to={`/app/patients/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised/40 transition-colors">
                <RiskDot level={p.risk} />
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{p.firstName} {p.lastName}</div>
                  <div className="text-[11px] text-muted-foreground">{p.diagnoses[0]}</div>
                </div>
                <RiskBadge level={p.risk} />
                <span className="text-[10px] font-mono text-muted-foreground">{p.mrn}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
