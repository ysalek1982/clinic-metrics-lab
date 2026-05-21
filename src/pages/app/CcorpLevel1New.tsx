import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, Save } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CCORP_LEVEL1_VARIABLES } from "@/domain/ccorpLevel1/ccorpLevel1Formulas";
import { calculateCcorpLevel1 } from "@/domain/ccorpLevel1/ccorpLevel1Engine";
import { validateCcorpLevel1Input } from "@/domain/ccorpLevel1/ccorpLevel1Validation";
import type { CcorpMeasurementInput, CcorpSex, CcorpVariableCode } from "@/domain/ccorpLevel1/ccorpLevel1Types";
import { useCreateCcorpAssessment } from "@/hooks/useCcorpLevel1";
import { useCreateEncounter, useTenantEncounters, useTenantPatients } from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";

type MeasurementState = Record<CcorpVariableCode, Array<number | null>>;

const INITIAL_MEASUREMENTS = Object.fromEntries(
  CCORP_LEVEL1_VARIABLES.map((variable) => [variable.code, [null, null, null, null, null]]),
) as MeasurementState;

const CATEGORY_LABELS = {
  basic: "Datos básicos",
  diameter: "Diámetros",
  girth: "Perímetros",
  skinfold: "Pliegues cutáneos",
};

export default function CcorpLevel1New() {
  const navigate = useNavigate();
  const { activeTenantId } = useTenantRuntime();
  const patientQuery = useTenantPatients();
  const encounterQuery = useTenantEncounters();
  const createEncounter = useCreateEncounter();
  const createAssessment = useCreateCcorpAssessment();
  const patients = patientQuery.data?.data ?? [];
  const encounters = encounterQuery.data?.data ?? [];
  const [patientId, setPatientId] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [measuredAt, setMeasuredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [sex, setSex] = useState<CcorpSex>("male");
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState<MeasurementState>(INITIAL_MEASUREMENTS);
  const [targets, setTargets] = useState({
    durninBodyFat: 10,
    durninFfmi: 22,
    withersBodyFat: 9,
    withersFfmi: 22,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const selectedPatient = patients.find((patient) => patient.id === patientId) ?? null;
  const patientEncounters = encounters.filter((encounter) => encounter.patientId === patientId);
  const measurementInput = useMemo<CcorpMeasurementInput[]>(
    () =>
      CCORP_LEVEL1_VARIABLES.map((variable) => ({
        variableCode: variable.code,
        series: measurements[variable.code] ?? [null, null, null, null, null],
      })),
    [measurements],
  );
  const preview = useMemo(
    () =>
      calculateCcorpLevel1({
        measuredAt,
        birthDate: selectedPatient?.birthDate ?? null,
        sex,
        measurements: measurementInput,
        durninTargetBodyFatPercent: targets.durninBodyFat,
        durninTargetFfmi: targets.durninFfmi,
        withersTargetBodyFatPercent: targets.withersBodyFat,
        withersTargetFfmi: targets.withersFfmi,
      }),
    [measuredAt, measurementInput, selectedPatient?.birthDate, sex, targets],
  );

  useEffect(() => {
    if (selectedPatient?.sex === "male" || selectedPatient?.sex === "female") {
      setSex(selectedPatient.sex);
    }
  }, [selectedPatient?.sex]);

  async function handleCreateQuickEncounter() {
    setFormError(null);
    if (!activeTenantId || !patientId) {
      setFormError("Selecciona un paciente antes de crear el episodio.");
      return;
    }

    try {
      const created = await createEncounter.mutateAsync({
        tenantId: activeTenantId,
        patientId,
        type: "sports_season",
        title: `Evaluación CCORP Nivel 1 - ${new Date(measuredAt).toLocaleDateString("es-BO")}`,
      });
      setEncounterId(String(created.id));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el episodio.");
    }
  }

  async function handleSave() {
    setFormError(null);

    if (!activeTenantId) {
      setFormError("Selecciona un tenant activo.");
      return;
    }

    if (!selectedPatient) {
      setFormError("Selecciona un paciente real del tenant.");
      return;
    }

    const validationErrors = validateCcorpLevel1Input({
      measuredAt,
      birthDate: selectedPatient.birthDate ?? null,
      sex,
      measurements: measurementInput,
    });

    if (validationErrors.length > 0) {
      setFormError(validationErrors.join(" "));
      return;
    }

    try {
      const created = await createAssessment.mutateAsync({
        tenantId: activeTenantId,
        organizationId: selectedPatient.organizationId,
        patientId: selectedPatient.id,
        encounterId: encounterId || null,
        measuredAt: new Date(measuredAt).toISOString(),
        birthDateSnapshot: selectedPatient.birthDate ?? null,
        sex,
        notes: notes.trim() || null,
        measurements: measurementInput,
        durninTargetBodyFatPercent: targets.durninBodyFat,
        durninTargetFfmi: targets.durninFfmi,
        withersTargetBodyFatPercent: targets.withersBodyFat,
        withersTargetFfmi: targets.withersFfmi,
      });
      navigate(`/app/ccorp-level-1/${created.assessmentId}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la evaluación CCORP Nivel 1.");
    }
  }

  function updateSeries(variableCode: CcorpVariableCode, index: number, rawValue: string) {
    const value = rawValue === "" ? null : Number(rawValue);
    setMeasurements((current) => {
      const next = [...(current[variableCode] ?? [null, null, null, null, null])];
      next[index] = Number.isFinite(value) ? value : null;
      return { ...current, [variableCode]: next };
    });
  }

  return (
    <div>
      <PageHeader
        meta="Hoja de trabajo - Composición corporal"
        title="Nueva evaluación CCORP Nivel 1"
        subtitle="Captura técnica con cinco series por variable, mediana calculada y vista previa de resultados."
        actions={
          <Button asChild variant="outline" size="sm" className="h-8 text-[12px]">
            <Link to="/app/ccorp-level-1">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 p-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="panel p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Paciente">
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={patientQuery.isLoading ? "Cargando pacientes..." : "Selecciona paciente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.fullName} · {patient.mrn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Episodio">
                <div className="flex gap-2">
                  <Select value={encounterId || "none"} onValueChange={(value) => setEncounterId(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona episodio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin episodio asociado</SelectItem>
                      {patientEncounters.map((encounter) => (
                        <SelectItem key={encounter.id} value={encounter.id}>
                          {encounter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={() => void handleCreateQuickEncounter()} disabled={!patientId || createEncounter.isPending}>
                    Crear
                  </Button>
                </div>
              </Field>
              <Field label="Fecha de medición">
                <Input type="date" value={measuredAt} onChange={(event) => setMeasuredAt(event.target.value)} />
              </Field>
              <Field label="Fecha de nacimiento">
                <Input value={selectedPatient?.birthDate ?? ""} disabled placeholder="Se toma desde la ficha del paciente" />
              </Field>
              <Field label="Sexo de referencia">
                <Select value={sex} onValueChange={(value) => setSex(value as CcorpSex)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Edad decimal">
                <Input value={preview.ageDecimal ?? ""} disabled />
              </Field>
            </div>
          </div>

          {(["basic", "diameter", "girth", "skinfold"] as const).map((category) => (
            <MeasurementSection
              key={category}
              title={CATEGORY_LABELS[category]}
              variables={CCORP_LEVEL1_VARIABLES.filter((variable) => variable.category === category)}
              measurements={measurements}
              medians={preview.medians}
              onChange={updateSeries}
            />
          ))}
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <h3 className="text-[15px] font-medium">Vista previa</h3>
            </div>
            <div className="grid gap-2">
              <PreviewMetric label="IMC" value={preview.bmi} />
              <PreviewMetric label="ICC" value={preview.waistHipRatio} />
              <PreviewMetric label="% graso D&W" value={preview.durninBodyFatPercent} suffix="%" />
              <PreviewMetric label="Masa grasa" value={preview.durninFatMassKg} suffix="kg" />
              <PreviewMetric label="Masa magra" value={preview.durninFatFreeMassKg} suffix="kg" />
              <PreviewMetric label="Somatotipo" value={formatSomatotype(preview.endomorphy, preview.mesomorphy, preview.ectomorphy)} />
            </div>
          </div>

          <div className="panel p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Objetivos de peso ideal</div>
            <div className="mt-4 grid gap-3">
              <Field label="Objetivo % graso D&W">
                <Input type="number" value={targets.durninBodyFat} onChange={(event) => setTargets({ ...targets, durninBodyFat: Number(event.target.value) })} />
              </Field>
              <Field label="Objetivo FFMI D&W">
                <Input type="number" value={targets.durninFfmi} onChange={(event) => setTargets({ ...targets, durninFfmi: Number(event.target.value) })} />
              </Field>
              <Field label="Objetivo % graso Withers">
                <Input type="number" value={targets.withersBodyFat} onChange={(event) => setTargets({ ...targets, withersBodyFat: Number(event.target.value) })} />
              </Field>
              <Field label="Objetivo FFMI Withers">
                <Input type="number" value={targets.withersFfmi} onChange={(event) => setTargets({ ...targets, withersFfmi: Number(event.target.value) })} />
              </Field>
            </div>
          </div>

          <div className="panel p-5">
            <Field label="Observaciones">
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
            </Field>
            {formError && (
              <div className="mt-4 rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                {formError}
              </div>
            )}
            <Button className="mt-4 w-full" onClick={() => void handleSave()} disabled={createAssessment.isPending}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {createAssessment.isPending ? "Guardando..." : "Guardar evaluación"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MeasurementSection({
  title,
  variables,
  measurements,
  medians,
  onChange,
}: {
  title: string;
  variables: typeof CCORP_LEVEL1_VARIABLES;
  measurements: MeasurementState;
  medians: Record<string, number | null>;
  onChange: (variableCode: CcorpVariableCode, index: number, rawValue: string) => void;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-[15px] font-medium">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <th className="min-w-[230px] px-4 py-2.5 text-left font-normal">Variable</th>
              {[1, 2, 3, 4, 5].map((index) => (
                <th key={index} className="w-[110px] px-2 py-2.5 text-left font-normal">Serie {index}</th>
              ))}
              <th className="w-[110px] px-4 py-2.5 text-left font-normal">Mediana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {variables.map((variable) => (
              <tr key={variable.code}>
                <td className="px-4 py-3">
                  <div className="font-medium">{variable.label}</div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">{variable.unit}</div>
                </td>
                {[0, 1, 2, 3, 4].map((index) => (
                  <td key={index} className="px-2 py-3">
                    <Input
                      type="number"
                      step="0.1"
                        value={measurements[variable.code]?.[index] ?? ""}
                      onChange={(event) => onChange(variable.code, index, event.target.value)}
                      className="h-8 text-right font-mono"
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-[12px] font-mono text-primary">
                  {medians[variable.code] ?? "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PreviewMetric({ label, value, suffix }: { label: string; value: string | number | null; suffix: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-[13px] text-foreground">
        {typeof value === "number" ? `${value.toFixed(2)}${suffix ? ` ${suffix}` : ""}` : value ?? "--"}
      </div>
    </div>
  );
}

function formatSomatotype(endo: number | null, meso: number | null, ecto: number | null) {
  return endo === null || meso === null || ecto === null ? "--" : `${endo.toFixed(1)} - ${meso.toFixed(1)} - ${ecto.toFixed(1)}`;
}
