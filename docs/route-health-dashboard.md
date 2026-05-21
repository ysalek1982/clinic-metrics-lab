# Route health dashboard local

Fecha: 2026-05-13

Fuente: `npm run smoke:routes`, `npm run audit:ui`, `npm run audit:permissions`, `npm run audit:demo`.

| Ruta | Render | UX | Acciones | Permisos | Demo risk | Estado final | Pendiente |
|---|---|---|---|---|---|---|---|
| `/app` | PASS local | Login visible sin sesion | Sin riesgo alto | Ruta protegida | none | Verde local | Smoke autenticado |
| `/app/copilot` | PASS local | Command center contextual con tareas, timeline y consulta local; login sin sesion en smoke local | Quick links reales o deshabilitados | Ruta protegida por `ai.assist`; datos por RLS/backend | none | Amarillo autenticado pendiente | Smoke autenticado con usuarios reales y permiso `ai.assist` |
| `/app/patients` | PASS local | Redirige/login sin sesion | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Usuarios QA |
| `/app/anthropometry` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/screening` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/plans` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/agenda` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/messages` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/alerts` | PASS local | ModuleState reforzado | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/reports` | PASS local | ModuleState reforzado | Export requiere evidencia audit | Guard UI/reportes | none | Amarillo autenticado pendiente | `report.exported` en audit |
| `/app/labs` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/foods` | PASS local | Sin ErrorBoundary local | Guardado deshabilita submit | Backend/RLS | none | Amarillo autenticado pendiente | QA P0 |
| `/app/recipes` | PASS local | Sin ErrorBoundary local | Guardado deshabilita submit | Backend/RLS | none | Amarillo autenticado pendiente | QA P0 |
| `/app/weekly-menu` | PASS local | Sin ErrorBoundary local | Cerrar/guardar gateado | UI + backend/RLS | none | Amarillo autenticado pendiente | QA P0 |
| `/app/pediatric-curves` | PASS local | Referencia incompleta controlada | Sin z-score falso | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | CSV WHO oficiales |
| `/app/pack/enteral/cockpit` | PASS local | Render visible validado localmente | Pausar/cerrar gateado | UI + backend/RLS | none | Amarillo autenticado pendiente | E2E Enteral |
| `/app/pack/parenteral` | PASS local | Basico controlado | Cerrar gateado | UI + backend/RLS | none | Amarillo autenticado pendiente | E2E opcional |
| `/app/somatocarta` | PASS local | Somatocarta condicionada | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Datos reales suficientes |
| `/app/users` | PASS local | Admin memberships funcional local/remoto parcial aceptado | Invite depende Edge Function | users.manage/memberships.manage | none | Amarillo autenticado pendiente | Deploy Edge Function/QA users |
| `/app/audit` | PASS local | ModuleState reforzado | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Eventos autenticados |
| `/app/settings` | PASS local | Sin ErrorBoundary local | Proximamente donde aplica | UI + backend/RLS | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/organization` | PASS local | Sin ErrorBoundary local | Crear tenant protegido | Platform/admin guard | none | Amarillo autenticado pendiente | Revision admin |

Leyenda: Verde local = validado sin credenciales; Amarillo autenticado pendiente = requiere storage state/credenciales; Rojo bloqueado = no ejecutable localmente.
