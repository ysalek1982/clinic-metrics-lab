# Matriz de acceso por plan SaaS

Fecha: 2026-05-21

| Modulo | Free | Pro | Clinic/Hospital | Platform Admin |
|---|---|---|---|---|
| Dashboard | Permitido | Permitido | Permitido | Permitido |
| Mi cuenta | Permitido | Permitido | Permitido | Permitido |
| Pacientes | Limitado | Permitido | Permitido | Permitido |
| Agenda | Basica | Permitido | Permitido | Permitido |
| Labs | Bloqueado/limitado por permisos | Permitido | Permitido | Permitido |
| Reports | Lectura limitada | Permitido | Institucional | Permitido |
| Copilot | Bloqueado por plan salvo upgrade | Permitido | Permitido | Permitido |
| Foods | Segun permiso basico | Permitido | Permitido | Permitido |
| Recipes | Bloqueado/limitado | Permitido | Permitido | Permitido |
| WeeklyMenu | Bloqueado/limitado | Permitido | Permitido | Permitido |
| PediatricCurves | Basico | Permitido | Permitido | Permitido |
| Somatocarta | Bloqueado/limitado | Permitido | Permitido | Permitido |
| Enteral | Bloqueado | Basico si entitlement activo | Institucional | Permitido |
| Parenteral | Bloqueado | Bloqueado/basico segun entitlement | Institucional | Permitido |
| Users | Oculto/bloqueado | Oculto/bloqueado | Permitido con rol tenant admin | Permitido |
| Organization | Oculto/bloqueado | Oculto/bloqueado | Permitido con rol tenant admin | Permitido |
| Settings | Oculto/bloqueado | Oculto/bloqueado | Permitido con rol tenant admin | Permitido |
| Audit | Oculto/bloqueado | Oculto/bloqueado | Permitido con rol tenant admin | Permitido |
| ModuleSettings | Oculto/bloqueado | Oculto/bloqueado | Permitido con rol tenant admin | Permitido |
| SaaS Admin | Bloqueado | Bloqueado | Bloqueado | Permitido |

## Validaciones en codigo

- El menu usa `moduleRegistry.planFeature` y `getModuleAccess`.
- Las rutas institucionales usan `RequireTenantPermission` con `planFeature`.
- `/app/account` queda disponible para Free y Pro como vista comercial personal.
- `/app/saas-admin` sigue bajo `RequirePlatformAdmin`.
- `ModulesCenter` muestra modulos visibles para el usuario/plan actual, no tarjetas institucionales ocultas por plan.

## Validacion remota Fase 47

- `20260521194000_commercial_saas_institutional_entitlements.sql` fue aplicada al remoto.
- Marcela Free fue validada con sesion autenticada en produccion.
- `/app` muestra `Panel de mi espacio`.
- `/app/account` muestra `Mi cuenta`.
- `/app/organization`, `/app/settings`, `/app/users` y `/app/audit` quedan bloqueadas.
- `/app/saas-admin` redirige a `/app` para Marcela.

## Validacion remota Fase 48

- ysalek accede a SaaS Admin con sesion real generada server-side.
- ysalek ve a Marcela en tab Usuarios, abre drawer, ve roles/permisos y acciones Pro/Courtesy.
- Marcela fue subida temporalmente a Pro y restaurada a Free.
- Marcela recibio Courtesy 7 dias, se valido badge/estado y luego se cancelo.
- Estado final Marcela: `free` + `free_member`.
- QA Pro (`qa-pro@nutri.test`) abre Reports y no ve SaaS Admin.
- QA Clinic (`qa-clinic@nutri.test`) ve Organization, Users y Audit institucionales, no SaaS Admin global.
- QA Courtesy (`qa-courtesy@nutri.test`) ve Courtesy y abre Reports, no SaaS Admin.
- QA sin membership (`qa-no-membership@nutri.test`) redirige a activacion y no entra al sistema completo.
