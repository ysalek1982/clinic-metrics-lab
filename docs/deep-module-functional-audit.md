# Deep module functional audit

Fecha: 2026-05-21

Alcance: Macrofase 45, auditoria modulo por modulo empezando por SaaS Admin. No se hizo `git add`, commit ni push. No se imprimieron secretos. Los artifacts generados quedan fuera de versionado salvo decision explicita.

## Metodologia

Para cada bloque se reviso ruta, componente, servicios/hooks, permisos, PlanGate/RLS cuando aplica, auditorias locales y rutas protegidas. La validacion autenticada nueva quedo limitada por ausencia de passwords/storage state en este entorno; se conserva la evidencia autenticada previa y se documento el bloqueo.

| Orden | Modulo | Ruta | Estado inicial | Hallazgos | Correcciones | Estado final | Pendiente |
|---:|---|---|---|---|---|---|---|
| 1 | SaaS Admin | `/app/saas-admin` | Funcional, pero la tab Usuarios seguia siendo informativa. | P1: platform admin no tenia lista operativa de usuarios/memberships desde UI; no habia drawer real de permisos efectivos. | Se conecto Usuarios a RPC `admin_list_memberships`; busqueda por email/nombre/tenant/rol; KPIs; drawer interno; permisos efectivos via `admin_list_effective_permissions`; asignar/quitar rol y estado por RPC protegidas. | Funcional localmente y cubierto por `qa:saas-admin`, build, lint y tests. | Repetir visual autenticado con ysalek tras entregar storage state/password; no probar mutaciones destructivas sin aprobacion puntual. |
| 2 | Auth / onboarding / Free | `/login`, `/activate-invite` | Free remoto aplicado y Marcela validada previamente. | No se detecto P0/P1 nuevo en esta pasada. | Sin cambio de flujo; se preserva `ensure_free_subscription_for_current_user()` y bloqueo de autoescalamiento. | Estable por pruebas locales y QA SaaS. | Validar nuevamente UI con usuario sin membership cuando existan credenciales QA. |
| 3 | PlanGate y suscripciones | Multiples rutas | Free/Pro/Clinic/Courtesy existen en DB y helpers locales. | No se detecto exposicion premium en QA no autenticado; faltan sesiones Pro/Clinic/Courtesy dedicadas para UI visual. | Se reforzo evidencia documental; no se cambiaron entitlements. | Free y SaaS pasan QA local; billing sigue desactivado. | Validacion visual Pro/Clinic/Courtesy con usuarios QA controlados. |
| 4 | Dashboard y Copilot | `/app`, `/app/copilot` | Copilot contextual sin IA generativa. | No se detectaron claims medicos peligrosos. | Sin cambios de reglas clinicas. | `audit:clinical-claims` pasa; rutas protegidas sin crash. | Validar con paciente real y permisos `ai.assist`. |
| 5 | Pacientes y expediente | `/app/patients`, `/app/patients/:id` | Estable localmente. | QA no autenticado solo valida auth gate; no se ejecuto escritura autenticada por falta de storage state. | Sin cambios. | Sin P0/P1 automatico. | Probar crear/editar, tabs y auditoria con usuario QA. |
| 6 | Agenda, mensajes y alertas | `/app/agenda`, `/app/messages`, `/app/alerts` | Flujos implementados previamente. | QA no autenticado no alcanza persistencia. | Sin cambios. | Sin P0/P1 automatico. | Validar dialogs, persistencia y audit logs con usuarios QA. |
| 7 | Labs y reportes | `/app/labs`, `/app/reports` | Reportes funcionales, `report.exported` no cerrado. | No cerrar export audit sin evidencia. | Sin cambios. | Guardrails conservados. | Confirmar `report.exported` en `/app/audit` con sesion real. |
| 8 | Nutricion operativa | `/app/foods`, `/app/recipes`, `/app/weekly-menu` | Modulos presentes. | No se detecto P0/P1 por QA automatico. | Sin cambios. | Sin crash en auth gate. | Validar calculos/persistencia con tenant real. |
| 9 | Hospitalario | `/app/pack/enteral/cockpit`, `/app/pack/parenteral` | Enteral/parenteral locales. | E2E Enteral sigue bloqueado. | Sin cambios. | No se cerro E2E. | Credenciales E2E y auditoria completa. |
| 10 | Pediatria y deportivo | `/app/pediatric-curves`, `/app/somatocarta` | Estados honestos. | WHO completo sigue bloqueado por CSV oficiales. | Sin cambios. | Sin z-score falso declarado. | CSV oficiales WHO/OMS y datos deportivos suficientes. |
| 11 | Administracion y configuracion | `/app/modules`, `/app/module-settings`, `/app/users`, `/app/audit`, `/app/settings`, `/app/organization` | Menu y SaaS remoto desplegados. | `UsersRoles` sigue complementando SaaS Admin; Edge Function no desplegada. | SaaS Admin Usuarios queda como vista plataforma real. | Rutas protegidas y sin crash no autenticado. | Edge Function, QA P0 y revision manual de permisos por tenant. |

## Evidencia ejecutada

- `npm run build`
- `npm run lint`
- `npm test -- --run src/lib/saasAdmin.test.ts`
- `npm run qa:saas-admin`
- `npm run audit:ui`
- `node scripts/module-by-module-qa.mjs`
- `node scripts/audit-internal-popups.mjs`
- `npm run audit:clinical-claims`

La bateria final completa queda registrada en `docs/full-system-module-audit.md` y en los artifacts generados durante la fase.

## Bloqueos preservados

- QA Seguridad P0 requiere usuarios QA reales.
- E2E Enteral requiere credenciales/storage state.
- `report.exported` requiere evidencia autenticada en auditoria.
- Pediatria WHO completa requiere CSV oficiales.
- Edge Function `admin-invite-user` requiere deploy autorizado.
- Validacion visual autenticada nueva requiere password o storage state de ysalek/Marcela en este entorno.

## Macrofase 46

| Bloque | Resultado | Evidencia | Pendiente |
|---|---|---|---|
| Deploy preview | Ejecutado. | `https://clinic-metrics-nufozysjq-ysaleks-projects.vercel.app`; rutas criticas 200/auth gate; QA modulo remoto passed. | Sin validacion autenticada por falta de storage state. |
| Deploy produccion | Ejecutado. | `dpl_8ABUwDGLWBFR7JpAfXDjaK2fsPyk`; alias `https://clinic-metrics-lab.vercel.app`; rutas criticas 200/auth gate. | No hubo commit/push. |
| Storage states | Script preparado. | `npm run auth:storage` omite cuentas por password ausente sin imprimir secretos. | Entregar passwords o storage states. |
| QA Seguridad P0 real | No cerrado. | `npm run qa:security-p0` genera artifact blocked. | `playwright/.auth/ysalek.json`, `marcela-free.json`, `qa-pro.json`, `qa-clinic.json`, `qa-courtesy.json`, `qa-no-membership.json`. |
| PlanGate por plan | No cerrado visualmente. | `npm run qa:plangate` genera matriz blocked. | Usuarios/storage states por plan. |
| `report.exported` | No cerrado. | Falta usuario autorizado y auditoria observable. | Probar export PDF/XLSX y evento `report.exported`. |
| E2E Enteral | No cerrado. | `E2E_EMAIL`/`E2E_PASSWORD` ausentes. | Crear storage state o credenciales E2E. |

## Macrofase 49 - segunda vuelta autenticada

Fecha: 2026-05-22

| Area | Resultado | Evidencia | Pendiente |
|---|---|---|---|
| Usuarios QA | ysalek, Marcela Free, QA Pro, QA Clinic, QA Courtesy y QA No Membership quedaron preparados con storage states temporales. | `artifacts/authenticated-functional/authenticated-functional-2026-05-22T19-57-06-969Z.json`: 46 rutas, 0 fallos. | Borrar/no versionar `playwright/.auth/*`. |
| SaaS/PlanGate | Free, Pro, Clinic/Hospital, Courtesy y No Membership revalidados por rutas esperadas. | `npm run qa:functional-auth`; `npm run qa:plangate`. | Expiracion real de Courtesy pendiente. |
| Entitlements institucionales | Clinic/Hospital no habilitaba packs/modulos hospitalarios tras cambio de plan. | Migracion remota `20260522193500_sync_plan_packs_modules.sql` aplicada; schema cache recargado. | Ninguno para el bug encontrado. |
| E2E Enteral | Cerrado contra Vercel con QA Clinic. | `artifacts/e2e/enteral-f9i/result.json`: create/update/log/alert/PatientDetail/pause/close/audit. | Limpiar datos QA si se decide. |
| `report.exported` | Cerrado contra Vercel con QA Clinic. | `artifacts/e2e/reports-export/result.json`: PDF, XLSX y audit `report.exported`. | Ninguno. |
| QA clinico P0 profundo | Parcial. | `qa:security-p0` listo con storage states reales. | Falta tenant-cross clinico tabla por tabla y CRUD completo no hospitalario. |
## Macrofase 50 - Evidencia de segunda vuelta

| Orden | Modulo | Ruta | Estado inicial | Hallazgos | Correcciones | Estado final | Pendiente |
|---:|---|---|---|---|---|---|---|
| 1 | SaaS Free | /app, /app/tenants | Copy institucional residual | Marcela veia contexto confuso | Mi cuenta/Mi espacio, sin SaaS link no admin | Funcional | Ninguno critico |
| 2 | UI tema | global | Sin selector claro/oscuro | P2 legibilidad | ThemeToggle y tokens | Funcional | Mobile fino |
| 3 | Reportes | /app/reports | Export audit pendiente | Necesitaba evidencia real | E2E PDF/XLSX con audit | Cerrado | Mas tipos |
| 4 | Enteral | /app/pack/enteral/cockpit | E2E pendiente | Necesitaba evidencia real | E2E completo con audit/RLS | Cerrado | Mas escenarios |
| 5 | Modulos | varias | Smoke superficial historico | Sin P0 en QA automatizado | module-by-module QA | Operativo | CRUD manual profundo |
# Macrofase 51 - Deep Module Functional Audit Update

Fecha local: 2026-05-23.

La segunda ronda cubrio los modulos parciales con cinco pases de evidencia: codigo/guards, UI autenticada, usuarios y planes, datos/RLS/auditoria y revalidacion local/Vercel. Los datos QA usan prefijo `qa_m51_`.

| Orden | Modulo | Ruta | Estado inicial | Hallazgos | Correcciones | Estado final | Pendiente |
|---:|---|---|---|---|---|---|---|
| 1 | Pacientes / expediente | `/app/patients` | Parcial | CRUD profundo no cerrado | QA persistente paciente/contacto/audit | Validado | Casos reales |
| 2 | Agenda | `/app/agenda` | Parcial | CRUD profundo no cerrado | Cita create/complete/cancel/audit | Validado | Recurrentes |
| 3 | Mensajes | `/app/messages` | Parcial | CRUD profundo no cerrado | Hilo/mensaje/read/close/audit | Validado | Asignacion |
| 4 | Alertas | `/app/alerts` | Parcial | Acciones profundas no cerradas | Reviewed/resolved/audit | Validado | Masiva amplia |
| 5 | Labs | `/app/labs` | Parcial | Valores QA invalidos | Marcador valido y audit | Validado | Interpretacion |
| 6 | Operativa | `/app/foods`, `/app/recipes`, `/app/weekly-menu` | Parcial | Enum QA invalido | Persistencia food/recipe/menu | Validado | Dataset amplio |
| 7 | Parenteral | `/app/pack/parenteral` | Pendiente E2E | Sin E2E | `scripts/e2e-parenteral-flow.mjs` | Cerrado basico | Avanzado no implementado |
| 8 | Pediatria | `/app/pediatric-curves` | WHO pendiente | Riesgo de calculo falso | z-score/percentil null validados | Seguro | CSV oficiales |
| 9 | Deportivo | `/app/somatocarta` | Parcial | Falta persistencia QA | Perfil/snapshot auditado | Validado | Mas casos |
| 10 | Admin/Mobile | Varias | Parcial | Pack premium y overflow | PlanGate PackView y responsive | Validado | Dispositivos reales |
