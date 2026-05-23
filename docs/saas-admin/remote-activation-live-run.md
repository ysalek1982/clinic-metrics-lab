# Run remoto SaaS comercial

Fecha/hora: 2026-05-21, America/La_Paz.

Este documento registra la activacion remota SaaS comercial. No contiene secretos ni valores completos de variables.

## Recursos

| Variable/Recurso | Estado | Uso | Accion |
|---|---|---|---|
| `SUPABASE_DB_PASSWORD` | Presente | Aplicar migraciones remotas con DB URL en memoria. | Usado sin imprimir valor. |
| `SUPABASE_ACCESS_TOKEN` | Presente | Deploy de Edge Functions si corresponde. | No se desplego Edge Function en esta fase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Presente | Crear/confirmar usuarios Auth desde script server-side temporal si hiciera falta. | No fue necesario crear Marcela: el Auth user ya existia y estaba confirmado. |
| `MARCELA_TEMP_PASSWORD` | Presente | Validar login de Marcela sin imprimir password. | Usado solo en memoria. |
| `VITE_SUPABASE_URL` | Presente | Validaciones REST/RPC con publishable key. | Usado solo en memoria. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Presente | Validaciones REST/RPC anon y autenticadas. | Usado solo en memoria. |

## Resultado operativo

| Area | Estado | Evidencia sin secretos | Accion siguiente |
|---|---|---|---|
| Preflight local | Pasa | Build, lint, 152 tests, QA SaaS y auditorias locales pasan antes de aplicar remoto. | Mantener validacion antes de commit. |
| Migraciones remotas | Aplicadas | `db push --include-all` remoto aplicado desde directorio temporal para evitar parseo de `.env.local`. | No repetir salvo migraciones nuevas. |
| Schema cache | Recargado | `NOTIFY pgrst, 'reload schema';` ejecutado. | Ninguno. |
| Modelo comercial remoto | Activo | Tablas, RPCs y planes `free`, `pro`, `clinic_hospital`, `courtesy` presentes. | QA con usuarios reales antes de piloto. |
| ysalek platform admin | Confirmado | `ysalek@gmail.com` tiene `platform_superadmin` y `saas.manage`. | Validar UI manual con sesion ysalek. |
| Marcela | Confirmada con Free | Login OK, email confirmado, tenant Free personal, rol `free_member`, plan `free` activo. | Si se requiere premium, otorgar Courtesy con vencimiento desde SaaS Admin. |
| RLS anon | Protegido | REST anon devuelve 0 filas en tablas SaaS privadas; RPC admin anon bloqueada. | QA P0 sigue pendiente con usuarios QA reales. |

## Migraciones aplicadas

| Migracion | Estado | Nota |
|---|---|---|
| `20260521153000_saas_admin_approvals_and_courtesy_memberships.sql` | Aplicada | Solicitudes, invitaciones, grants, RPCs SaaS base. |
| `20260521165000_saas_subscription_plans_and_time_limited_courtesies.sql` | Aplicada | Planes, entitlements, subscriptions y eventos. |
| `20260521172000_commercial_saas_free_pro_clinic_hospital.sql` | Aplicada | Free, Pro, Clinic/Hospital, Courtesy y Free por defecto. |
| `20260521183000_saas_admin_role_permission_rpcs.sql` | Aplicada | RPCs para asignar/quitar roles y listar permisos efectivos. |
| `20260521184500_fix_ensure_free_subscription_rpc_aliases.sql` | Aplicada | Correccion de alias en RPC Free. |
| `20260521190000_fix_ensure_free_subscription_conflicts.sql` | Aplicada | Correccion de constraints `ON CONFLICT`. |
| `20260521190500_fix_ensure_free_subscription_role_aliases.sql` | Aplicada | Correccion de alias de roles. |
| `20260521191000_fix_ensure_free_subscription_membership_conflict.sql` | Aplicada | Correccion de conflicto en `membership_roles`. |

## Nota tecnica

`.env.local` usa sintaxis PowerShell (`$env:KEY=...`). El CLI de Supabase intenta parsear `.env.local` si se ejecuta desde el repo y falla con ese formato. Para ejecutar remoto se uso un directorio temporal sin `.env.local`, leyendo variables solo en memoria.
