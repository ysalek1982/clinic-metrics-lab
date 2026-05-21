# Changelog tecnico piloto Nutri

Fecha: 2026-05-11

## SaaS / multi-tenant

- Runtime tenant-aware, memberships, roles y permisos.
- `/app/users` funcional para memberships existentes.
- RPC admin validados previamente: list, update status, upsert.

## Pacientes / expediente

- Pacientes, expediente central y PatientDetail integran labs, agenda, mensajes, soporte hospitalario, pediatria y deportivo.

## Labs

- Ordenes/resultados reales, marcadores, tendencias e interpretacion controlada.

## Agenda

- Citas reales con estados operativos y auditoria.

## Mensajes

- Hilos y mensajes reales con lectura/cierre.

## Nutricion operativa

- Alimentos, recetas y menu semanal con calculos en dominio/servicios.

## Reportes

- Centro de reportes funcional con `report_runs`, `report.generated` y reporte deportivo real.
- `report.exported` sigue pendiente de evidencia autenticada.

## Pediatria

- Funcional con referencia incompleta controlada.
- No calcula z-score/percentil sin WHO/OMS oficial.

## Enteral

- Cockpit, planes, logs, tolerancia y alertas reales.
- E2E automatizado pendiente por credenciales.

## Parenteral

- Funcional basico controlado; no avanzado.

## Deportivo

- Perfil, evaluaciones, somatocarta condicionada a datos suficientes y reporte real.

## Usuarios/Roles

- Gestion de memberships, roles, permisos y panel QA.
- Edge Function de invitacion implementada localmente, despliegue pendiente.

## Seguridad ENV

- Password hardcodeado eliminado de seed superadmin.
- `.env*` y storage state protegidos por `.gitignore`.

## Readiness / testing

- Scripts de readiness, smoke, visual parity, UI actions, accesibilidad, permisos, demo y RLS.
- Tests locales ampliados.

## Bloqueos

- `SUPABASE_ACCESS_TOKEN`.
- Usuarios Auth QA.
- `E2E_EMAIL/E2E_PASSWORD`.
- Evidencia `report.exported`.
- CSV oficiales WHO/OMS.
