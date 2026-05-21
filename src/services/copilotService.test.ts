import { describe, expect, it } from "vitest";
import type { BuildCopilotRulesInput } from "@/domain/copilot/copilotRules";
import { composeCopilotContext } from "@/services/copilotService";

function baseInput(overrides: Partial<BuildCopilotRulesInput> = {}): BuildCopilotRulesInput {
  return {
    patients: [
      { id: "patient-1", fullName: "Paciente Uno", risk: "moderate", activePacks: ["clinical"] },
      { id: "patient-2", fullName: "Paciente Dos", risk: "low", activePacks: ["sport"] },
    ],
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
    now: new Date("2026-05-13T12:00:00.000Z"),
    ...overrides,
  };
}

describe("composeCopilotContext", () => {
  it("handles empty tenant data with stable arrays and no selected context", () => {
    const context = composeCopilotContext(baseInput({ patients: [], plans: [] }));

    expect(context.overview.patientCount).toBe(0);
    expect(context.priorities).toEqual([]);
    expect(context.patientSummaries).toEqual([]);
    expect(context.selectedPatientContext).toBeNull();
    expect(context.isEmpty).toBe(true);
  });

  it("returns a stable contextual shape with default arrays and quick links", () => {
    const context = composeCopilotContext(baseInput());

    expect(context.source).toBe("supabase");
    expect(context.overview.patientCount).toBe(2);
    expect(context.overview.priorityCount).toBe(context.priorities.length);
    expect(context.quickLinks.length).toBeGreaterThan(0);
    expect(context.operationalFindings).toEqual(expect.any(Array));
    expect(context.suggestedActions).toEqual(expect.any(Array));
    expect(context.missingData).toEqual(expect.any(Array));
    expect(context.risks).toEqual(expect.any(Array));
  });

  it("keeps selected patient context even when the patient has no active signals", () => {
    const context = composeCopilotContext(
      baseInput({
        patients: [{ id: "patient-1", fullName: "Paciente Uno", risk: "low", activePacks: ["clinical"], nextFollowUpAt: "2026-05-20" }],
        plans: [{ patientId: "patient-1", status: "active" }],
        appointments: [],
      }),
      "patient-1",
    );

    expect(context.selectedPatientContext?.patientId).toBe("patient-1");
    expect(context.selectedPatientContext?.patientName).toBe("Paciente Uno");
    expect(context.selectedPatientContext?.hasSignals).toBe(false);
  });

  it("marks coming-soon quick links without turning them into active actions", () => {
    const context = composeCopilotContext(baseInput());
    const noteAction = context.quickLinks.find((link) => link.id === "create-note");
    const appointmentAction = context.quickLinks.find((link) => link.id === "create-appointment");
    const reportsAction = context.quickLinks.find((link) => link.id === "generate-report");

    expect(noteAction?.status).toBe("coming_soon");
    expect(appointmentAction?.status).toBe("coming_soon");
    expect(reportsAction?.requiredPermission).toBe("reports.export");
  });

  it("summarizes tasks and today attention without unstable shapes", () => {
    const context = composeCopilotContext(
      baseInput({
        alerts: [{ id: "alert-1", patientId: "patient-1", severity: "high", status: "active", message: "Alerta activa" }],
        labs: [{ patientId: "patient-1", status: "critical", outsideCount: 1 }],
        appointments: [
          {
            patientId: "patient-1",
            status: "scheduled",
            startsAt: "2026-05-12T12:00:00.000Z",
            appointmentType: "consulta",
          },
        ],
      }),
      "patient-1",
    );

    expect(context.taskSummary.total).toBeGreaterThan(0);
    expect(context.taskSummary.overdue).toBeGreaterThan(0);
    expect(context.todayAttention.length).toBeGreaterThan(0);
    expect(context.selectedPatientContext?.tasks).toEqual(expect.any(Array));
    expect(context.selectedPatientContext?.timeline).toEqual(expect.any(Array));
  });

  it("keeps recent reports informational and outside patient context when not patient-scoped", () => {
    const context = composeCopilotContext(
      baseInput({
        reports: [{ id: "report-1", reportType: "clinical_summary", status: "completed", createdAt: "2026-05-13T08:00:00.000Z" }],
      }),
      "patient-1",
    );

    expect(context.tasks.some((task) => task.type === "report_available" && task.status === "informational")).toBe(true);
    expect(context.selectedPatientContext?.tasks.some((task) => task.type === "report_available")).toBe(false);
  });
});
