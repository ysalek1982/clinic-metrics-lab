import { jsPDF } from "jspdf";
import type { ReportPreview } from "@/services/reportService";
import type { EnteralPlanSummary } from "@/services/specialtyService";
import type { WeeklyMenuSummary } from "@/services/weeklyMenuService";

type ExportCell = string | number | boolean | null;
type ExportRow = Record<string, ExportCell>;

type WorkbookSheet = {
  name: string;
  rows: ExportRow[];
};

export type ExportArtifact = {
  filename: string;
  blob: Blob;
};

export function downloadExportArtifact(artifact: ExportArtifact) {
  downloadBlob(artifact.blob, artifact.filename);
}

export async function createWorkbookArtifact(fileBaseName: string, sheets: WorkbookSheet[]): Promise<ExportArtifact> {
  const xlsx = await import("xlsx");
  const workbook = xlsx.utils.book_new();
  const safeSheets = sheets.length > 0 ? sheets : [{ name: "Datos", rows: [{ Estado: "Sin datos" }] }];

  for (const sheet of safeSheets) {
    const rows = sheet.rows.length > 0 ? sheet.rows : [{ Estado: "Sin datos" }];
    const worksheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheet.name));
  }

  const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "array", compression: true }) as ArrayBuffer;
  return {
    filename: `${safeFilename(fileBaseName)}.xlsx`,
    blob: new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  };
}

export async function exportWorkbook(fileBaseName: string, sheets: WorkbookSheet[]) {
  downloadExportArtifact(await createWorkbookArtifact(fileBaseName, sheets));
}

export function createReportPreviewPdfArtifact(preview: ReportPreview): ExportArtifact {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const writer = createPdfWriter(doc);

  writer.heading(preview.title);
  writer.line(`${preview.category} | ${preview.periodLabel} | ${preview.patientLabel ?? "Tenant completo"}`);
  writer.line(`Generado: ${formatDateTime(preview.generatedAt)}`);

  writer.subheading("Metricas");
  preview.metrics.forEach((metric) => writer.line(`${metric.label}: ${metric.value}${metric.detail ? ` (${metric.detail})` : ""}`));

  preview.sections.forEach((section) => {
    writer.subheading(section.title);
    section.items.forEach((item) => writer.line(`- ${item}`));
  });

  preview.tables.forEach((table) => {
    writer.subheading(table.title);
    if (table.rows.length === 0) {
      writer.line(table.emptyText);
      return;
    }
    writer.line(table.columns.join(" | "));
    table.rows.slice(0, 80).forEach((row) => writer.line(row.join(" | ")));
  });

  return {
    filename: `${safeFilename(preview.title)}.pdf`,
    blob: doc.output("blob"),
  };
}

export function exportReportPreviewToPdf(preview: ReportPreview) {
  downloadExportArtifact(createReportPreviewPdfArtifact(preview));
}

export async function createReportPreviewExcelArtifact(preview: ReportPreview): Promise<ExportArtifact> {
  return createWorkbookArtifact(`reporte-${preview.reportType}-${timestampLabel()}`, [
    {
      name: "Metricas",
      rows: preview.metrics.map((metric) => ({
        Metrica: metric.label,
        Valor: metric.value,
        Detalle: metric.detail ?? "",
        Tono: metric.tone ?? "",
      })),
    },
    {
      name: "Secciones",
      rows: preview.sections.flatMap((section) =>
        section.items.map((item) => ({
          Seccion: section.title,
          Item: item,
        })),
      ),
    },
    ...preview.tables.map((table) => ({
      name: table.title,
      rows: table.rows.map((row) =>
        Object.fromEntries(table.columns.map((column, index) => [column, row[index] ?? ""])) as ExportRow,
      ),
    })),
  ]);
}

export async function exportReportPreviewToExcel(preview: ReportPreview) {
  downloadExportArtifact(await createReportPreviewExcelArtifact(preview));
}

export async function exportWeeklyMenuToExcel(menu: WeeklyMenuSummary) {
  await exportWorkbook(`menu-semanal-${menu.patientMrn ?? "paciente"}-${menu.weekStart}`, [
    {
      name: "Resumen",
      rows: [
        {
          Paciente: menu.patientName ?? "Paciente",
          MRN: menu.patientMrn ?? "",
          Menu: menu.name,
          Semana: menu.weekStart,
          Estado: menu.status,
          KcalSemanal: round(menu.nutrition.weekly.kcal),
          ProteinaSemanalG: round(menu.nutrition.weekly.proteinG),
          CarbohidratosSemanalG: round(menu.nutrition.weekly.carbsG),
          GrasaSemanalG: round(menu.nutrition.weekly.fatG),
        },
      ],
    },
    {
      name: "Totales diarios",
      rows: menu.nutrition.daily.map((day) => ({
        Dia: day.dayOfWeek,
        Kcal: round(day.kcal),
        ProteinaG: round(day.proteinG),
        CarbohidratosG: round(day.carbsG),
        GrasaG: round(day.fatG),
        FibraG: round(day.fiberG),
      })),
    },
    {
      name: "Items",
      rows: menu.items.map((item) => ({
        Dia: item.dayOfWeek,
        Comida: item.mealType,
        Tipo: item.recipeId ? "Receta" : "Alimento",
        Nombre: item.recipe?.name ?? item.food?.name ?? "Item",
        CantidadG: item.quantityG ?? "",
        Porciones: item.portions,
        Kcal: round(item.nutrition.kcal),
        ProteinaG: round(item.nutrition.proteinG),
        CarbohidratosG: round(item.nutrition.carbsG),
        GrasaG: round(item.nutrition.fatG),
        Notas: item.notes ?? "",
      })),
    },
  ]);
}

export function exportEnteralPlanToPdf(plan: EnteralPlanSummary, patientName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const writer = createPdfWriter(doc);

  writer.heading("Reporte enteral");
  writer.line(`Paciente: ${patientName}`);
  writer.line(`Formula: ${plan.formulaName}`);
  writer.line(`Estado: ${plan.status}`);
  writer.line(`Via: ${plan.route}`);
  writer.line(`Modo: ${plan.administrationMode}`);
  writer.line(`Inicio: ${plan.startDate ?? "--"}`);

  writer.subheading("Objetivos");
  writer.line(`Volumen: ${valueLabel(plan.targetVolumeMl)} ml`);
  writer.line(`Kcal: ${valueLabel(plan.targetKcal)}`);
  writer.line(`Proteina: ${valueLabel(plan.targetProteinG)} g`);
  writer.line(`Agua de lavado: ${valueLabel(plan.waterFlushMl)} ml`);
  writer.line(`Velocidad: ${valueLabel(plan.infusionRateMlH)} ml/h`);

  writer.subheading("Tolerancia y aporte");
  writer.line(`Volumen entregado: ${valueLabel(plan.metrics.volumeDeliveredPct)} %`);
  writer.line(`Brecha kcal: ${valueLabel(plan.metrics.kcalGap)}`);
  writer.line(`Brecha proteina: ${valueLabel(plan.metrics.proteinGap)}`);
  writer.line(`Estado: ${plan.metrics.toleranceStatus}`);
  writer.line(`Flags: ${plan.metrics.flags.length > 0 ? plan.metrics.flags.join(", ") : "Sin flags"}`);

  writer.subheading("Controles diarios");
  if (plan.logs.length === 0) {
    writer.line("Sin controles diarios registrados.");
  } else {
    plan.logs.slice(0, 40).forEach((log) => {
      writer.line(
        `${formatDateTime(log.loggedAt)} | Vol ${valueLabel(log.deliveredVolumeMl)} ml | Kcal ${valueLabel(log.deliveredKcal)} | Prot ${valueLabel(log.deliveredProteinG)} g | Residuo ${valueLabel(log.gastricResidualMl)} ml | ${log.toleranceStatus ?? "sin estado"}`,
      );
    });
  }

  downloadBlob(doc.output("blob"), `${safeFilename(`reporte-enteral-${patientName}-${plan.formulaName}`)}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createPdfWriter(doc: jsPDF) {
  let y = 48;
  const left = 42;
  const maxWidth = 512;

  function ensureSpace(height = 18) {
    if (y + height > 780) {
      doc.addPage();
      y = 48;
    }
  }

  return {
    heading(text: string) {
      ensureSpace(36);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(text, left, y);
      y += 26;
    },
    subheading(text: string) {
      ensureSpace(30);
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(text, left, y);
      y += 18;
    },
    line(text: string) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(text, maxWidth) as string[];
      lines.forEach((line) => {
        ensureSpace(14);
        doc.text(line, left, y);
        y += 13;
      });
    },
  };
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .toLowerCase();
}

function sanitizeSheetName(value: string) {
  const clean = value.replace(/[:\\/?*[\]]/g, " ").trim() || "Datos";
  return clean.slice(0, 31);
}

function timestampLabel() {
  return new Date().toISOString().replace(/[-:]/g, "").slice(0, 13);
}

function round(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

function valueLabel(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(round(value)) : "--";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  return new Date(value).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" });
}
