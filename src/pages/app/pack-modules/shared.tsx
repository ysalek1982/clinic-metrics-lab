import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import type { RiskLevel } from "@/types/domain";

export function MetricGrid({ items }: { items: Array<{ label: string; value: string | number; hint: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="panel p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{item.label}</div>
          <div className="mt-1 text-2xl font-semibold">{item.value}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{item.hint}</div>
        </div>
      ))}
    </div>
  );
}

export function ModuleListCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ title: string; body: string; badge: string }>;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{title}</div>
        <h3 className="mt-1 text-[16px] font-medium">{subtitle}</h3>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
            No hay datos visibles para este módulo.
          </div>
        )}
        {rows.map((row) => (
          <div key={`${row.title}-${row.body}`} className="px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{row.title}</span>
              <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                {row.badge}
              </span>
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">{row.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsPanel({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="panel p-5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-[15px] font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrioritizedPatientRow({
  patient,
}: {
  patient: { id: string; fullName: string; diagnosisSummary: string; risk: RiskLevel };
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <RiskDot level={patient.risk} />
      <div className="flex-1">
        <div className="text-[13px] font-medium">{patient.fullName}</div>
        <div className="text-[11px] text-muted-foreground">{patient.diagnosisSummary}</div>
      </div>
      <RiskBadge level={patient.risk} />
    </div>
  );
}
