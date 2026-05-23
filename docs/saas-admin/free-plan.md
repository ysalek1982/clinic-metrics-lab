# Plan Free

`free` es el plan base del modelo SaaS comercial. Permite entrada basica sin privilegios administrativos y sin modulos premium.

## Estado

| Elemento | Estado |
|---|---|
| Definicion local | Implementada en migracion comercial. |
| Aplicacion remota | Aplicada en Supabase remoto de desarrollo. |
| Asignacion automatica | Validada por RPC `ensure_free_subscription_for_current_user()`. |
| Admin SaaS | Puede asignar Free a un tenant desde las RPCs/panel SaaS protegidos. |

## Alcance

| Capacidad | Estado en Free |
|---|---|
| Dashboard basico | Incluido |
| Pacientes lectura/gestion limitada | Incluido con limites bajos |
| Antropometria basica | Incluido |
| Agenda basica | Incluido |
| Reportes basicos | Incluido |
| Copilot completo | Bloqueado o limitado por plan |
| Usuarios adicionales | Bloqueado |
| Enteral/parenteral avanzado | Bloqueado |
| Exportaciones avanzadas | Bloqueado |
| SaaS Admin | Bloqueado |

## Regla de seguridad

Free no otorga `platform_superadmin`, `saas.manage`, `users.manage` ni permisos de administracion de planes. El usuario normal no puede autoasignarse Pro, Clinic/Hospital ni Courtesy.

## Validacion remota

- Marcela inicio sesion con Auth confirmado.
- `ensure_free_subscription_for_current_user()` creo/aseguro tenant personal Free.
- Rol asignado: `free_member`.
- Plan activo: `free`.
- No se asigno `platform_superadmin`.
- No tiene `saas.manage`.

PlanGate Free fue validado visualmente con Marcela en UI autenticada local. Pendiente: ejecutar QA P0 con usuarios reales y validar Vercel despues de deploy frontend autorizado.

## Experiencia comercial corregida

- Free tiene tenant tecnico propio para aislar datos por RLS, pero la UI lo muestra como `Mi espacio`.
- El usuario Free entra a `/app/account` para ver plan, limites y solicitar upgrade/cortesia.
- `Organizacion`, `Usuarios`, `Roles`, `Auditoria institucional`, `Configuracion institucional` y `SaaS Admin` quedan ocultos o bloqueados.
- Si un usuario Free intenta una URL institucional directa, la ruta debe mostrar bloqueo por plan, no pantalla blanca.
- Marcela se mantiene como usuario QA Free representativo de cualquier usuario nuevo.
## Fase 48 - Validacion Free

Marcela (`marcelacruz2000@gmail.com`) representa usuario Free QA:

- Entra a `/app`.
- Ve `Mi cuenta / Mi espacio`.
- No ve Organizacion institucional.
- No ve SaaS Admin.
- `/app/reports` queda bloqueado para Free.
- No puede ejecutar RPC admin ni autoescalarse.
- Despues de las pruebas Pro/Courtesy, Marcela quedo restaurada a `free` con rol `free_member`.
