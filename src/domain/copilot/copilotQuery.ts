import type { CopilotFinding, CopilotPriority, CopilotTask, CopilotTimelineEvent } from "@/domain/copilot/copilotRules";

export interface CopilotQueryContext {
  patientName?: string | null;
  priorities: CopilotPriority[];
  findings: CopilotFinding[];
  tasks: CopilotTask[];
  timeline: CopilotTimelineEvent[];
  missingData: CopilotFinding[];
  risks: CopilotFinding[];
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function intro(context: CopilotQueryContext) {
  return context.patientName ? `Contexto de ${context.patientName}:` : "Contexto del tenant:";
}

function listTitles(items: Array<{ title: string }>, empty: string) {
  if (items.length === 0) return empty;
  return items.slice(0, 4).map((item) => item.title).join("; ");
}

function byModule(findings: CopilotFinding[], module: string) {
  return findings.filter((finding) => finding.module === module);
}

function byTaskType(tasks: CopilotTask[], type: CopilotTask["type"]) {
  return tasks.filter((task) => task.type === type);
}

export function answerCopilotQuery(question: string, context: CopilotQueryContext) {
  const normalized = normalize(question);
  const findings = context.findings;
  const tasks = context.tasks;

  if (!normalized) {
    return "Escribe una pregunta sobre resumen, alertas, laboratorios, citas, plan, soporte nutricional, pediatría, deporte o pendientes registrados.";
  }

  if (normalized.includes("alerta")) {
    return `${intro(context)} ${listTitles(byModule(findings, "alerts"), "no hay alertas activas visibles en este contexto.")}`;
  }

  if (normalized.includes("laboratorio") || normalized.includes("lab")) {
    return `${intro(context)} ${listTitles(byModule(findings, "labs"), "no hay laboratorios críticos o fuera de rango visibles en este contexto.")}`;
  }

  if (normalized.includes("cita") || normalized.includes("agenda") || normalized.includes("seguimiento")) {
    return `${intro(context)} ${listTitles(byModule(findings, "agenda"), "no hay citas próximas, vencidas o pendientes de seguimiento visibles.")}`;
  }

  if (normalized.includes("plan")) {
    return `${intro(context)} ${listTitles(byTaskType(tasks, "plan_missing"), "no hay pendiente de plan nutricional activo en este contexto.")}`;
  }

  if (normalized.includes("parenteral")) {
    return `${intro(context)} ${listTitles(byTaskType(tasks, "parenteral_monitoring"), "no hay soporte parenteral activo visible en este contexto.")}`;
  }

  if (normalized.includes("enteral")) {
    return `${intro(context)} ${listTitles(byTaskType(tasks, "enteral_tolerance"), "no hay riesgo enteral visible en este contexto.")}`;
  }

  if (normalized.includes("deportivo") || normalized.includes("deporte") || normalized.includes("somatotipo") || normalized.includes("somatocarta")) {
    return `${intro(context)} ${listTitles(byTaskType(tasks, "sports_data_insufficient"), "no hay pendientes deportivos visibles o los datos deportivos suficientes no estan cargados en este contexto.")}`;
  }

  if (normalized.includes("pediatria") || normalized.includes("pediatrico") || normalized.includes("z-score") || normalized.includes("percentil")) {
    return `${intro(context)} ${listTitles(byTaskType(tasks, "pediatric_reference_incomplete"), "no hay pendiente pediatrico visible en este contexto.")}`;
  }

  if (normalized.includes("pendiente") || normalized.includes("tarea")) {
    return `${intro(context)} ${listTitles(tasks, "no hay tareas operativas visibles en este contexto.")}`;
  }

  if (normalized.includes("timeline") || normalized.includes("evento") || normalized.includes("historial")) {
    return `${intro(context)} ${listTitles(context.timeline, "no hay eventos operativos recientes en este contexto.")}`;
  }

  if (normalized.includes("faltante") || normalized.includes("falta") || normalized.includes("insuficiente")) {
    return `${intro(context)} ${listTitles(context.missingData, "no hay datos faltantes detectados por reglas locales en este contexto.")}`;
  }

  if (normalized.includes("resumen")) {
    return `${intro(context)} ${context.priorities.length} prioridad(es), ${tasks.length} tarea(s), ${context.risks.length} riesgo(s) y ${context.missingData.length} pendiente(s) de datos visibles. No se genera diagnostico ni tratamiento.`;
  }

  return "Puedo responder sobre resumen, alertas, laboratorios, citas, plan, soporte nutricional, pediatría, deporte y pendientes registrados. IA generativa pendiente de integración.";
}
