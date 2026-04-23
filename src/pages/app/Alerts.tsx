import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { Button } from "@/components/ui/button";
import { ALERTS } from "@/data/demo";
import { CheckCheck, BellOff } from "lucide-react";

export default function Alerts() {
  return (
    <div>
      <PageHeader
        meta="Centro de alertas · Tiempo real"
        title="Alertas activas"
        subtitle={`${ALERTS.length} alertas requieren atención`}
        actions={<Button variant="outline" size="sm" className="h-8 text-[12px]"><CheckCheck className="w-3.5 h-3.5 mr-1.5" />Marcar todas</Button>}
      />
      <div className="p-6 space-y-2">
        {ALERTS.map((a) => (
          <div key={a.id} className="panel p-4 flex items-start gap-4">
            <RiskDot level={a.severity} className="mt-2" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[14px]">{a.patientName}</span>
                {a.ward && <span className="text-[11px] font-mono text-muted-foreground">{a.ward}</span>}
                <RiskBadge level={a.severity} />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{a.type.replace("_", " ")}</span>
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">{a.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground tabular">
                {new Date(a.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-[11px]"><BellOff className="w-3 h-3 mr-1" />Silenciar</Button>
              <Button size="sm" className="h-7 text-[11px]">Atender</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
