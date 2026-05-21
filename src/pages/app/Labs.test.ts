import { describe, expect, it } from "vitest";
import type { LabPatientSummary } from "@/services/labService";
import { normalizeLabPatients } from "./labs-utils";

describe("normalizeLabPatients", () => {
  it("rellena valores seguros cuando el backend entrega campos incompletos", () => {
    const patients = normalizeLabPatients([
      {
        id: "",
        name: "",
        mrn: "",
        diagnosis: "",
        lastOrder: null,
        status: "pending",
        outsideCount: 0,
        markers: [
          {
            code: "",
            name: "",
            category: "",
            value: null,
            unit: "",
            delta: null,
            range: "",
            status: "pending",
            description: "",
            interpretation: "",
            recommendation: "",
            trend: [],
            resultedAt: null,
          },
        ],
      } satisfies LabPatientSummary,
    ]);

    expect(patients[0]).toMatchObject({
      id: "patient-0",
      name: "Paciente sin nombre",
      mrn: "MRN no registrado",
      diagnosis: "Sin diagnóstico registrado",
      outsideCount: 0,
    });
    expect(patients[0].markers[0]).toMatchObject({
      code: "marker-0",
      name: "Marcador sin nombre",
      category: "Sin categoría",
      range: "Sin rango",
      description: "Sin descripción registrada.",
      interpretation: "Sin interpretación registrada.",
      recommendation: "Sin acción registrada.",
      trend: [],
    });
  });
});
