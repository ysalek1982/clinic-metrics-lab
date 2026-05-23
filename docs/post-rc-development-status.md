# Post RC Development Status

Fecha: 2026-05-21

Alcance: validacion local/remota despues de que Nutri quedo visible en Vercel. No se hizo deploy en esta macrofase, no se hizo `db push`, no se tocaron secretos y no se cerro QA autenticado.

| Ruta/Modulo | Estado local | Estado Vercel | Hallazgo | Accion tomada | Pendiente |
|---|---|---|---|---|---|
| `/login` | Renderiza | Renderiza | Login disponible como entrada segura. | Validado por smoke remoto previo y QA no autenticado. | Login real con usuarios QA pendiente. |
| `/app` | Protegido por sesion sin crash | Protegido por sesion sin crash | Redirige a login sin storage state. | QA modulo por modulo remoto marca `AUTH_REQUIRED`, no P0/P1. | Smoke autenticado pendiente. |
| `/app/modules` | Protegido por sesion sin crash | Protegido por sesion sin crash | Ruta nueva cubierta por QA. | Incluida en QA modulo por modulo. | Validar con usuario real. |
| `/app/module-settings` | Protegido por sesion sin crash | Protegido por sesion sin crash | Configuracion persistente sigue pendiente. | Ruta cubierta por QA. | Persistencia remota si se aprueba DB/RLS. |
| `/app/copilot` | Protegido por sesion sin crash | Protegido por sesion sin crash | Copilot no simula IA generativa. | Ruta cubierta por smoke, audit UI y QA. | Validar permiso `ai.assist` con usuarios reales. |
| `/app/patients` | Protegido por sesion sin crash | Protegido por sesion sin crash | Sin ErrorBoundary en acceso no autenticado. | QA remoto/local paso. | Revisar formularios con sesion real. |
| `/app/reports` | Protegido por sesion sin crash | Protegido por sesion sin crash | `report.exported` sigue pendiente. | Se preservo bloqueo; no se prometio cierre. | Confirmar audit log autenticado. |
| `/app/pack/enteral/cockpit` | Protegido por sesion sin crash | Protegido por sesion sin crash | E2E Enteral sigue bloqueado. | QA no autenticado paso. | Credenciales E2E. |
| `/app/pack/parenteral` | Protegido por sesion sin crash | Protegido por sesion sin crash | Parenteral basico controlado. | QA no autenticado paso. | Validacion con usuario real. |
| `/app/users` | Protegido por sesion sin crash | Protegido por sesion sin crash | Edge Function no desplegada. | UI mantiene bloqueo documentado. | `SUPABASE_ACCESS_TOKEN` y usuarios QA. |
| `/app/audit` | Protegido por sesion sin crash | Protegido por sesion sin crash | Auditoria real requiere sesion. | QA no autenticado paso. | Revisar eventos reales con usuario QA. |

## Evidencia

- `node scripts/module-by-module-qa.mjs` local: `passed`.
- `QA_REMOTE_URL=https://clinic-metrics-lab.vercel.app node scripts/module-by-module-qa.mjs`: `passed`.
- `SMOKE_BASE_URL=https://clinic-metrics-lab.vercel.app npm run smoke:routes`: `passed`.
- `UI_AUDIT_BASE_URL=https://clinic-metrics-lab.vercel.app npm run audit:ui`: `passed`.
- QA autenticado no ejecutado por falta de storage state y usuarios Auth QA.

## Cambios tecnicos relevantes

- `scripts/module-by-module-qa.mjs` ahora soporta `QA_BASE_URL`, `QA_REMOTE_URL` y HTTPS.
- `vite.config.ts` mantiene chunks compatibles con Vercel para evitar pantalla blanca por carga de chunks.
- `package-lock.json` se actualizo con `npm audit fix` normal.

