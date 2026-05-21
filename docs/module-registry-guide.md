# Guia del registry de modulos

Estado: local, listo para revision.  
Fuente tecnica: `src/config/moduleRegistry.ts`, `src/hooks/useModuleRegistry.ts`, `src/lib/moduleAccess.ts`.

El registry centraliza la navegacion y el catalogo de modulos de Nutri. No reemplaza RLS ni permisos de backend; solo evita menus divergentes, rutas falsas y botones que prometen flujos no disponibles.

## Contrato

Cada modulo debe declarar:

- `id`: identificador estable y unico.
- `label`: nombre visible.
- `description`: descripcion corta para menu/centro de modulos.
- `area`: area funcional.
- `route`: solo si existe ruta real.
- `icon`: icono lucide.
- `permission`: permiso requerido si aplica.
- `pack`: pack asociado si aplica.
- `status`: `active`, `partial`, `coming_soon` o `blocked`.
- `priority`: orden dentro del area.
- `isClinical`, `isAdmin`, `isExperimental`: flags de revision.
- `requiresTenant`, `requiresPatient`: contexto requerido.
- `comingSoon`, `enabledByDefault`, `allowedContexts`.
- `pending` o `blockedReason`: obligatorio cuando el modulo no esta completo.

## Reglas

- No asignar `route` si la pantalla no existe.
- No marcar `active` un modulo bloqueado por credenciales, CSV oficiales o evidencia autenticada pendiente.
- No usar datos demo en rutas autenticadas.
- No ocultar bloqueos tecnicos: usar `partial` o `blocked` con texto claro.
- El sidebar solo muestra modulos con permiso visible y `showInSidebar=true`.
- El centro de modulos muestra tambien modulos sin permiso como `Requiere permiso`.
- La configuracion por area es solo lectura hasta tener backend tenant-scoped con RLS y auditoria.

## Areas y modulos

| Area | Modulos | Ruta | Permiso | Estado | Pendiente |
|---|---|---|---|---|---|
| Centro operativo | Dashboard | `/app` | Sesion + tenant | Activo | -- |
| Centro operativo | Copilot clinico | `/app/copilot` | `ai.assist` | Activo | No es IA medica; reglas locales |
| Centro operativo | Alertas | `/app/alerts` | `alerts.read` | Activo | -- |
| Centro operativo | Agenda | `/app/agenda` | `appointments.read` | Activo | -- |
| Centro operativo | Mensajes | `/app/messages` | `messages.read` | Activo | -- |
| Clinica | Pacientes | `/app/patients` | `patients.read` | Activo | -- |
| Clinica | Expediente | Desde paciente | `patients.read` | Activo | Requiere paciente |
| Clinica | Evaluaciones | `/app/encounters` | `encounters.manage` | Activo | -- |
| Clinica | Planes | `/app/plans` | `nutrition_plans.approve` | Activo | -- |
| Clinica | Antropometria | `/app/anthropometry` | `anthropometry.create` | Activo | -- |
| Clinica | Screening | `/app/screening` | `screening.create` | Activo | -- |
| Clinica | Formulas | `/app/formulas` | `settings.manage` | Activo | Admin institucional |
| Laboratorio | Labs | `/app/labs` | Tenant activo | Activo | -- |
| Laboratorio | Interpretaciones | Sin ruta | -- | Proximamente | Reglas clinicas validadas |
| Laboratorio | Reporte de laboratorios | Centro de reportes | `reports.export` | Parcial | `report.exported` pendiente |
| Nutricion | Alimentos | `/app/foods` | `foods.read` | Activo | -- |
| Nutricion | Recetas | `/app/recipes` | `recipes.read` | Activo | -- |
| Nutricion | Menu semanal | `/app/weekly-menu` | `weekly_menus.read` | Activo | -- |
| Nutricion | Reportes nutricionales | Centro de reportes | `reports.export` | Parcial | Auditoria export pendiente |
| Hospitalario | Enteral | `/app/pack/enteral/cockpit` | Pack enteral | Parcial | E2E autenticado pendiente |
| Hospitalario | Parenteral basico | `/app/pack/parenteral` | Pack parenteral | Parcial | No es parenteral avanzado |
| Hospitalario | Soporte hospitalario | Desde expediente | -- | Activo | Requiere paciente |
| Hospitalario | Alertas de tolerancia | Alertas | `alerts.read` | Parcial | Validacion E2E pendiente |
| Pediatria | Curvas pediatricas | `/app/pediatric-curves` | `pediatric_growth.read` | Parcial | CSV WHO/OMS faltantes |
| Pediatria | Controles pediatricos | Sin ruta | `pediatric_growth.read` | Proximamente | Flujo dedicado pendiente |
| Pediatria | Referencia incompleta | `/app/pediatric-curves` | `pediatric_growth.read` | Bloqueado | CSV WHO/OMS faltantes |
| Deportivo | Perfil deportivo | `/app/pack/sport` | Pack sport | Parcial | -- |
| Deportivo | Somatocarta | `/app/somatocarta` | Pack sport | Activo | Datos suficientes requeridos |
| Deportivo | Comparador | `/app/comparator` | Tenant activo | Activo | -- |
| Deportivo | Reporte deportivo | Centro de reportes | `reports.export` | Activo | Datos insuficientes si aplica |
| Administracion | Usuarios y roles | `/app/users` | `users.manage` | Parcial | Edge Function deploy pendiente |
| Administracion | Organizacion | `/app/organization` | `settings.manage` | Activo | -- |
| Administracion | Configuracion institucional | `/app/settings` | `settings.manage` | Activo | -- |
| Administracion | Tenant selector | `/app/tenants` | Sesion | Activo | -- |
| Administracion | Auditoria | `/app/audit` | `audit.read` | Activo | -- |
| Reportes | Centro de reportes | `/app/reports` | `reports.export` | Parcial | `report.exported` pendiente |
| Reportes | Reportes recientes | Centro de reportes | `reports.export` | Activo | -- |
| Reportes | Exportaciones | Centro de reportes | `reports.export` | Parcial | Evidencia autenticada pendiente |
| Sistema | Centro de modulos | `/app/modules` | Tenant activo | Activo | -- |
| Sistema | Configuracion de modulos | `/app/module-settings` | `settings.manage` | Parcial | Persistencia backend pendiente |
| Sistema | Readiness | Docs/scripts | -- | Bloqueado | Sin pantalla operativa |
| Sistema | Release candidate | Docs/artifacts | -- | Bloqueado | No versionar artifacts por defecto |
| Sistema | Estado del piloto | Docs | -- | Bloqueado | Fuente documental |

## Como agregar un modulo

1. Crear la ruta real si la pantalla existe.
2. Agregar entrada en `MODULE_REGISTRY`.
3. Definir `permission` usando permisos existentes, o documentar migracion pendiente.
4. Marcar `status` honestamente.
5. Si no debe aparecer en sidebar, omitir `showInSidebar`.
6. Agregar tests si cambia acceso, busqueda o rutas.
7. Ejecutar `npm test -- --run`, `npm run smoke:routes`, `npm run audit:ui`.

## Como marcar un modulo como pendiente

- Sin backend: `status: "partial"` o `blocked` y `pending`/`blockedReason`.
- Sin ruta: no declarar `route`.
- Flujo futuro visible: `comingSoon: true` y `status: "coming_soon"`.
- Bloqueo externo: `status: "blocked"` y razon concreta.
