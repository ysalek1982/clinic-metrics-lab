# Runbook dia de desbloqueo

Este documento describe como cerrar los bloqueos externos cuando existan credenciales y usuarios reales. No incluye valores secretos.

## Reglas

- No imprimir tokens, passwords ni `storageState`.
- No usar service role en frontend.
- No ejecutar `db push` ni deploy sin validacion humana previa.
- No cerrar QA Seguridad P0, E2E Enteral o `report.exported` sin evidencia real.
- No modificar `.env.local` desde scripts automatizados.

## 1. Cargar variables

En PowerShell, cargar variables en la sesion local sin escribirlas en archivos versionados:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "<token>"
$env:SUPABASE_DB_PASSWORD = "<password>"
$env:E2E_EMAIL = "<email>"
$env:E2E_PASSWORD = "<password>"
$env:QA_NO_MEMBERSHIP_EMAIL = "<email>"
$env:QA_NO_MEMBERSHIP_PASSWORD = "<password>"
$env:QA_HSM_EMAIL = "<email>"
$env:QA_HSM_PASSWORD = "<password>"
$env:QA_TENANT_B_EMAIL = "<email>"
$env:QA_TENANT_B_PASSWORD = "<password>"
$env:QA_TENANT_B_ID = "<tenant-b-id>"
```

## 2. Verificar entorno

```powershell
npm run check:env
npm run unblock:orchestrate
node scripts/qa-security-p0-dry-run.mjs
node scripts/e2e-enteral-dry-run.mjs
node scripts/edge-function-deploy-dry-run.mjs
```

Evidencia esperada:
- variables marcadas como presentes;
- dry-runs sin riesgos frontend/repo;
- artifacts en `artifacts/readiness`, `artifacts/qa` y `artifacts/e2e`.

## 3. Desplegar Edge Function

Solo si `SUPABASE_ACCESS_TOKEN` esta presente y el dry-run queda listo:

```powershell
npx supabase functions deploy admin-invite-user --project-ref nxqnmfvftwrvkjfahmmz
```

Validar despues:

```powershell
npm run verify:pilot
```

Evidencia esperada:
- funcion `admin-invite-user` desplegada;
- no hay `service_role` en frontend;
- `user.invite` o `user.create` se audita solo cuando se pruebe con usuario autorizado.

## 4. Crear o invitar usuarios QA

Desde `/app/users` con usuario autorizado:

- `qa-no-membership@nutri.test`: Auth confirmado, sin membership activo.
- `qa-hsm-clinical@nutri.test`: HSM, rol no-superadmin.
- `qa-tenant-b-clinical@nutri.test`: Tenant B, rol no-superadmin.
- `qa-e2e-hsm@nutri.test`: HSM, permisos suficientes para E2E Enteral.

Evidencia esperada:
- memberships visibles en `/app/users`;
- `membership.create` / `membership.update` / `role.assign` en `/app/audit`;
- `qa-no-membership` sin membership activo.

## 5. Ejecutar QA Seguridad P0

```powershell
node scripts/qa-security-p0.mjs
```

Evidencia esperada:
- artifact `artifacts/security/qa-p0-<timestamp>.json`;
- anon bloqueado;
- usuario sin membership no lee datos clinicos;
- HSM no lee Tenant B;
- Tenant B no lee HSM;
- audit logs protegidos.

## 6. Ejecutar E2E Enteral

```powershell
node scripts/e2e-enteral-flow.mjs
```

Evidencia esperada:
- plan enteral creado desde UI;
- plan editado desde UI;
- log diario creado desde UI;
- tolerancia visible;
- alerta enteral desde log real;
- PatientDetail muestra soporte;
- plan pausado/cerrado;
- audit logs reales.

## 7. Confirmar report.exported

Con sesion autenticada:

1. Abrir `/app/reports`.
2. Generar preview real.
3. Exportar PDF.
4. Exportar XLSX.
5. Abrir `/app/audit`.
6. Confirmar `report.exported` con `format`, `report_type`, `tenant_id` y `actor_user_id`.

## 8. Actualizar docs

Actualizar:

- `docs/pilot-final-status.md`
- `docs/qa-security-p0.md`
- `docs/e2e-blockers.md`
- `docs/release-candidate-local.md`

No cerrar bloqueos sin evidencia.

## 9. Ejecutar verify final

```powershell
npm run build
npm run lint
npm test -- --run
npm run audit:clinical-claims
npm run audit:secrets
npm run verify:pilot
```

## 10. Preparar commit final

Antes de staging:

```powershell
git status --short
git diff --stat
```

No versionar:

- `.env*`
- `playwright/.auth/*`
- `storageState.json`
- `artifacts/*`
- `dist/`
- `build/`
- `test-results/`
- `playwright-report/`
