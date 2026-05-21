import { ArrowLeftRight } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { PackPill } from "@/components/common/PackPill";
import { RiskBadge } from "@/components/common/RiskBadge";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/features/auth/auth-context";
import { useTenantNutritionPlans, useTenantPatients, useTenantScreenings } from "@/hooks/useClinicalData";
import { resolveViewSource } from "@/lib/view-source";

export default function Comparator() {
  const { isAuthenticated } = useAuth();
  const patientQuery = useTenantPatients();
  const planQuery = useTenantNutritionPlans();
  const screeningQuery = useTenantScreenings();
  const patientResult = patientQuery.data ?? { source: "supabase" as const, data: [] };
  const planResult = planQuery.data ?? { source: "supabase" as const, data: [] };
  const screeningResult = screeningQuery.data ?? { source: "supabase" as const, data: [] };
  const patients = useMemo(() => patientResult.data ?? [], [patientResult.data]);
  const plans = useMemo(() => planResult.data ?? [], [planResult.data]);
  const screenings = useMemo(() => screeningResult.data ?? [], [screeningResult.data]);
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [patientResult.source, planResult.source, screeningResult.source],
  });
  const [leftPatientId, setLeftPatientId] = useState<string>("");
  const [rightPatientId, setRightPatientId] = useState<string>("");

  const leftPatient = patients.find((patient) => patient.id === leftPatientId) ?? patients[0] ?? null;
  const rightPatient = patients.find((patient) => patient.id === rightPatientId) ?? patients[1] ?? patients[0] ?? null;

  const leftPlan = useMemo(() => plans.find((plan) => plan.patientId === leftPatient?.id) ?? null, [leftPatient?.id, plans]);
  const rightPlan = useMemo(() => plans.find((plan) => plan.patientId === rightPatient?.id) ?? null, [plans, rightPatient?.id]);
  const leftScreening = useMemo(
    () => screenings.find((screening) => screening.patientId === leftPatient?.id) ?? null,
    [leftPatient?.id, screenings],
  );
  const rightScreening = useMemo(
    () => screenings.find((screening) => screening.patientId === rightPatient?.id) ?? null,
    [rightPatient?.id, screenings],
  );

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex items-center gap-2">
            <span>Workspace comparator</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Comparador longitudinal"
        subtitle="Contrasta pacientes, riesgo, screening y planes dentro del tenant activo."
      />

      <div className="space-y-4 p-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <ComparatorPicker label="Paciente A" patients={patients} selectedId={leftPatient?.id ?? ""} onSelect={setLeftPatientId} />
          <div className="flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised/40 text-primary">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
          <ComparatorPicker label="Paciente B" patients={patients} selectedId={rightPatient?.id ?? ""} onSelect={setRightPatientId} />
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <PatientComparatorCard title="Paciente A" patient={leftPatient} plan={leftPlan} screening={leftScreening} />
          <PatientComparatorCard title="Paciente B" patient={rightPatient} plan={rightPlan} screening={rightScreening} />
        </div>

        <div className="panel p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Diferencias clave</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DiffMetric
              label="Riesgo"
              leftValue={leftPatient ? riskLabel(leftPatient.risk) : "-"}
              rightValue={rightPatient ? riskLabel(rightPatient.risk) : "-"}
            />
            <DiffMetric label="Score de screening" leftValue={leftScreening?.score ?? "-"} rightValue={rightScreening?.score ?? "-"} />
            <DiffMetric label="Plan kcal" leftValue={leftPlan?.kcal ?? "-"} rightValue={rightPlan?.kcal ?? "-"} />
            <DiffMetric
              label="Seguimiento"
              leftValue={leftPatient?.nextFollowUpAt ?? "-"}
              rightValue={rightPatient?.nextFollowUpAt ?? "-"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparatorPicker({
  label,
  patients,
  selectedId,
  onSelect,
}: {
  label: string;
  patients: Array<{ id: string; fullName: string; mrn: string }>;
  selectedId: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="panel p-4">
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select value={selectedId} onValueChange={onSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.fullName} - {patient.mrn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function PatientComparatorCard({
  title,
  patient,
  plan,
  screening,
}: {
  title: string;
  patient:
    | {
        fullName: string;
        mrn: string;
        ageLabel: string;
        diagnosisSummary: string;
        risk: "low" | "moderate" | "high" | "critical";
        primaryPack: import("@/types/domain").PackId;
        nextFollowUpAt: string;
      }
    | null;
  plan:
    | {
        kcal: number | null;
        proteinG: number | null;
        diet: string | null;
        type: string;
      }
    | null;
  screening:
    | {
        score: number;
        level: string;
        templateName: string;
      }
    | null;
}) {
  if (!patient) {
    return <div className="panel p-5 text-[13px] text-muted-foreground">No hay suficientes pacientes para comparar.</div>;
  }

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{title}</div>
          <div className="mt-1 text-[18px] font-semibold">{patient.fullName}</div>
          <div className="text-[12px] text-muted-foreground">
            {patient.mrn} - {patient.ageLabel}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PackPill pack={patient.primaryPack} />
          <RiskBadge level={patient.risk} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MetricCard label="Diagnostico" value={patient.diagnosisSummary} />
        <MetricCard label="Proxima revision" value={patient.nextFollowUpAt} />
        <MetricCard
          label="Screening"
            value={screening ? `${screening.templateName ?? screening.level} - ${screening.score}` : "Sin screening"}
        />
        <MetricCard
          label="Plan activo"
            value={plan ? `${plan.type} - ${plan.kcal ?? "-"} kcal - ${plan.proteinG ?? "-"} g` : "Sin plan"}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-surface-raised/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-[13px] font-medium">{value}</div>
    </div>
  );
}

function DiffMetric({
  label,
  leftValue,
  rightValue,
}: {
  label: string;
  leftValue: string | number;
  rightValue: string | number;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-raised/30 p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-mono text-muted-foreground">A</div>
          <div className="text-[14px] font-semibold">{leftValue}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-muted-foreground">B</div>
          <div className="text-[14px] font-semibold">{rightValue}</div>
        </div>
      </div>
    </div>
  );
}

function riskLabel(level: "low" | "moderate" | "high" | "critical") {
  return {
    low: "Bajo",
    moderate: "Moderado",
    high: "Alto",
    critical: "Critico",
  }[level];
}
