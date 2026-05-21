import { useEffect, useMemo, useState } from "react";
import { Activity, ClipboardList, Ruler, Save, ShieldAlert, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PackPill } from "@/components/common/PackPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { CLINICAL_ASSESSMENT_SECTIONS } from "@/domain/clinical/assessmentSchema";
import { useSaveClinicalAssessment, useTenantEncounters, useTenantPatients } from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";

const evaluationBlocks = [
  {
    icon: ShieldAlert,
    title: "Screening nutricional",
    description: "Riesgo, pérdida ponderal, ingesta, sarcopenia y banderas rojas.",
  },
  {
    icon: Ruler,
    title: "Antropometría avanzada",
    description: "Peso, talla, pliegues, perímetros, calidad y fórmula versionada.",
  },
  {
    icon: Stethoscope,
    title: "Evaluación clínica",
    description: "Historia alimentaria, signos físicos, síntomas GI, laboratorios y diagnóstico estructurado.",
  },
  {
    icon: Activity,
    title: "Plan y evolución",
    description: "Objetivos SMART, conducta, seguimiento y tareas clínicas.",
  },
];

export default function NewEvaluation() {
  const navigate = useNavigate();
  const { activeTenant, activeTenantId } = useTenantRuntime();
  const { data: patientResult } = useTenantPatients();
  const { data: encounterResult } = useTenantEncounters();
  const saveAssessment = useSaveClinicalAssessment();
  const patients = useMemo(() => patientResult?.data ?? [], [patientResult?.data]);
  const encounters = useMemo(() => encounterResult?.data ?? [], [encounterResult?.data]);
  const [patientId, setPatientId] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [focus, setFocus] = useState("Reevaluación nutricional, tolerancia y priorización de alertas activas.");
  const [diagnosisProblem, setDiagnosisProblem] = useState("");
  const [conduct, setConduct] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId && patients[0]?.id) {
      setPatientId(patients[0].id);
    }
  }, [patientId, patients]);

  const patient = useMemo(() => patients.find((item) => item.id === patientId) ?? patients[0] ?? null, [patientId, patients]);
  const patientEncounters = useMemo(
    () => (patient ? encounters.filter((encounter) => encounter.patientId === patient.id && encounter.status === "open") : []),
    [encounters, patient],
  );

  useEffect(() => {
    if (patientEncounters.length > 0 && !patientEncounters.some((encounter) => encounter.id === encounterId)) {
      setEncounterId(patientEncounters[0].id);
      return;
    }

    if (patientEncounters.length === 0 && encounterId) {
      setEncounterId("");
    }
  }, [encounterId, patientEncounters]);

  async function handleSaveDraft() {
    setFormError(null);

    if (!activeTenantId || !patient) {
      setFormError("Selecciona un tenant y un paciente antes de guardar la evaluación.");
      return;
    }

    if (!focus.trim()) {
      setFormError("El motivo o foco clínico es obligatorio.");
      return;
    }

    try {
      await saveAssessment.mutateAsync({
        tenantId: activeTenantId,
        patientId: patient.id,
        encounterId: encounterId || null,
        sections: CLINICAL_ASSESSMENT_SECTIONS.map((section) => ({
          id: section.id,
          title: section.title,
          fields: section.fields.map((field) => ({ id: field.id, label: field.label, value: null })),
        })),
        diagnosisProblem: diagnosisProblem.trim() || patient.diagnosisSummary,
        conduct: conduct.trim() || focus.trim(),
        nextFollowUpAt: nextFollowUpAt || null,
        noteTitle: "Evaluación clínica nutricional",
        noteBody: conduct.trim() || focus.trim(),
      });

      navigate(`/app/patients/${patient.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la evaluación clínica.");
    }
  }

  function handleClose() {
    navigate("/app");
  }

  return (
    <div className="min-h-screen bg-background/80">
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[1180px] overflow-y-auto p-0 sm:max-w-[1180px]">
          <div className="border-b border-border px-6 py-5">
            <SheetHeader>
              <SheetTitle>Nueva evaluación</SheetTitle>
              <SheetDescription>
                Formulario clínico real con paciente, episodio, diagnóstico, conducta y próximo control.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="grid gap-3 p-6 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-3">
              <div className="panel p-5">
                <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Paciente seleccionado
                </div>
                <Field label="Paciente">
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <h2 className="mt-4 text-xl font-semibold">{patient?.fullName ?? "Seleccionar paciente"}</h2>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  {patient?.mrn ?? "MRN"} - {patient?.location ?? activeTenant?.name ?? "Tenant activo"}
                </div>
                {patient && (
                  <div className="mt-4">
                    <PackPill pack={patient?.primaryPack ?? "clinical"} />
                  </div>
                )}
              </div>

              <div className="panel p-5">
                <div className="mb-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Bloques de evaluación
                </div>
                <div className="space-y-2">
                  {evaluationBlocks.map((block, index) => (
                    <div key={block.title} className="flex gap-3 rounded-md bg-surface-raised/50 px-3 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                        <block.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">0{index + 1}</span>
                          <span className="text-[13px] font-medium">{block.title}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{block.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel p-5">
              <div className="mb-5 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <h3 className="text-[15px] font-medium">Datos clínicos de la evaluación</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Episodio activo">
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
                </Field>
                <Field label="Próximo control">
                  <Input type="date" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} />
                </Field>
                <div className="space-y-2 md:col-span-2">
                  <Label>Motivo / foco clínico</Label>
                  <Textarea value={focus} onChange={(event) => setFocus(event.target.value)} className="min-h-24" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Diagnóstico nutricional inicial</Label>
                  <Textarea
                    value={diagnosisProblem}
                    onChange={(event) => setDiagnosisProblem(event.target.value)}
                    placeholder={patient?.diagnosisSummary ?? "Problema nutricional principal"}
                    className="min-h-24"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Conducta / recomendación</Label>
                  <Textarea value={conduct} onChange={(event) => setConduct(event.target.value)} className="min-h-28" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Evaluación clínica configurable
                  </div>
                  <h3 className="mt-0.5 text-[15px] font-medium">Secciones activas por pack</h3>
                </div>
                {CLINICAL_ASSESSMENT_SECTIONS.map((section) => (
                  <div key={section.id} className="rounded-lg border border-border bg-background/60 p-4">
                    <div className="mb-3 text-[13px] font-medium">{section.title}</div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {section.fields.map((field) => (
                        <div key={field.id} className="rounded-md bg-surface-raised/50 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[12px]">{field.label}</span>
                            <span className="text-[9px] font-mono uppercase text-muted-foreground">{field.type}</span>
                          </div>
                          <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                            {field.required ? "obligatorio" : "opcional"}
                            {field.packIds ? ` - ${field.packIds.join(", ")}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {(formError || saveAssessment.isError) && (
                  <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                    {formError ??
                      (saveAssessment.error instanceof Error
                        ? saveAssessment.error.message
                        : "No se pudo guardar la evaluación clínica.")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border px-6 py-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="border-0 text-primary-foreground gradient-primary"
              onClick={() => void handleSaveDraft()}
              disabled={saveAssessment.isPending}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saveAssessment.isPending ? "Guardando..." : "Guardar evaluación"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
