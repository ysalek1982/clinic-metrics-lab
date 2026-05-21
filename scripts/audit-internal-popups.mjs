import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "ui-audit");
const docsDir = path.join(repoRoot, "docs");

const ACTION_PATTERN =
  /Nuevo|Crear|Editar|Registrar|Actualizar|Control|Asignar|Invitar|Generar|Exportar|Cerrar|Pausar|Revisar|Resolver|Silenciar|Atender|Completar|Cancelar|Imprimir|PDF|Excel/i;
const NATIVE_DIALOG_PATTERN = /window\.open|alert\s*\(|confirm\s*\(|prompt\s*\(/;
const INTERNAL_PATTERN = /ActionDialog|ActionDrawer|<Dialog\b|<Sheet\b|DialogContent|SheetContent|set[A-Z][A-Za-z0-9]*Open|setShow[A-Z]|setSelected[A-Z]|setEditing[A-Z]/;
const NAVIGATION_PATTERN = /<Link\b|to=\{|to="|href=\{|href="/;
const HANDLER_PATTERN = /onClick=|onSubmit=|type="submit"|mutateAsync|mutate\(/;
const DISABLED_PATTERN = /disabled|aria-disabled|Pr[oó]ximamente|pendiente/i;

const routeFiles = [
  { route: "/app/patients", file: "src/pages/app/Patients.tsx" },
  { route: "/app/plans", file: "src/pages/app/Plans.tsx" },
  { route: "/app/agenda", file: "src/pages/app/Agenda.tsx" },
  { route: "/app/alerts", file: "src/pages/app/Alerts.tsx" },
  { route: "/app/reports", file: "src/pages/app/Reports.tsx" },
  { route: "/app/recipes", file: "src/pages/app/Recipes.tsx" },
  { route: "/app/weekly-menu", file: "src/pages/app/WeeklyMenu.tsx" },
  { route: "/app/pack/enteral/cockpit", file: "src/pages/app/pack-modules/EnteralCockpit.tsx" },
  { route: "/app/pack/parenteral", file: "src/pages/app/pack-modules/ParenteralBase.tsx" },
  { route: "/app/users", file: "src/pages/app/UsersRoles.tsx" },
  { route: "/app/copilot", file: "src/pages/app/Copilot.tsx" },
  { route: "/app/foods", file: "src/pages/app/Foods.tsx" },
  { route: "/app/messages", file: "src/pages/app/Messages.tsx" },
  { route: "/app/screening", file: "src/pages/app/Screening.tsx" },
  { route: "/app/encounters", file: "src/pages/app/Encounters.tsx" },
  { route: "/app/pediatric-curves", file: "src/pages/app/PediatricCurves.tsx" },
  { route: "/app/somatocarta", file: "src/pages/app/pack-modules/SportSomatocarta.tsx" },
];

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const results = routeFiles.map((item) => analyzeFile(item));
const output = {
  generatedAt: new Date().toISOString(),
  status: results.some((route) => route.actions.some((action) => action.risk === "alto")) ? "review_required" : "passed",
  summary: summarize(results),
  results,
};

const stamp = output.generatedAt.replace(/[:.]/g, "-");
const artifactPath = path.join(artifactDir, `internal-popups-${stamp}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(output, null, 2));
writeDoc(output, artifactPath);

console.log(`Auditoria internal popups: ${output.status}. Artifact: ${artifactPath}`);
if (output.status === "review_required") process.exitCode = 1;

function analyzeFile(routeFile) {
  const absPath = path.join(repoRoot, routeFile.file);
  if (!fs.existsSync(absPath)) {
    return {
      ...routeFile,
      exists: false,
      hasInternalPopup: false,
      hasNativePopup: false,
      actions: [
        {
          action: "archivo no encontrado",
          line: 0,
          state: "archivo_no_encontrado",
          risk: "alto",
          recommendation: "Revisar ruta o archivo configurado.",
        },
      ],
    };
  }

  const source = fs.readFileSync(absPath, "utf8");
  const lines = source.split(/\r?\n/);
  const hasInternalPopup = INTERNAL_PATTERN.test(source);
  const hasNativePopup = NATIVE_DIALOG_PATTERN.test(source);
  const actions = [];

  lines.forEach((line, index) => {
    if (!ACTION_PATTERN.test(line)) return;
    const context = lines.slice(Math.max(0, index - 6), Math.min(lines.length, index + 7)).join("\n");
    const classification = classifyAction({ line, context, hasInternalPopup, hasNativePopup });
    actions.push({
      action: compactActionText(line),
      line: index + 1,
      ...classification,
    });
  });

  if (actions.length === 0) {
    actions.push({
      action: "sin acciones sensibles visibles en codigo",
      line: 0,
      state: "sin_acciones",
      risk: "bajo",
      recommendation: "Sin cambio requerido.",
    });
  }

  return { ...routeFile, exists: true, hasInternalPopup, hasNativePopup, actions };
}

function classifyAction({ line, context, hasInternalPopup, hasNativePopup }) {
  if (NATIVE_DIALOG_PATTERN.test(context) || NATIVE_DIALOG_PATTERN.test(line) || hasNativePopup) {
    return {
      state: "ventana_nativa_o_externa",
      risk: "alto",
      recommendation: "Convertir a Dialog, Drawer o vista interna. No usar window.open/alert/confirm/prompt.",
    };
  }

  if (INTERNAL_PATTERN.test(context) || hasInternalPopup) {
    return {
      state: "popup_interno",
      risk: "bajo",
      recommendation: "Mantener flujo interno con loading/error visible y evitar doble submit.",
    };
  }

  if (DISABLED_PATTERN.test(context)) {
    return {
      state: "deshabilitado_o_proximamente",
      risk: "bajo",
      recommendation: "Correcto si el tooltip o texto explica la limitacion.",
    };
  }

  if (NAVIGATION_PATTERN.test(context)) {
    return {
      state: "navegacion_interna",
      risk: "medio",
      recommendation: "Aceptar solo si es link explicito Abrir modulo/expediente; formularios deben quedar en popup interno.",
    };
  }

  if (HANDLER_PATTERN.test(context)) {
    return {
      state: "handler_probable",
      risk: "medio",
      recommendation: "Confirmar que el handler abre popup interno o ejecuta accion async con error visible.",
    };
  }

  return {
    state: "accion_sin_handler_visible",
    risk: "medio",
    recommendation: "Agregar handler real, deshabilitar como Proximamente o conectar a ActionDialog/ActionDrawer.",
  };
}

function compactActionText(line) {
  return line.replace(/\s+/g, " ").trim().slice(0, 160);
}

function summarize(results) {
  return results.reduce(
    (acc, route) => {
      for (const action of route.actions) {
        acc.total += 1;
        acc[action.risk] = (acc[action.risk] ?? 0) + 1;
      }
      return acc;
    },
    { total: 0, bajo: 0, medio: 0, alto: 0 },
  );
}

function writeDoc(payload, artifactPath) {
  const rows = payload.results
    .flatMap((route) =>
      route.actions.map(
        (action) =>
          `| \`${route.route}\` | ${escapePipes(action.action)} | ${action.state} | ${action.risk} | ${escapePipes(action.recommendation)} |`,
      ),
    )
    .join("\n");

  const content = `# Auditoria de popups internos

Generado: ${payload.generatedAt}

- Estado: ${payload.status}
- Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`
- Resumen: ${payload.summary.total} acciones; ${payload.summary.alto} alto(s), ${payload.summary.medio} medio(s), ${payload.summary.bajo} bajo(s).
- Regla: altas, ediciones y acciones sensibles deben usar Dialog, Drawer, Sheet o vista interna; no \`window.open\`, \`alert\`, \`confirm\` ni \`prompt\`.

| Ruta | Accion | Estado actual | Riesgo | Accion recomendada |
|---|---|---|---|---|
${rows}
`;
  fs.writeFileSync(path.join(docsDir, "internal-popups-audit.md"), content);
}

function escapePipes(value) {
  return String(value).replace(/\|/g, "\\|");
}
