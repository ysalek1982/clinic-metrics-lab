# Guia de perfiles operativos

Nutri puede organizar la experiencia por perfiles operativos sin cambiar la fuente de datos. Esta configuracion es local/visual por ahora: no guarda preferencias por tenant hasta tener una tabla tenant-scoped con RLS y auditoria.

| Perfil | Modulos | Para quien | Estado | Pendiente |
|---|---|---|---|---|
| Hospital | Pacientes, Enteral, Parenteral, Labs, Alertas, Agenda, Reportes, Copilot | Hospitales y equipos de soporte nutricional | Local visual | Persistencia tenant-scoped, QA P0, E2E Enteral |
| Consulta clinica | Pacientes, Antropometria, Planes, Agenda, Recetas, Menu semanal, Reportes | Consultorio y seguimiento ambulatorio | Local visual | Persistencia tenant-scoped |
| Deportivo | Perfil deportivo, Somatocarta, Antropometria, Planes, Reporte deportivo, Copilot | Clubes, alto rendimiento y evaluacion deportiva | Local visual | Datos suficientes para somatotipo cuando aplique |
| Pediatria | Curvas pediatricas, Pacientes, Antropometria, Planes, Labs, Agenda | Pediatria y crecimiento infantil | Parcial controlado | CSV oficiales WHO/OMS para z-score/percentil completo |
| Nutricion operativa | Alimentos, Recetas, Menu semanal, Reportes, Configuracion | Cocina clinica y operacion nutricional | Local visual | Persistencia tenant-scoped |
| Administracion | Usuarios, Organizacion, Auditoria, Reportes, Centro de modulos | Administradores y superadministracion | Local visual | Edge Function deploy y usuarios QA reales |

## Como funciona hoy

- Los perfiles viven en `src/config/operationalProfiles.ts`.
- El sidebar permite elegir una vista de perfil local y destaca los modulos incluidos.
- Dashboard muestra un perfil sugerido usando senales disponibles: packs habilitados, datos hospitalarios, datos operativos o permisos administrativos.
- `/app/module-settings` muestra los perfiles, sus modulos, pendientes y botones de aplicacion deshabilitados.

## Como agregar un perfil

1. Agregar una entrada en `OPERATIONAL_PROFILES`.
2. Usar solo IDs existentes en `MODULE_REGISTRY`.
3. Definir `requiredPermissions`, `defaultLandingRoute`, `blockedRequirements` y `recommendedFor`.
4. Ejecutar `npm test -- --run` para validar unicidad, rutas y modulos existentes.

## Como pasar a persistencia real

Se requiere una migracion nueva y revision de seguridad:

- Tabla tenant-scoped, por ejemplo `tenant_module_profile_settings`.
- Columnas minimas: `tenant_id`, `profile_id`, `enabled_module_ids`, `created_by`, `updated_by`, timestamps.
- RLS por tenant activo y permisos `modules.read` / `modules.manage` o equivalentes.
- Audit logs para `module_profile.update`.
- UI con toggles habilitados solo cuando el backend exista y responda.

No ejecutar `db push` ni desplegar cambios remotos sin `SUPABASE_DB_PASSWORD` y revision humana.
