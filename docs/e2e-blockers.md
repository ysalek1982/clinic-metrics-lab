# E2E Blockers

Fecha: 2026-05-11

## Bloqueos activos

### Enteral E2E automatizado

Estado: bloqueado por credenciales.

Faltan:

- `E2E_EMAIL`
- `E2E_PASSWORD`

Regla de validacion:

- La UI debe crear plan enteral, editarlo, crear log, pausar y cerrar.
- La API solo puede verificar datos y auditoria.
- No insertar plan/log por API para declarar E2E UI.

### QA Seguridad P0

Estado: bloqueado por usuarios Auth confirmados y credenciales.

Faltan:

- `qa-no-membership@nutri.test`
- `qa-hsm-clinical@nutri.test`
- `qa-tenant-b-clinical@nutri.test`
- `qa-e2e-hsm@nutri.test` si se usara como cuenta E2E HSM
- passwords o variables equivalentes para los usuarios QA que se vayan a ejecutar.

### Edge Function de invitacion

Estado: implementada localmente, despliegue bloqueado por token.

Falta:

- `SUPABASE_ACCESS_TOKEN`

Comando esperado:

```bash
npx supabase functions deploy admin-invite-user --project-ref nxqnmfvftwrvkjfahmmz
```

### Export audit

Estado: exportaciones reales disponibles, auditoria incompleta.

Pendiente:

- confirmar `report.exported` visible en `/app/audit` con formato `pdf` y `xlsx`.

## Evidencia que no reemplaza E2E

- Build, lint y unit tests pasando.
- RLS anon validado para tablas enterales/parenterales.
- Render enteral/parenteral estable.
- Auditoria parenteral real visible.

Estas evidencias reducen riesgo, pero no reemplazan E2E autenticado desde UI.
