# QA Seguridad P0 Multi-Tenant

## Objetivo

Validar que ningun usuario autenticado pueda ver datos de otro tenant y que un usuario autenticado sin membership no vea datos clinicos.

## Estado actual

QA Seguridad P0 sigue bloqueado por falta de usuarios Auth confirmados y credenciales. No se debe cerrar esta prueba con platform superadmin, SQL privilegiado ni service role.

## Usuarios requeridos

- `qa-no-membership@nutri.test`: Auth confirmado, sin membership activo.
- `qa-hsm-clinical@nutri.test`: tenant HSM `11111111-1111-4111-8111-111111111111`, rol clinico no-superadmin.
- `qa-tenant-b-clinical@nutri.test`: tenant B real, rol clinico no-superadmin.
- `qa-e2e-hsm@nutri.test`: tenant HSM, permisos suficientes para E2E Enteral.

## Variables necesarias

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `QA_NO_MEMBERSHIP_EMAIL`
- `QA_NO_MEMBERSHIP_PASSWORD`
- `QA_HSM_EMAIL`
- `QA_HSM_PASSWORD`
- `QA_TENANT_B_EMAIL`
- `QA_TENANT_B_PASSWORD`
- `QA_TENANT_B_ID`

No usar service role para estas pruebas.

## Script no destructivo

Ejecutar cuando existan usuarios/credenciales:

```bash
node scripts/qa-security-p0.mjs
```

El script debe generar un JSON en `artifacts/security/` y no debe crear, modificar ni borrar datos clinicos.

## Tablas cubiertas

`patients`, `encounters`, `clinical_assessments`, `clinical_notes`, `nutrition_plans`, `lab_orders`, `lab_results`, `alert_acknowledgements`, `appointments`, `message_threads`, `messages`, `message_read_receipts`, `recipes`, `recipe_ingredients`, `weekly_menus`, `weekly_menu_items`, `food_items`, `report_runs`, `pediatric_growth_records`, `pediatric_growth_results`, `enteral_plans`, `enteral_daily_logs`, `parenteral_plans`, `parenteral_monitoring_logs`, `sports_profiles`, `sports_bodycomp_snapshots`, `audit_logs`, `tenant_memberships`, `membership_roles`.

## Evidencia parcial ya disponible

- Anonimo validado en tablas enterales/parenterales con `200 []`.
- Gestion admin remota validada: `admin_list_memberships`, `admin_update_membership_status`, `admin_upsert_membership`.
- Auditoria admin validada: `membership.update`, `membership.deactivate`, `membership.reactivate`, `role.assign`.

## Criterio de cierre

- Anonimo no lee datos clinicos.
- Usuario sin membership no lee datos clinicos.
- Tenant HSM no lee tenant B.
- Tenant B no lee HSM.
- Mutaciones respetan permisos.
- `audit_logs` no filtra eventos cross-tenant.
- No hay demo autenticado ni bypass local.
