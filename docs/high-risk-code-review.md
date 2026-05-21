# Revision de codigo de alto riesgo

Fecha de revision: 2026-05-15

Segunda pasada de congelamiento: 2026-05-15. No se agregaron features, no se hizo staging, no se hizo commit, no se hizo push, no se hizo `db push` y no se desplegaron Edge Functions.

Alcance revisado:

- `src/services/*`
- `src/hooks/*`
- `src/pages/app/PatientDetail.tsx`
- `src/pages/app/Reports.tsx`
- `src/pages/app/PackView.tsx`
- `src/pages/app/UsersRoles.tsx`
- `src/pages/app/Copilot.tsx`
- `src/domain/copilot/*`
- `supabase/functions/admin-invite-user/*`
- `supabase/migrations/*`

Validaciones previas ejecutadas:

- `git status --short`
- `git diff --stat`
- `npm run verify:pilot`
- `npm run smoke:routes`
- `npm run audit:ui`
- `npm run audit:permissions`
- `npm test -- --run`

Resultado previo: validaciones locales en verde. Los bloqueos externos se mantienen abiertos: deploy de Edge Function, QA Seguridad P0, E2E Enteral, `report.exported` visible en auditoria remota y Pediatria WHO completa.

| Archivo/Area | Riesgo | Que revisar | Hallazgo | Accion tomada | Pendiente |
|---|---|---|---|---|---|
| `src/services/saasService.ts` | Alto | Fallbacks Supabase/demo, accesos `.data`, demo autenticado | `mapTenantModules` podia leer `local.enabledModules` cuando `local` era `undefined`; mapas de branding/settings/limits/counters asumian `data` no nulo | Se aplicaron guards con `local?.enabledModules` y `(result.data ?? [])` | Revision humana antes de commit por impacto en tenant runtime |
| `src/services/institutionService.ts` | Alto | Fallbacks institucionales, validacion de plan, configuracion tenant | Expresion de fallback de plan rota; `fallback` podia ser `undefined`; limite de packs no contemplaba fallback local | Se corrigio fallback de tenant, seleccion de plan remoto/local y validacion de limite de packs | Revision humana antes de commit; no se hizo `db push` |
| `src/services/reportService.ts` | Alto | Auditoria de reportes, exportaciones, `report.exported` | `report.generated`, `report.printed` y `report.exported` estan implementados via `writeAuditLog`; falta evidencia autenticada de `report.exported` visible en `/app/audit` | Sin cambio funcional; estado documentado como bloqueo por evidencia autenticada | Cerrar solo con sesion real y auditoria visible |
| `src/services/clinicalService.ts` | Alto | Escritura de auditoria, datos reales, RLS indirecto | `writeAuditLog` lanza error si falla la insercion; no oculta errores | Sin cambio | QA Seguridad P0 pendiente con usuarios reales |
| `src/services/specialtyService.ts` | Alto | Enteral/parenteral/deportivo, auditoria clinica, calculos | No se detectaron accesos `.data` inseguros en el alcance revisado; servicios usan `?? []` | Sin cambio | E2E Enteral sigue bloqueado por credenciales |
| `src/services/identityService.ts` | Alto | Invitacion Auth, memberships, no service role frontend | Gestion de memberships depende de RPC/Edge Function; no se detecto service role en frontend | Sin cambio | Edge Function deploy bloqueado por `SUPABASE_ACCESS_TOKEN` |
| `src/hooks/*` | Medio | Contratos estables, `undefined.data`, demo autenticado | Hooks principales normalizan con `?.data` y `??`; `useCopilotContext` devuelve forma estable | Sin cambio | Smoke autenticado pendiente por falta de sesion |
| `src/pages/app/PatientDetail.tsx` | Alto | Expediente central, Copilot, datos visibles sin permiso | El boton Copilot quedaba deshabilitado sin `ai.assist`, pero el panel seguia mostrando hallazgos/tareas/timeline | Se oculto el contenido contextual y se muestra mensaje de permiso requerido cuando falta `ai.assist` | Revisar manualmente por tamano e impacto del archivo |
| `src/pages/app/Reports.tsx` | Alto | Export real, auditoria, botones falsos | PDF/XLSX generan artifact antes de auditar; botones globales estan deshabilitados; `report.exported` no se puede cerrar sin evidencia autenticada | Sin cambio funcional | Confirmar `report.exported` en `/app/audit` con credenciales |
| `src/pages/app/PackView.tsx` | Alto | Modulos especializados, permisos, `.data` | Accesos a resultados estan protegidos con `?.data ?? []`; permisos por modulo visibles | Sin cambio | E2E Enteral pendiente |
| `src/pages/app/UsersRoles.tsx` | Alto | Admin usuarios, permisos, Edge Function | Acciones usan `canInvite`/`canManageMemberships`; no hay service role frontend; errores de Edge Function son visibles | Sin cambio | Deploy Edge Function y usuarios QA reales pendientes |
| `src/pages/app/Copilot.tsx` | Alto | Seguridad clinica, no IA falsa, quick links | Muestra "sin IA generativa"; no diagnostica ni prescribe; quick links reales o deshabilitados/Proximamente | Sin cambio | Validacion autenticada pendiente |
| `src/domain/copilot/*` | Alto | Reglas locales, claims clinicos, datos inventados | Reglas generan tareas/hallazgos a partir de datos visibles; consultas locales rechazan IA generativa; no se detectaron claims de diagnostico/tratamiento fuera de disclaimers | Sin cambio | Mantener revision clinica antes de piloto real |
| `supabase/functions/admin-invite-user/*` | Alto | Service role, JWT caller, permisos, audit logs | Service role solo aparece dentro de Edge Function; caller se valida con JWT y RPC `can_manage_memberships`; no devuelve tokens sensibles | Sin cambio | Deploy y prueba remota bloqueados por `SUPABASE_ACCESS_TOKEN` |
| `supabase/migrations/*` | Alto | Passwords/secrets, RLS, grants, security definer | Busqueda no encontro `v_password`, `password :=`, `encrypted_password`, `crypt(` ni connection strings; service role no aparece en migraciones | Sin cambio | No aplicar migraciones remotas sin `SUPABASE_DB_PASSWORD` y revision humana |

## Busquedas ejecutadas

- `.data` en servicios, hooks, paginas criticas, dominio Copilot y Supabase.
- Demo/auth: `src/data/demo`, `src/data/saas`, `src/data/clinical`, `source: demo`, `allowDemo`, `isDemoMode`, `DEMO_USER`.
- Secretos: `SUPABASE_SERVICE_ROLE`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `E2E_PASSWORD`, `QA_PASSWORD`, `postgresql://`, `A907`, `eyJ`, `v_password`, `encrypted_password`, `crypt(`.
- Claims clinicos prohibidos en Copilot: diagnostico probable, prescripcion, dosis, tratamiento, pronostico, IA generativa activa.
- Mojibake: verificado por lectura UTF-8 con Node; las apariciones vistas en PowerShell fueron render de consola, no contenido de archivo.

## Segunda pasada de alto riesgo

| Area | Resultado | Accion |
|---|---|---|
| Accesos `.data` | No se detectaron nuevos accesos inseguros en paginas criticas; los usos revisados usan `?.`, `??` o resultados previamente validados. | Sin cambio adicional. |
| Demo autenticado | Se detectaron usos de `isDemoMode`, `allowDemo` y `source: "demo"`; los usos revisados operan como fallback sin sesion o quedan bloqueados/deshabilitados en sesion autenticada. | Sin cambio adicional; mantener auditoria de demo antes de commit. |
| Secretos y passwords | No se detectaron `v_password`, `password :=`, `encrypted_password`, `crypt(`, tokens, connection strings ni service role en frontend. `SUPABASE_SERVICE_ROLE_KEY` aparece solo en la Edge Function local. | Sin cambio adicional. |
| Copilot clinico | No se detecto "IA generativa activa" ni claims de diagnostico probable, prescripcion, dosis o tratamiento. Los textos prohibidos aparecen solo en disclaimers o tests negativos. | Sin cambio adicional. |
| Reportes/exportaciones | `report.exported` permanece implementado pero no cerrado por falta de evidencia autenticada en `/app/audit`. PDF/XLSX siguen condicionados a preview disponible y permisos. | Sin cambio funcional; bloqueo preservado. |
| Supabase migrations | No se modificaron migraciones aplicadas. No se detectaron passwords/secrets en la busqueda actual. | Revision humana requerida antes de cualquier `db push`. |

## Correcciones aplicadas en esta tanda

1. `src/services/saasService.ts`
   - Fallback seguro cuando no existe tenant local.
   - Mapas defensivos para resultados Supabase nulos.

2. `src/services/institutionService.ts`
   - Fallback institucional seguro.
   - Seleccion de plan remoto/local corregida.
   - Validacion explicita si no se puede resolver el plan.

3. `src/pages/app/PatientDetail.tsx`
   - El panel Copilot ya no muestra hallazgos/tareas/timeline si el usuario no tiene `ai.assist`.
   - Se muestra mensaje visible de permiso requerido.

## Riesgo residual

- `src/services/*`, `src/hooks/*`, `PatientDetail`, `Reports`, `PackView`, `UsersRoles`, `Copilot`, Edge Function y migraciones siguen siendo areas de revision humana antes de commit por impacto funcional y seguridad.
- `report.exported` permanece bloqueado por falta de evidencia autenticada visible en `/app/audit`.
- QA Seguridad P0 y E2E Enteral permanecen bloqueados por usuarios/credenciales reales.
- No se hizo staging, commit, push, db push ni deploy.

## Pasada adicional por errores de módulos

Fecha de revision: 2026-05-20.

Motivo: se reportaron errores de runtime al abrir módulos autenticados, incluyendo un caso visible de `Cannot read properties of undefined (reading 'name')`.

| Archivo/Area | Riesgo | Que revisar | Hallazgo | Accion tomada | Pendiente |
|---|---|---|---|---|---|
| `src/features/auth/AuthProvider.tsx` | Alto | Sesion Supabase con perfil/identity incompleto | `buildAuthUser` podia leer `profile.title` cuando `profile` era `null` tras timeout o fallo de identity context | Se movio el helper a `src/features/auth/auth-user.ts` y se corrigio a `profile?.title`; se agrego test con perfil nulo | Validacion autenticada real pendiente |
| `src/pages/app/Patients.tsx` | Alto | Referencias institucionales incompletas, packs, servicios y formulario | Servicios/sedes dependian de arrays completos y algunos labels podian quedar sin fallback | Se endurecieron `services`/`branches` con `Array.isArray`, fallbacks de paciente al editar y labels seguros para organizacion/sede/servicio | Revisar manualmente con sesion real y datos remotos |
| `src/components/common/RiskBadge.tsx` | Medio | Riesgo nulo/desconocido desde datos remotos | `RiskBadge`/`RiskDot` asumian niveles validos | Se aceptan niveles nulos/desconocidos con badge "No registrado" y dot neutro | Sin bloqueo |
| `src/pages/app/PatientDetail.tsx` | Alto | Fechas y servicios opcionales en expediente | Varias fechas usaban `.slice(0, 10)` directamente; servicios asumian arrays completos | Se agrego `dateOnly`, se protegieron fechas de antropometria, labs, pediatria, deportivo y soporte; `InfoTile`/`MiniRule` aceptan valores nulos | Revisar manualmente con expedientes reales complejos |
| `src/pages/app/Labs.tsx` | Medio | Datos de labs parcialmente poblados | La UI podia depender de nombre/rango/categoria/descripcion completos | Se extrajo `normalizeLabPatients` a `labs-utils.ts` con fallbacks para paciente y marcador; se agrego test | Sin bloqueo |
| `src/components/layout/AppSidebar.tsx` | Medio | Estructura visual del menu, badges confusos, perfil operativo | El sidebar mostraba `PARCIAL` en modulos navegables y resaltaba perfiles con bordes grandes; visualmente parecia error aunque el modulo abriera | Se oculto el badge `Parcial` en modulos navegables, se dejaron badges solo para estados bloqueantes y se cambio el resaltado de perfil a acento lateral discreto | Recargar navegador para ver HMR actualizado |
| `src/config/moduleRegistry.ts` | Bajo | Etiquetas de areas visibles | Algunas areas aparecian sin acentos en el menu | Se normalizaron labels visibles de Clinica/Nutricion/Pediatria/Administracion | Sin bloqueo |

Validaciones de esta pasada:

- `npm run lint` paso.
- `npm run build` paso.
- `npm test -- --run` paso con 142 tests.
- `npm run smoke:routes` paso contra `http://127.0.0.1:8082`; smoke autenticado sigue bloqueado por falta de storage state/credenciales.
- `npm run audit:ui` paso contra `http://127.0.0.1:8082`.
- `npm run audit:permissions` paso con 0 hallazgos para revision.
- `node scripts/module-by-module-qa.mjs` paso contra `http://127.0.0.1:8082`; modo autenticado no ejecutado por falta de storage state.
- `node scripts/audit-internal-popups.mjs` paso.

Pasada visual adicional del menu:

- `npm run lint` paso.
- `npm test -- --run src/config/moduleRegistry.test.ts src/lib/moduleAccess.test.ts` paso con 11 tests.
- `npm run build` paso.
- `npm test -- --run` paso con 142 tests.
- `npm run smoke:routes` paso contra `http://127.0.0.1:8082`.
- `npm run audit:ui` paso contra `http://127.0.0.1:8082`.
- `npm run audit:permissions` paso con 0 hallazgos para revision.
