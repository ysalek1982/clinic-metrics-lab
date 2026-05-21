import { describe, expect, it } from "vitest";
import { previewReport, type ReportDataBundle } from "./reportService";

const patient = {
  id: "patient-1",
  tenant_id: "tenant-1",
  mrn: "QA-001",
  first_name: "Paciente",
  last_name: "Deportivo",
  birth_date: null,
  sex: "male",
  status: "active",
  risk_level: "low",
  diagnosis_summary: null,
  location_label: null,
  next_follow_up_at: null,
  created_at: "2026-05-01T00:00:00.000Z",
};

function bundle(overrides: Partial<ReportDataBundle> = {}): ReportDataBundle {
  return {
    patients: [patient],
    encounters: [],
    assessments: [],
    plans: [],
    labOrders: [],
    labResults: [],
    alertAcknowledgements: [],
    appointments: [],
    messageThreads: [],
    messages: [],
    foodItems: [],
    recipes: [],
    weeklyMenus: [],
    weeklyMenuItems: [],
    ccorpAssessments: [],
    ccorpResults: [],
    sportsProfiles: [],
    sportsBodycompSnapshots: [],
    warnings: [],
    ...overrides,
  } as ReportDataBundle;
}

describe("reportService previewReport", () => {
  it("genera reporte deportivo con datos insuficientes sin inventar somatotipo", () => {
    const preview = previewReport(
      bundle({
        sportsProfiles: [
          {
            id: "profile-1",
            tenant_id: "tenant-1",
            patient_id: "patient-1",
            discipline: "Running",
            category: "Recreativo",
            position: null,
            objective: "Control local",
            created_at: "2026-05-01T00:00:00.000Z",
          },
        ],
      } as Partial<ReportDataBundle>),
      "sports_performance",
      { period: "all", patientId: "patient-1" },
    );

    expect(preview.availability.status).toBe("available");
    expect(preview.sections.some((section) => section.title === "Datos insuficientes")).toBe(true);
    expect(preview.tables.find((table) => table.title === "Somatocarta")?.rows).toHaveLength(0);
  });

  it("incluye somatotipo y punto de somatocarta cuando hay componentes reales", () => {
    const preview = previewReport(
      bundle({
        sportsProfiles: [
          {
            id: "profile-1",
            tenant_id: "tenant-1",
            patient_id: "patient-1",
            discipline: "Ciclismo",
            category: "Competitivo",
            position: null,
            objective: "Rendimiento",
            created_at: "2026-05-01T00:00:00.000Z",
          },
        ],
        sportsBodycompSnapshots: [
          {
            id: "snapshot-1",
            tenant_id: "tenant-1",
            patient_id: "patient-1",
            endomorphy: 3.1,
            mesomorphy: 4.2,
            ectomorphy: 2.4,
            fat_pct: 14.5,
            lean_mass_kg: 58,
            skeletal_muscle_kg: 31,
            notes: "Fixture local sin datos reales",
            measured_at: "2026-05-08T00:00:00.000Z",
            created_at: "2026-05-08T00:00:00.000Z",
          },
        ],
      } as Partial<ReportDataBundle>),
      "sports_performance",
      { period: "all", patientId: "patient-1" },
    );

    expect(preview.metrics.find((metric) => metric.label === "Somatotipos listos")?.value).toBe("1");
    expect(preview.sections.some((section) => section.title === "Datos insuficientes")).toBe(false);
    expect(preview.tables.find((table) => table.title === "Somatocarta")?.rows).toHaveLength(1);
  });
});
