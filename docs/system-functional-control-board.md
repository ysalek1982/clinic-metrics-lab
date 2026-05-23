# System functional control board

Fecha: 2026-05-22

Alcance: Macrofase 49. Se revisaron rutas SaaS y modulos criticos con usuarios QA reales, storage states locales temporales y Supabase remoto de desarrollo. No se hizo `git add`, commit ni push. Los datos creados usan prefijo QA y no representan datos clinicos reales.

| Orden | Modulo | Ruta | Usuario usado | Estado inicial | Errores encontrados | Correcciones aplicadas | Estado final | Revalidado segunda vuelta | Pendiente |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | SaaS Admin | `/app/saas-admin` | ysalek | SaaS Admin accesible; usuarios QA creados. | P1 previo: planes institucionales no activaban packs/modulos tenant. | Migracion `20260522193500_sync_plan_packs_modules.sql`; `qa:functional-auth` revalido 46 rutas por persona. | ysalek admin OK; usuarios normales bloqueados. | Si | Mutaciones comerciales profundas quedan para QA manual supervisada. |
| 2 | Free | `/app`, `/app/account`, rutas premium | Marcela Free | Free visible como Mi cuenta / Mi espacio. | Sin P0 nuevo. | Validacion autenticada remota; Free bloquea premium/administracion. | Correcto. | Si | Mantener Marcela como QA Free. |
| 3 | Pro | `/app/reports`, modulos profesionales | qa-pro | Usuario QA Pro existia. | Pro no puede leer auditoria institucional, lo cual es esperado. | Se uso QA Clinic para cerrar auditoria institucional `report.exported`; Pro queda sin SaaS Admin. | Correcto. | Si | Completar CRUD profesional modulo por modulo. |
| 4 | Clinic/Hospital | `/app/organization`, `/app/users`, `/app/audit`, hospitalario | qa-clinic | Clinic no tenia packs synced tras cambios de plan. | P1: Enteral bloqueado por falta de `tenant_enabled_packs/modules`. | RPC `sync_tenant_plan_modules`; re-sync remoto; E2E Enteral paso. | Correcto. | Si | QA tenant-cross clinico profundo pendiente. |
| 5 | Courtesy | rutas premium | qa-courtesy | Courtesy temporal disponible. | Sin P0/P1 automatico. | Storage state y ruta matrix autenticada. | Correcto para rutas/PlanGate. | Si | Validar expiracion real en fecha futura/manual. |
| 6 | No membership | `/app` | qa-no-membership | Auth user sin membership. | Sin P0 nuevo. | `qa:functional-auth` valida flujo bloqueado/activacion. | Correcto. | Si | Validar solicitud Free desde UI si se requiere. |
| 7 | Reports/export | `/app/reports`, `/app/audit` | qa-clinic | `report.exported` pendiente. | P1: E2E inicial con Pro no leia audit logs por RLS institucional. | Nuevo `e2e:report-export`; export PDF/XLSX; audit `report.exported` confirmado. | Cerrado. | Si | Mantener artifacts fuera de versionado. |
| 8 | Enteral | `/app/pack/enteral/cockpit` | qa-clinic | E2E Enteral pendiente. | P1: script dependia de tenant HSM; selectores estrictos; falta de confirmacion dialog pause/close. | E2E usa tenant activo, selectores robustos y confirma dialogs internos. | Cerrado con auditoria. | Si | Limpiar datos QA si se decide. |
| 9 | Module QA | rutas principales | anon/auth gate | QA superficial existente. | No cubria session matrix completa. | Se mantuvo `module-by-module-qa`; se agrego `qa:functional-auth`. | Sin crash/black screen en rutas cubiertas. | Si | CRUD profundo restante por modulo. |
| 10 | Popups internos | multiples | local QA | Auditoria existente. | Sin P0/P1 nuevo. | `audit-internal-popups` reejecutado. | Correcto segun auditor. | Si | Revisar manual formularios no cubiertos por E2E. |
| 11 | Pediatria WHO | `/app/pediatric-curves` | QA routes | Bloqueo conocido. | Sin CSV oficiales WHO/OMS. | Se mantiene bloqueo honesto; no z-score falso. | Parcial. | No | Importar CSV oficiales. |
| 12 | Seguridad clinica P0 | SaaS/clinico | varios | Scripts base listos. | QA P0 clinico profundo aun no prueba tenant-cross completo por tabla. | `qa:security-p0` ready y `qa:functional-auth` passed. | Parcial. | Si | Tenant-cross clinico completo por tablas. |

## Segunda vuelta

- `qa:functional-auth`: passed, 46 rutas autenticadas, 0 fallos.
- `e2e:enteral`: passed contra Vercel con QA Clinic.
- `e2e:report-export`: passed contra Vercel con QA Clinic.
- `qa:security-p0`: ready con storage states reales.
- `qa:plangate`: ready con matriz generada.

## No versionar

- `artifacts/*`
- `playwright/.auth/*`
- `.env*`
- `storageState.json`
- `dist/`
- `build/`
- `test-results/`
- `playwright-report/`
- capturas/traces/logs pesados salvo decision explicita.
## Macrofase 50 - Cierre 2026-05-23

| Orden | Modulo | Ruta | Usuario usado | Estado inicial | Errores encontrados | Correcciones aplicadas | Estado final | Revalidado segunda vuelta | Pendiente |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | Visual global / tema | global | Marcela Free | Sin selector light/dark | P2 legibilidad/tema | ThemeToggle, useTheme, tokens CSS | Funcional | Si | Mobile fino |
| 2 | SaaS Free | /app, /app/tenants | Marcela Free | Copy institucional residual | P1 link/UX SaaS no admin; P2 texto | TenantSelector + Dashboard personal | Funcional | Si | Ninguno critico |
| 3 | SaaS Admin | /app/saas-admin | ysalek/QA | Base funcional | Sin P0 en scripts | QA SaaS + PlanGate + security | Funcional | Si | Mutaciones destructivas limitadas |
| 4 | Reportes | /app/reports | qa-clinic | Pendiente report.exported | Ninguno tras fix previo | E2E PDF/XLSX + audit real | Cerrado | Si | Mas tipos de reporte |
| 5 | Enteral | /app/pack/enteral/cockpit | qa-clinic | Pendiente E2E | Ninguno tras fix previo | E2E remoto + audit + RLS anon | Cerrado | Si | Mas escenarios clinicos |
| 6 | Modulos restantes | rutas principales | QA automatizado | Sin evidencia profunda completa | Sin P0 por route QA | module-by-module QA + popups audit | Operativo por ruta | Si | CRUD manual profundo |

Referencia completa: `docs/five-pass-module-audit.md` y `docs/five-pass-final-report.md`.
# Macrofase 51 - Control Board Update

Fecha local: 2026-05-23.

| Orden | Modulo | Ruta | Usuario usado | Estado inicial | Errores encontrados | Correcciones aplicadas | Estado final | Revalidado segunda vuelta | Pendiente |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | Pacientes / expediente | `/app/patients`, `/app/patients/:id` | QA Clinic | Parcial | Sin P0 nuevo | CRUD persistente QA paciente/contacto/audit | Validado | Si | Revision humana con datos reales |
| 2 | Agenda | `/app/agenda` | QA Clinic | Parcial | Sin P0 nuevo | Cita create/complete/cancel/audit | Validado | Si | Recurrentes |
| 3 | Mensajes | `/app/messages` | QA Clinic | Parcial | Sin P0 nuevo | Hilo/mensaje/read/close/audit | Validado | Si | Asignacion avanzada |
| 4 | Alertas | `/app/alerts` | QA Clinic | Parcial | Sin P0 nuevo | Reviewed/resolved/audit | Validado | Si | Acciones masivas amplias |
| 5 | Labs | `/app/labs` | QA Clinic | Parcial | P1 en valores QA invalidos | Marcador/estado validos y audit | Validado | Si | Interpretacion clinica amplia |
| 6 | Nutricion operativa | `/app/foods`, `/app/recipes`, `/app/weekly-menu` | QA Clinic | Parcial | P1 en valores QA invalidos | Food/recipe/menu persistentes | Validado | Si | Dataset nutricional amplio |
| 7 | Parenteral | `/app/pack/parenteral` | QA Clinic | E2E pendiente | P1: sin E2E dedicado | `e2e:parenteral` create/update/log/close/audit | Cerrado basico | Si | No avanzado |
| 8 | Pediatria | `/app/pediatric-curves` | QA Clinic | Parcial | Sin P0 nuevo | Validado z-score/percentil nulos | Seguro | Si | CSV WHO/OMS oficiales |
| 9 | Deportivo / Somatocarta | `/app/somatocarta` | QA Clinic | Parcial | Sin P0 nuevo | Perfil/snapshot persistente | Validado | Si | Mas mediciones |
| 10 | Administracion general / Mobile | Varias | Marcela, QA Clinic, ysalek | Parcial | P0 Free pack premium; P2 overflow | PackView PlanGate; sidebar/topbar responsive | Validado | Si | QA manual dispositivos reales |

Evidencia: `qa:critical-crud`, `qa:mobile`, `qa:functional-auth`, `e2e:parenteral`, `e2e:enteral`, `e2e:report-export`, `qa:security-p0`, `qa:plangate`.
