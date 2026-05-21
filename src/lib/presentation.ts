type Tone = "default" | "cyan" | "green" | "yellow" | "orange" | "red" | "muted";

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  admission: "Internacion",
  approved: "Aprobado",
  attended: "Atendida",
  cancelled: "Cancelada",
  closed: "Cerrado",
  completed: "Completado",
  critical: "Critico",
  discharged: "Alta",
  draft: "Borrador",
  high: "Alto",
  inactive: "Inactivo",
  invited: "Invitado",
  labs: "Laboratorios",
  low: "Bajo",
  moderate: "Moderado",
  monitoring: "En seguimiento",
  no_show: "No asistio",
  on_hold: "En pausa",
  open: "Abierto",
  out_of_range: "Fuera de rango",
  outpatient: "Consulta externa",
  paused: "Pausado",
  pdf: "PDF",
  pending: "Pendiente",
  preview: "Vista previa",
  print: "Impresion",
  ready: "Listo",
  requires_data: "Requiere datos",
  requires_patient: "Requiere paciente",
  resolved: "Resuelta",
  reviewed: "Revisada",
  risk: "Riesgo",
  scheduled: "Programada",
  score: "Puntaje",
  silenced: "Silenciada",
  follow_up: "Seguimiento",
  sports_season: "Temporada deportiva",
  teleconsult: "Teleconsulta",
  unavailable: "No disponible",
};

const ROLE_LABELS: Record<string, string> = {
  admin_institucional: "Administrador institucional",
  auditor: "Auditor",
  clinical_nutritionist: "Nutricionista clinico",
  director_nutricion: "Director de nutricion",
  nutricionista_clinico: "Nutricionista clinico",
  platform_superadmin: "Superadministrador plataforma",
  tenant_owner: "Propietario del tenant",
};

const PERMISSION_LABELS: Record<string, string> = {
  "alerts.manage": "Gestionar alertas",
  "alerts.read": "Leer alertas",
  "appointments.manage": "Gestionar agenda",
  "appointments.read": "Leer agenda",
  "enteral.close": "Cerrar soporte enteral",
  "enteral.create": "Crear soporte enteral",
  "enteral.log": "Registrar control enteral",
  "enteral.read": "Leer soporte enteral",
  "memberships.manage": "Gestionar memberships",
  "memberships.read": "Leer memberships",
  "patients.create": "Crear pacientes",
  "patients.read": "Leer pacientes",
  "reports.generate": "Generar reportes",
  "reports.print": "Imprimir reportes",
  "reports.read": "Leer reportes",
  "roles.read": "Leer roles",
  "sports.manage": "Gestionar deportivo",
  "users.manage": "Gestionar usuarios",
  "users.read": "Leer usuarios",
};

const TONES: Record<string, Tone> = {
  active: "green",
  approved: "green",
  attended: "green",
  closed: "muted",
  completed: "green",
  critical: "red",
  high: "orange",
  inactive: "muted",
  low: "green",
  moderate: "yellow",
  out_of_range: "orange",
  paused: "yellow",
  pending: "yellow",
  requires_data: "yellow",
  requires_patient: "yellow",
  resolved: "green",
  reviewed: "cyan",
};

export function presentStatus(value: string | null | undefined) {
  if (!value) return "--";
  return STATUS_LABELS[value] ?? value.replaceAll("_", " ");
}

export function presentUpperStatus(value: string | null | undefined) {
  return presentStatus(value).toUpperCase();
}

export function presentRole(value: string | null | undefined) {
  if (!value) return "Rol no registrado";
  return ROLE_LABELS[value] ?? presentStatus(value);
}

export function presentPermission(value: string | null | undefined) {
  if (!value) return "Permiso no registrado";
  return PERMISSION_LABELS[value] ?? value.replaceAll(".", " · ");
}

export function presentSeverity(value: string | null | undefined) {
  return presentStatus(value);
}

export function statusTone(value: string | null | undefined): Tone {
  if (!value) return "muted";
  return TONES[value] ?? "default";
}
