import { Link } from "react-router-dom";
import { Eye, Plus, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { RiskBadge } from "@/components/common/RiskBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useCcorpAssessments } from "@/hooks/useCcorpLevel1";
import { resolveViewSource } from "@/lib/view-source";

export default function CcorpLevel1List() {
  const { isAuthenticated } = useAuth();
  const { hasPermission } = useAuthorization();
  const { data: ccorpResult, isLoading, isError, error } = useCcorpAssessments();
  const safeCcorpResult = ccorpResult ?? { source: "supabase" as const, data: [] };
  const assessments = safeCcorpResult.data ?? [];
  const viewSource = resolveViewSource({ isAuthenticated, sources: [safeCcorpResult.source] });
  const canCreate = hasPermission("ccorp_level1.create");

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>Pack deportivo - Antropometría</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="CCORP Nivel 1"
        subtitle="Evaluaciones de composición corporal, somatotipo y peso ideal basadas en la plantilla técnica Nivel 1."
        actions={
          <Button asChild disabled={!canCreate} className="h-9 border-0 text-[12px] text-primary-foreground gradient-primary">
            <Link to="/app/ccorp-level-1/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nueva evaluación
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        {!canCreate && (
          <div className="panel border-risk-moderate/30 bg-risk-moderate/10 px-4 py-3 text-[12px] text-risk-moderate">
            Tu rol puede consultar el módulo si tiene permiso de lectura, pero no crear nuevas evaluaciones.
          </div>
        )}

        {isError && (
          <div className="panel border-risk-high/30 bg-risk-high/10 px-4 py-3 text-[12px] text-risk-high">
            {error instanceof Error ? error.message : "No se pudieron cargar las evaluaciones CCORP Nivel 1."}
          </div>
        )}

        <div className="panel overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-[15px] font-medium">Evaluaciones registradas</h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Datos persistidos por tenant. No se muestran registros demo en sesión autenticada.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full tabular text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-normal">Paciente</th>
                  <th className="px-4 py-2.5 text-left font-normal">Fecha</th>
                  <th className="px-4 py-2.5 text-left font-normal">Edad</th>
                  <th className="px-4 py-2.5 text-left font-normal">Sexo</th>
                  <th className="px-4 py-2.5 text-left font-normal">% graso D&W</th>
                  <th className="px-4 py-2.5 text-left font-normal">Grasa</th>
                  <th className="px-4 py-2.5 text-left font-normal">Magra</th>
                  <th className="px-4 py-2.5 text-left font-normal">Somatotipo</th>
                  <th className="px-4 py-2.5 text-left font-normal">Estado</th>
                  <th className="px-4 py-2.5 text-right font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                      Cargando evaluaciones CCORP Nivel 1...
                    </td>
                  </tr>
                )}

                {!isLoading && assessments.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                      No hay evaluaciones CCORP Nivel 1 registradas para este tenant.
                    </td>
                  </tr>
                )}

                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-surface-raised/40">
                    <td className="px-4 py-3">
                      <div className="font-medium">{assessment.patientName}</div>
                      {assessment.encounterTitle && <div className="mt-0.5 text-[10px] text-muted-foreground">{assessment.encounterTitle}</div>}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">
                      {new Date(assessment.measuredAt).toLocaleDateString("es-BO")}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono">{assessment.ageDecimal ?? "--"}</td>
                    <td className="px-4 py-3 text-[11px] font-mono">{sexLabel(assessment.sex)}</td>
                    <td className="px-4 py-3 text-[11px] font-mono">{formatNumber(assessment.durninBodyFatPercent, "%")}</td>
                    <td className="px-4 py-3 text-[11px] font-mono">{formatNumber(assessment.durninFatMassKg, "kg")}</td>
                    <td className="px-4 py-3 text-[11px] font-mono">{formatNumber(assessment.durninFatFreeMassKg, "kg")}</td>
                    <td className="px-4 py-3 text-[11px] font-mono">
                      {formatSomatotype(assessment.endomorphy, assessment.mesomorphy, assessment.ectomorphy)}
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={assessment.status === "completed" ? "low" : "moderate"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                          <Link to={`/app/ccorp-level-1/${assessment.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            Ver
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                          <Link to={`/app/ccorp-level-1/${assessment.id}`}>
                            <Printer className="mr-1 h-3 w-3" />
                            Imprimir
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(value: number | null, unit: string) {
  return value === null ? "--" : `${value.toFixed(2)} ${unit}`;
}

function formatSomatotype(endo: number | null, meso: number | null, ecto: number | null) {
  return endo === null || meso === null || ecto === null ? "--" : `${endo.toFixed(1)} - ${meso.toFixed(1)} - ${ecto.toFixed(1)}`;
}

function sexLabel(value: string) {
  if (value === "male") return "M";
  if (value === "female") return "F";
  return "Otro";
}
