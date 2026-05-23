# Validacion visual autenticada SaaS

Fecha/hora: 2026-05-21, America/La_Paz.

Validacion ejecutada con navegador real sobre Nutri local `http://127.0.0.1:8082`. No se imprimieron secretos. No se hizo deploy, commit, push ni staging.

Artifact principal:

- `artifacts/saas-ui-validation/2026-05-21T18-42-13-361Z/authenticated-ui-validation.json`

Screenshots:

- `artifacts/saas-ui-validation/2026-05-21T18-42-13-361Z/ysalek-saas-admin-dashboard.png`
- `artifacts/saas-ui-validation/2026-05-21T18-42-13-361Z/ysalek-saas-admin-planes.png`
- `artifacts/saas-ui-validation/2026-05-21T18-42-13-361Z/marcela-dashboard-free.png`
- `artifacts/saas-ui-validation/2026-05-21T18-42-13-361Z/marcela-modules-plan-gate.png`

Resultado del script visual autenticado: 21 checks, 0 warnings, 0 failures.

| Usuario | Rol | Plan | Ruta | Resultado | Evidencia |
|---|---|---|---|---|---|
| `ysalek@gmail.com` | `platform_superadmin` | Admin plataforma | `/app/saas-admin` | Carga SaaS Admin y muestra tabs requeridas. | Screenshot `ysalek-saas-admin-dashboard.png`. |
| `ysalek@gmail.com` | `platform_superadmin` | Admin plataforma | `/app/saas-admin` tab Planes | Ve `Free`, `Pro` y `Clinic/Hospital`. | Screenshot `ysalek-saas-admin-planes.png`. |
| `ysalek@gmail.com` | `platform_superadmin` | Admin plataforma | Dialogs SaaS | Abre dialogs internos para asignar plan, cortesia tenant y dar cortesia; se cancelo sin guardar. | Checks `ysalek-dialog-*`. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app` | Login correcto y dashboard visible con cuenta Free. | Screenshot `marcela-dashboard-free.png`. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | Sidebar | No aparece SaaS Admin. | Check `marcela-sidebar-no-saas-admin`. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/saas-admin` directo | Protegido: redirige de forma segura a `/app`; no ve panel SaaS. | Check `marcela-saas-admin-protected`. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/modules` | PlanGate/estado de plan visible para modulos limitados. | Screenshot `marcela-modules-plan-gate.png`. |

## Seguridad remota verificada

| Control | Resultado | Evidencia sin secretos |
|---|---|---|
| Anon no lee datos SaaS privados | Pasa | `access_requests`, `tenant_subscriptions` y `subscription_events` devuelven 0 filas visibles para anon. |
| Anon no ejecuta RPC admin | Pasa | `admin_list_access_requests` responde usuario autenticado requerido. |
| Marcela no ejecuta RPC admin | Pasa | `admin_list_access_requests` responde permiso de plataforma requerido. |
| Marcela no asigna roles | Pasa | `admin_assign_role_to_user` responde no autorizado. |
| ysalek ve SaaS Admin | Pasa | UI autenticada con magic link seguro y tenant HSM seleccionado. |

## Vercel

Validacion sin sesion inicial contra `https://clinic-metrics-lab.vercel.app` antes del deploy frontend:

| Ruta | Resultado | Interpretacion |
|---|---|---|
| `/login` | 200, muestra Nutri. | Frontend remoto base responde. |
| `/app` | Redirige a `/login`. | Proteccion esperada sin sesion. |
| `/app/modules` | Redirige a `/login`. | Proteccion esperada sin sesion. |
| `/app/module-settings` | Redirige a `/login`. | Proteccion esperada sin sesion. |
| `/app/saas-admin` | 404 remoto sin sesion. | El frontend remoto no contenia la ruta SaaS Admin actual antes del deploy. |

## Vercel actualizado

Fecha/hora: 2026-05-21.

| Ambiente | URL | Resultado |
|---|---|---|
| Preview | `https://clinic-metrics-mh9bnz4ci-ysaleks-projects.vercel.app` | Rutas protegidas responden SPA y redirigen a login; `/app/saas-admin` ya no devuelve 404. |
| Produccion | `https://clinic-metrics-lab.vercel.app` | Deploy aplicado; `/app/saas-admin` ya no devuelve 404 y sin sesion redirige a `/login`. |
| Produccion ysalek | `/app/saas-admin` | SaaS Admin validado con sesion real; tabs y planes visibles. |
| Produccion Marcela | `/app` y `/app/modules` | Login OK, plan Free visible, SaaS Admin oculto/protegido y PlanGate visible. |

Artifacts remotos:

- `artifacts/saas-ui-validation/vercel-2026-05-21T19-31-04-184Z/authenticated-ui-validation-vercel.json`
- `artifacts/saas-ui-validation/vercel-subscriptions-2026-05-21T19-32-22-479Z/ysalek-subscriptions-validation.json`

Nota Macrofase 45: la pestana `Usuarios` de SaaS Admin ya no es solo informativa. Queda conectada a `admin_list_memberships`, muestra memberships reales, busqueda, plan por tenant, roles, drawer de detalle y permisos efectivos via `admin_list_effective_permissions`. La revalidacion visual autenticada de esta mejora queda pendiente hasta contar con password/storage state disponible en esta sesion.

## Macrofase 46

Fecha/hora: 2026-05-21.

| Usuario | Ruta | Resultado | Evidencia |
|---|---|---|---|
| Sin sesion | `https://clinic-metrics-lab.vercel.app/app/saas-admin` | Produccion responde 200 como SPA y mantiene auth gate. | `curl -I -L` y `SMOKE_BASE_URL=https://clinic-metrics-lab.vercel.app npm run smoke:routes`. |
| ysalek | `/app/saas-admin` | Pendiente de revalidacion autenticada del tab Usuarios corregido. | Bloqueado: `YSALEK_PASSWORD` y `playwright/.auth/ysalek.json` ausentes. |
| Marcela Free | `/app` y `/app/saas-admin` directo | Pendiente de revalidacion autenticada despues del deploy. | Bloqueado: `MARCELA_TEMP_PASSWORD`/`MARCELA_PASSWORD` y `playwright/.auth/marcela-free.json` ausentes. |
| QA Pro/Clinic/Courtesy | PlanGate por plan | Pendiente. | Bloqueado: passwords/storage states ausentes. |

Scripts preparados:

- `npm run auth:storage`
- `npm run qa:security-p0`
- `npm run qa:plangate`

Estos scripts no imprimen passwords y no cierran QA si faltan storage states.

## Pendiente

- Versionar y revisar manualmente el deploy frontend actual; no se hizo commit ni push.
- QA Seguridad P0 con usuarios reales definidos.
- Probar sesiones visuales Pro, Clinic/Hospital y Courtesy con usuarios dedicados; por ahora el catalogo se valido visualmente en SaaS Admin y por DB/RPC.
- Evidencia autenticada de `report.exported`.
- Edge Function `admin-invite-user` deploy si se decide usar invitaciones Auth desde UI.

## Fase 47 - Marcela Free en produccion

Fecha: 2026-05-21.

| Usuario | Rol | Plan | Ruta | Resultado | Evidencia |
|---|---|---|---|---|---|
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app` | Carga autenticada y muestra `Panel de mi espacio`. | Playwright con storage state temporal, dominio produccion. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/account` | Muestra `Mi cuenta`, `Mi espacio` y estado Free. | Playwright autenticado. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/modules` | No muestra contenido institucional funcional. | Playwright autenticado. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/organization` | Bloqueado con `No tienes acceso a esta vista`. | Playwright autenticado. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/settings` | Bloqueado con `No tienes acceso a esta vista`. | Playwright autenticado. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/users` | Bloqueado con `No tienes acceso a esta vista`. | Playwright autenticado. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/audit` | Bloqueado con `No tienes acceso a esta vista`. | Playwright autenticado. |
| `marcelacruz2000@gmail.com` | `free_member` | `free` | `/app/saas-admin` | Redirige de forma segura a `/app`; no ve SaaS Admin. | Playwright autenticado. |

Validacion ysalek Fase 47: DB remota confirmaba rol platform y permisos SaaS; la validacion visual quedo pendiente en esa fase por falta de storage state. Fase 48 la completa con storage temporal generado server-side.

## Fase 48 - Validacion comercial autenticada

Fecha: 2026-05-21.

| Usuario | Rol | Plan | Ruta | Resultado | Evidencia |
|---|---|---|---|---|---|
| `ysalek@gmail.com` | `platform_superadmin` | Plataforma | `/app/saas-admin` | Carga SaaS Admin con todas las tabs requeridas. | Storage state temporal generado server-side sin imprimir secretos. |
| `ysalek@gmail.com` | `platform_superadmin` | Plataforma | Tab Usuarios | Busca Marcela, abre drawer, ve plan Free, roles, permisos efectivos y acciones de Pro/Courtesy. | Artifact `artifacts/saas-ui-validation/fase48-ysalek-users-tab-*.json`. |
| `marcelacruz2000@gmail.com` | `free_member` | Free | `/app` | Ve `Panel de mi espacio`, plan Free y no ve SaaS Admin. | Playwright autenticado. |
| `marcelacruz2000@gmail.com` | `free_member` | Free | `/app/reports` | Bloqueado para Free. | PlanGate/forbidden autenticado. |
| `qa-pro@nutri.test` | `clinical_nutritionist` | Pro | `/app/reports` | Acceso permitido despues de corregir `reports.export` para Pro. | Artifact `artifacts/plangate/plangate-real-users-postfix-*.json`. |
| `qa-clinic@nutri.test` | `tenant_owner` | Clinic/Hospital | `/app/organization`, `/app/users`, `/app/audit` | Acceso institucional permitido; no ve SaaS Admin global. | Artifact PlanGate usuarios reales. |
| `qa-courtesy@nutri.test` | `clinical_nutritionist` | Courtesy | `/app/account`, `/app/reports` | Badge Courtesy visible y Reports permitido temporalmente; no ve SaaS Admin. | Artifact PlanGate usuarios reales. |
| `qa-no-membership@nutri.test` | Sin membership | Sin plan | `/app` | Redirige a `/activate`; no entra al sistema completo. | Artifact PlanGate usuarios reales. |

Storage states usados para esta validacion son temporales y no deben versionarse.

## Macrofase 49 - Vercel autenticado

Fecha: 2026-05-22.

| Usuario | Rol | Plan | Ruta | Resultado | Evidencia |
|---|---|---|---|---|---|
| `ysalek@gmail.com` | `platform_superadmin` | Plataforma | `/app/saas-admin` | Rutas platform admin siguen permitidas. | `qa:functional-auth`, artifact `authenticated-functional-2026-05-22T19-57-06-969Z.json`. |
| `marcelacruz2000@gmail.com` | `free_member` | Free | `/app/account` | Mi cuenta/Mi espacio permitido; admin/premium bloqueado. | `qa:functional-auth`. |
| `qa-pro@nutri.test` | `clinical_nutritionist` | Pro | `/app/reports` | Reportes permitidos; SaaS Admin bloqueado. | `qa:functional-auth`. |
| `qa-clinic@nutri.test` | `tenant_owner` | Clinic/Hospital | `/app/organization`, `/app/users`, `/app/audit`, `/app/pack/enteral/cockpit` | Acceso institucional y hospitalario permitido; SaaS Admin global bloqueado. | `qa:functional-auth`, `e2e:enteral`, `e2e:report-export`. |
| `qa-courtesy@nutri.test` | `clinical_nutritionist` | Courtesy | rutas premium esperadas | Acceso temporal esperado; SaaS Admin bloqueado. | `qa:functional-auth`. |
| `qa-no-membership@nutri.test` | Sin membership | Sin plan | `/app` | Sistema completo bloqueado; flujo de activacion esperado. | `qa:functional-auth`. |

Storage states creados durante esta fase deben borrarse o mantenerse fuera de versionado antes de cierre.
