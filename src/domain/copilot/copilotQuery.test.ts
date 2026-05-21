import { describe, expect, it } from "vitest";
import type { CopilotQueryContext } from "@/domain/copilot/copilotQuery";
import { answerCopilotQuery } from "@/domain/copilot/copilotQuery";

const context: CopilotQueryContext = {
  patientName: "Paciente Uno",
  priorities: [
    { patientId: "patient-1", patientName: "Paciente Uno", severity: "high", score: 9, reasons: ["Alerta activa"], href: "/app/patients/patient-1" },
  ],
  findings: [
    {
      id: "alert-1",
      type: "active_alert",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      title: "Alerta activa",
      description: "Alerta registrada",
      severity: "high",
      module: "alerts",
      source: "alerts",
      actionLabel: "Revisar alerta",
      href: "/app/alerts",
    },
    {
      id: "lab-1",
      type: "critical_lab",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      title: "Laboratorio critico",
      description: "Marcador fuera de rango",
      severity: "critical",
      module: "labs",
      source: "lab_results",
      actionLabel: "Abrir laboratorios",
      href: "/app/labs",
    },
  ],
  tasks: [
    {
      id: "task-alert-1",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      type: "alert_review",
      module: "alerts",
      severity: "high",
      title: "Alerta activa",
      description: "Alerta registrada",
      source: "alerts",
      actionHref: "/app/alerts",
      actionLabel: "Revisar alerta",
      status: "open",
    },
    {
      id: "task-plan-1",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      type: "plan_missing",
      module: "plans",
      severity: "moderate",
      title: "Plan nutricional no activo",
      description: "No hay plan activo",
      source: "nutrition_plans",
      actionHref: "/app/plans",
      actionLabel: "Revisar planes",
      status: "open",
    },
    {
      id: "task-enteral-1",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      type: "enteral_tolerance",
      module: "enteral",
      severity: "high",
      title: "Riesgo enteral",
      description: "Baja entrega registrada",
      source: "enteral_daily_logs",
      actionHref: "/app/pack/enteral/cockpit",
      actionLabel: "Abrir soporte enteral",
      status: "open",
    },
    {
      id: "task-parenteral-1",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      type: "parenteral_monitoring",
      module: "parenteral",
      severity: "moderate",
      title: "Soporte parenteral activo",
      description: "Monitoreo pendiente",
      source: "parenteral_plans",
      actionHref: "/app/pack/parenteral",
      actionLabel: "Abrir soporte parenteral",
      status: "open",
    },
    {
      id: "task-pediatric-1",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      type: "pediatric_reference_incomplete",
      module: "pediatric",
      severity: "moderate",
      title: "Referencia pediatrica incompleta",
      description: "Sin referencias oficiales completas",
      source: "growth_reference_points",
      actionHref: "/app/pediatric-curves",
      actionLabel: "Abrir pediatria",
      status: "open",
    },
    {
      id: "task-sports-1",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      type: "sports_data_insufficient",
      module: "sports",
      severity: "moderate",
      title: "Datos deportivos insuficientes",
      description: "Faltan componentes",
      source: "sports_bodycomp_snapshots",
      actionHref: "/app/somatocarta",
      actionLabel: "Abrir somatocarta",
      status: "open",
    },
  ],
  timeline: [
    {
      id: "event-lab-1",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      type: "lab",
      module: "labs",
      severity: "critical",
      title: "Laboratorio critico",
      description: "Marcador fuera de rango",
      source: "lab_results",
      href: "/app/labs",
      occurredAt: "2026-05-13T10:00:00.000Z",
    },
  ],
  missingData: [
    {
      id: "missing-plan-1",
      type: "missing_plan",
      patientId: "patient-1",
      patientName: "Paciente Uno",
      title: "Plan nutricional no activo",
      description: "No hay plan activo",
      severity: "moderate",
      module: "plans",
      source: "nutrition_plans",
      actionLabel: "Revisar planes",
      href: "/app/plans",
    },
  ],
  risks: [],
};

describe("answerCopilotQuery", () => {
  it("responde alertas desde hallazgos visibles", () => {
    expect(answerCopilotQuery("alertas", context)).toContain("Alerta activa");
  });

  it("responde laboratorios sin diagnosticar", () => {
    const answer = answerCopilotQuery("laboratorios", context);
    expect(answer).toContain("Laboratorio critico");
    expect(answer.toLowerCase()).not.toContain("diagnostico probable");
  });

  it("responde pendientes desde tareas", () => {
    expect(answerCopilotQuery("pendientes", context)).toContain("Plan nutricional no activo");
  });

  it("responde resumen sin convertirlo en diagnostico probable", () => {
    const answer = answerCopilotQuery("resumen", context).toLowerCase();
    expect(answer).toContain("prioridad");
    expect(answer).not.toContain("diagnostico probable");
  });

  it("responde soporte nutricional por modulo registrado", () => {
    expect(answerCopilotQuery("enteral", context)).toContain("Riesgo enteral");
    expect(answerCopilotQuery("parenteral", context)).toContain("Soporte parenteral activo");
  });

  it("responde pediatria y deporte desde datos faltantes", () => {
    expect(answerCopilotQuery("pediatria", context)).toContain("Referencia pediatrica incompleta");
    expect(answerCopilotQuery("deportivo", context)).toContain("Datos deportivos insuficientes");
  });

  it("responde pregunta vacia con ayuda controlada", () => {
    expect(answerCopilotQuery("   ", context)).toContain("Escribe una pregunta");
  });

  it("responde timeline operativo desde eventos visibles", () => {
    expect(answerCopilotQuery("timeline", context)).toContain("Laboratorio critico");
  });

  it("usa fallback controlado para preguntas no soportadas", () => {
    expect(answerCopilotQuery("que dosis uso", context)).toContain("IA generativa pendiente");
  });

  it("no responde claims prohibidos aunque se pidan explicitamente", () => {
    const questions = ["diagnostico probable", "recomiendo dosis", "tratamiento indicado"];

    for (const question of questions) {
      const answer = answerCopilotQuery(question, context).toLowerCase();
      expect(answer).toContain("ia generativa pendiente");
      expect(answer).not.toContain("recomiendo dosis");
      expect(answer).not.toContain("tratamiento indicado");
      expect(answer).not.toContain("diagnostico probable");
    }
  });
});
