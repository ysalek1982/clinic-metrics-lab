import { describe, expect, it } from "vitest";
import { buildCopilotRules, type BuildCopilotRulesInput } from "./copilotRules";

const basePatient = {
  id: "patient-1",
  fullName: "Paciente Uno",
  risk: "moderate" as const,
  diagnosisSummary: "Seguimiento nutricional",
  location: "Consulta",
  activePacks: ["clinical"],
  nextFollowUpAt: null,
};

function baseInput(overrides: Partial<BuildCopilotRulesInput> = {}): BuildCopilotRulesInput {
  return {
    patients: [basePatient],
    alerts: [],
    labs: [],
    plans: [{ patientId: "patient-1", status: "active" }],
    appointments: [],
    enteralPlans: [],
    parenteralPlans: [],
    sportsProfiles: [],
    sportsSnapshots: [],
    reports: [],
    pediatricReferenceComplete: true,
    now: new Date("2026-05-11T12:00:00.000Z"),
    ...overrides,
  };
}

describe("copilotRules", () => {
  it("devuelve pendiente de plan para paciente sin plan activo", () => {
    const result = buildCopilotRules(baseInput({ plans: [] }));

    expect(result.missingData.some((finding) => finding.title === "Plan nutricional no activo")).toBe(true);
    expect(result.priorities[0].reasons).toContain("Sin plan activo");
    expect(result.missingData.find((finding) => finding.type === "missing_plan")?.source).toBe("nutrition_plans");
  });

  it("prioriza paciente con alerta activa", () => {
    const result = buildCopilotRules(
      baseInput({
        alerts: [
          {
            id: "alert-1",
            patientId: "patient-1",
            severity: "critical",
            status: "active",
            message: "Alerta activa real",
          },
        ],
      }),
    );

    expect(result.risks[0].title).toBe("Alerta activa");
    expect(result.risks[0].actionLabel).toBe("Revisar alerta");
    expect(result.priorities[0].severity).toBe("critical");
  });

  it("detecta laboratorio crítico sin interpretar diagnóstico", () => {
    const result = buildCopilotRules(baseInput({ labs: [{ patientId: "patient-1", status: "critical", outsideCount: 1 }] }));

    expect(result.operationalFindings.find((finding) => finding.module === "labs")?.type).toBe("critical_lab");
    expect(result.priorities[0].severity).toBe("critical");
  });

  it("detecta laboratorio fuera de rango sin interpretar diagnóstico", () => {
    const result = buildCopilotRules(baseInput({ labs: [{ patientId: "patient-1", status: "out_of_range", outsideCount: 2 }] }));

    expect(result.operationalFindings.some((finding) => finding.module === "labs")).toBe(true);
    expect(result.operationalFindings.find((finding) => finding.module === "labs")?.description).toContain("2 marcador");
  });

  it("marca seguimiento próximo con cita programada", () => {
    const result = buildCopilotRules(
      baseInput({
        appointments: [
          {
            patientId: "patient-1",
            status: "scheduled",
            startsAt: "2026-05-12T12:00:00.000Z",
            appointmentType: "consulta",
          },
        ],
      }),
    );

    expect(result.suggestedActions.some((finding) => finding.type === "upcoming_appointment")).toBe(true);
  });

  it("marca seguimiento vencido con cita programada en el pasado", () => {
    const result = buildCopilotRules(
      baseInput({
        appointments: [
          {
            patientId: "patient-1",
            status: "scheduled",
            startsAt: "2026-05-10T12:00:00.000Z",
            appointmentType: "consulta",
          },
        ],
      }),
    );

    expect(result.operationalFindings.some((finding) => finding.type === "overdue_follow_up")).toBe(true);
  });

  it("expone referencia pediátrica incompleta sin calcular z-score", () => {
    const result = buildCopilotRules(
      baseInput({
        patients: [{ ...basePatient, activePacks: ["pediatric"] }],
        pediatricReferenceComplete: false,
      }),
    );

    expect(result.missingData.some((finding) => finding.title === "Referencia pediátrica incompleta")).toBe(true);
    expect(result.missingData.find((finding) => finding.type === "pediatric_reference_incomplete")?.description).toContain("No se calcula z-score");
  });

  it("detecta mala tolerancia enteral desde datos del plan", () => {
    const result = buildCopilotRules(
      baseInput({
        enteralPlans: [{ patientId: "patient-1", status: "active", toleranceStatus: "poor", volumeDeliveredPct: 55 }],
      }),
    );

    expect(result.risks.some((finding) => finding.module === "enteral")).toBe(true);
  });

  it("detecta riesgo enteral por entrega menor al 80 por ciento", () => {
    const result = buildCopilotRules(
      baseInput({
        enteralPlans: [{ patientId: "patient-1", status: "active", toleranceStatus: "stable", volumeDeliveredPct: 72 }],
      }),
    );

    expect(result.tasks.some((task) => task.type === "enteral_tolerance" && task.severity === "high")).toBe(true);
  });

  it("detecta soporte parenteral activo sin prometer parenteral avanzado", () => {
    const result = buildCopilotRules(
      baseInput({
        parenteralPlans: [{ patientId: "patient-1", status: "active", latestLogAt: null }],
      }),
    );

    expect(result.operationalFindings.find((finding) => finding.module === "parenteral")?.title).toBe("Soporte parenteral activo");
    expect(result.operationalFindings.find((finding) => finding.module === "parenteral")?.description).toContain("sin monitoreo reciente");
  });

  it("marca datos deportivos insuficientes para somatotipo", () => {
    const result = buildCopilotRules(
      baseInput({
        patients: [{ ...basePatient, activePacks: ["sports"] }],
        sportsProfiles: [{ patientId: "patient-1", discipline: "Fútbol" }],
        sportsSnapshots: [{ patientId: "patient-1", endomorphy: 3, mesomorphy: null, ectomorphy: 2 }],
      }),
    );

    expect(result.missingData.some((finding) => finding.type === "sports_insufficient_data")).toBe(true);
    expect(result.missingData.find((finding) => finding.type === "sports_insufficient_data")?.description).toContain("No se calcula somatotipo");
  });

  it("ordena prioridades por severidad y puntaje combinado", () => {
    const result = buildCopilotRules(
      baseInput({
        patients: [basePatient, { ...basePatient, id: "patient-2", fullName: "Paciente Dos", risk: "low" }],
        alerts: [{ id: "alert-2", patientId: "patient-2", severity: "critical", status: "active", message: "Alerta crítica" }],
        labs: [{ patientId: "patient-1", status: "out_of_range", outsideCount: 2 }],
      }),
    );

    expect(result.priorities[0].patientId).toBe("patient-2");
    expect(result.priorities[0].severity).toBe("critical");
  });

  it("mantiene datos insuficientes como estado operacional", () => {
    const result = buildCopilotRules(baseInput({ patients: [], plans: [] }));

    expect(result.priorities).toEqual([]);
    expect(result.patientSummaries).toEqual([]);
  });

  it("no inventa hallazgos para paciente con plan activo y seguimiento futuro", () => {
    const result = buildCopilotRules(
      baseInput({
        patients: [{ ...basePatient, risk: "low", nextFollowUpAt: "2026-05-20T12:00:00.000Z" }],
        plans: [{ patientId: "patient-1", status: "active" }],
      }),
    );

    expect(result.operationalFindings).toEqual([]);
    expect(result.missingData).toEqual([]);
    expect(result.risks).toEqual([]);
    expect(result.tasks).toEqual([]);
  });

  it("expone reporte reciente como accion informativa sin asociarlo a diagnostico", () => {
    const result = buildCopilotRules(
      baseInput({
        reports: [
          {
            id: "report-1",
            reportType: "sports_performance_report",
            status: "completed",
            createdAt: "2026-05-13T09:00:00.000Z",
          },
        ],
      }),
    );

    const reportTask = result.tasks.find((task) => task.type === "report_available");
    expect(reportTask?.status).toBe("informational");
    expect(result.suggestedActions.find((finding) => finding.type === "recent_report")?.href).toBe("/app/reports");
  });

  it("deriva tareas operativas desde alertas activas", () => {
    const result = buildCopilotRules(
      baseInput({
        alerts: [
          {
            id: "alert-task",
            patientId: "patient-1",
            severity: "high",
            status: "active",
            message: "Revisar alerta registrada",
            createdAt: "2026-05-11T09:00:00.000Z",
          },
        ],
      }),
    );

    expect(result.tasks.some((task) => task.type === "alert_review" && task.actionHref === "/app/alerts?patient=patient-1")).toBe(true);
    expect(result.timeline.some((event) => event.type === "alert" && event.occurredAt === "2026-05-11T09:00:00.000Z")).toBe(true);
  });

  it("marca tareas vencidas cuando la fecha operativa ya paso", () => {
    const result = buildCopilotRules(
      baseInput({
        appointments: [
          {
            patientId: "patient-1",
            status: "scheduled",
            startsAt: "2026-05-10T12:00:00.000Z",
            appointmentType: "consulta",
          },
        ],
      }),
    );

    expect(result.tasks.find((task) => task.type === "appointment_followup")?.status).toBe("overdue");
  });

  it("ordena tareas por estado y severidad", () => {
    const result = buildCopilotRules(
      baseInput({
        alerts: [{ id: "alert-low", patientId: "patient-1", severity: "low", status: "active", message: "Alerta baja" }],
        labs: [{ patientId: "patient-1", status: "critical", outsideCount: 1 }],
        appointments: [
          {
            patientId: "patient-1",
            status: "scheduled",
            startsAt: "2026-05-10T12:00:00.000Z",
            appointmentType: "consulta",
          },
        ],
      }),
    );

    expect(result.tasks[0].status).toBe("overdue");
    expect(result.tasks.some((task) => task.type === "lab_review" && task.severity === "critical")).toBe(true);
  });

  it("no emite claims medicos prohibidos en titulos ni descripciones", () => {
    const result = buildCopilotRules(
      baseInput({
        alerts: [{ id: "alert-safe", patientId: "patient-1", severity: "high", status: "active", message: "Revisar registro" }],
        labs: [{ patientId: "patient-1", status: "critical", outsideCount: 1 }],
        enteralPlans: [{ patientId: "patient-1", status: "active", toleranceStatus: "poor", volumeDeliveredPct: 40 }],
      }),
    );

    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain("diagnostico probable");
    expect(serialized).not.toContain("recomiendo dosis");
    expect(serialized).not.toContain("tratamiento indicado");
    expect(serialized).not.toContain("debe administrarse");
  });
});
