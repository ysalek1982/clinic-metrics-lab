import { describe, expect, it } from "vitest";
import { createReportPreviewExcelArtifact, createReportPreviewPdfArtifact, createWorkbookArtifact } from "./exportArtifacts";
import type { ReportPreview } from "@/services/reportService";

const preview: ReportPreview = {
  reportType: "executive",
  title: "Reporte ejecutivo QA",
  category: "INSTITUCIONAL",
  generatedAt: "2026-05-11T12:00:00.000Z",
  periodLabel: "Últimos 30 días",
  patientLabel: null,
  filters: { period: "last_30_days", patientId: null },
  availability: { status: "available", label: "Disponible", reason: "Fixture local" },
  metrics: [{ label: "Pacientes", value: "2", detail: "Activos", tone: "cyan" }],
  sections: [{ title: "Resumen", items: ["Datos de prueba sin información clínica real"] }],
  tables: [{ title: "Detalle", columns: ["Campo", "Valor"], rows: [["Estado", "OK"]], emptyText: "Sin datos" }],
  warnings: [],
};

describe("exportArtifacts", () => {
  it("genera workbook real incluso con hojas vacias", async () => {
    const artifact = await createWorkbookArtifact("qa-vacio", []);

    expect(artifact.filename).toBe("qa-vacio.xlsx");
    expect(artifact.blob.size).toBeGreaterThan(0);
    expect(artifact.blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });

  it("genera PDF de preview con contenido no vacio", () => {
    const artifact = createReportPreviewPdfArtifact(preview);

    expect(artifact.filename).toBe("reporte-ejecutivo-qa.pdf");
    expect(artifact.blob.size).toBeGreaterThan(0);
    expect(artifact.blob.type).toBe("application/pdf");
  });

  it("genera Excel de preview con metricas y tablas", async () => {
    const artifact = await createReportPreviewExcelArtifact(preview);

    expect(artifact.filename).toMatch(/^reporte-executive-/);
    expect(artifact.blob.size).toBeGreaterThan(0);
  });

  it("genera PDF aunque el preview no tenga secciones ni tablas", () => {
    const artifact = createReportPreviewPdfArtifact({
      ...preview,
      title: "Reporte vacío local",
      metrics: [],
      sections: [],
      tables: [],
      warnings: [],
    });

    expect(artifact.filename).toBe("reporte-vacio-local.pdf");
    expect(artifact.blob.size).toBeGreaterThan(0);
  });

  it("genera workbook con filas vacias y nombre seguro con caracteres españoles", async () => {
    const artifact = await createWorkbookArtifact("Menú clínico Ñandú", [{ name: "Vacía", rows: [] }]);

    expect(artifact.filename).toBe("menu-clinico-nandu.xlsx");
    expect(artifact.blob.size).toBeGreaterThan(0);
  });
});
