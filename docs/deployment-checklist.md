# Deployment Checklist

## Variables necesarias

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_ACCESS_TOKEN` para desplegar Edge Functions.
- `SUPABASE_DB_PASSWORD` para `db push` remoto, solo con aprobacion humana previa.
- `SUPABASE_PROJECT_REF` si el CLI no esta linkeado.
- `E2E_EMAIL` y `E2E_PASSWORD` para E2E UI.
- `QA_NO_MEMBERSHIP_EMAIL` y `QA_NO_MEMBERSHIP_PASSWORD`.
- `QA_HSM_EMAIL` y `QA_HSM_PASSWORD`.
- `QA_TENANT_B_EMAIL`, `QA_TENANT_B_PASSWORD` y `QA_TENANT_B_ID`.

No guardar secretos reales en `.env.local` versionado ni imprimirlos en logs.

## Supabase

- Confirmar migraciones aplicadas.
- Confirmar PostgREST schema cache actualizado si hay tablas nuevas.
- Confirmar RLS anon en tablas clinicas tenant-scoped.
- Confirmar RPCs admin:
  - `admin_list_memberships`
  - `admin_upsert_membership`
  - `admin_update_membership_status`
- Confirmar `report_runs`, `enteral_*`, `parenteral_*`, `sports_*` y tablas pediatricas en REST.

## Edge Function

Desplegar:

```bash
npx supabase functions deploy admin-invite-user
```

Configurar secretos en Supabase, no en frontend:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` si la funcion no lo recibe por entorno administrado.

Validar:

- JWT de caller obligatorio.
- Service role solo dentro de Edge Function.
- Caller con `users.manage` o permiso equivalente.
- Auditoria `user.invite` o `user.create`.
- No retorna tokens sensibles.

## QA antes de piloto

- Ejecutar `npm run build`.
- Ejecutar `npm run lint`.
- Ejecutar `npm test -- --run`.
- Ejecutar `node scripts/qa-security-p0.mjs` con usuarios QA.
- Ejecutar E2E Enteral con credenciales UI.
- Verificar `/app/users`, `/app/audit`, `/app/reports`, `/app/pack/enteral/cockpit`, `/app/pack/parenteral`.
- Confirmar `report.exported` visible en `/app/audit`.

## No negociables

- No service role en frontend.
- No demo con sesion autenticada.
- No botones falsos.
- No ErrorBoundary en carga normal.
- No datos cross-tenant.
