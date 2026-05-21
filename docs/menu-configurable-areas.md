# Menu configurable por areas

Estado: implementado localmente para navegacion y visualizacion. Persistencia remota de configuracion: pendiente.

## Objetivo

Nutri ahora usa un registry central para construir el menu lateral y el centro de modulos. El objetivo es permitir una experiencia profesional por areas de trabajo sin crear pantallas falsas ni simular configuracion persistente.

## Areas del menu

| Area | Uso | Modulos visibles principales | Estado |
|---|---|---|---|
| Centro operativo | Trabajo diario | Dashboard, Copilot, Alertas, Agenda, Mensajes | Activo segun permisos |
| Clinica | Flujo general de paciente | Pacientes, Planes, Antropometria, Screening | Activo segun permisos |
| Laboratorio | Resultados y tendencias | Labs | Activo |
| Nutricion | Operacion alimentaria | Alimentos, Recetas, Menu semanal | Activo segun permisos |
| Hospitalario | Soporte nutricional | Enteral, Parenteral basico | Parcial controlado |
| Pediatria | Crecimiento pediatrico | Curvas pediatricas | Parcial por CSV WHO/OMS faltantes |
| Deportivo | Perfil y somatocarta | Somatocarta, Comparador | Activo/parcial |
| Administracion | Gestion institucional | Usuarios, Organizacion, Settings, Auditoria | Activo/parcial |
| Reportes | Centro de reportes | Reportes | Parcial por auditoria export pendiente |
| Sistema | Readiness local | Centro de modulos, Configuracion de modulos | Activo/parcial local |

## Comportamiento del sidebar

- Agrupa modulos por area.
- Oculta modulos sin permiso para evitar acciones inaccesibles.
- Muestra badges para `Proximamente`, `Bloqueado` y modulos parciales.
- Copilot, Alertas y Mensajes pueden mostrar contadores si hay datos reales.
- La busqueda filtra por nombre, descripcion, permiso, pack o pendiente.
- El modo colapsado conserva iconos y navegacion.
- Un modulo sin ruta real no se presenta como enlace funcional.

## Centro de modulos

Ruta: `/app/modules`

Permite:

- buscar modulos;
- filtrar por area;
- ver permiso requerido;
- ver estado real;
- abrir solo rutas existentes;
- ver pendientes y bloqueos sin simular funcionalidad.

## Configuracion de modulos

Ruta: `/app/module-settings`

Estado actual:

- pantalla local de solo lectura;
- requiere `settings.manage`;
- toggles deshabilitados;
- no guarda cambios;
- muestra que la persistencia tenant-scoped esta pendiente.

## Paso a configuracion persistente

Para habilitar toggles reales se requiere:

1. Migracion `module_settings` tenant-scoped.
2. RLS por tenant.
3. Permisos `modules.read` y `modules.manage`, o equivalentes existentes.
4. Auditoria de cambios administrativos.
5. Integracion en `useModuleRegistry`.
6. Validacion remota con usuario autorizado.

No aplicar remoto sin `SUPABASE_DB_PASSWORD` y revision humana.

## Guardrails

- No se agregaron rutas falsas.
- No se uso service role en frontend.
- No se modifico `.env.local`.
- No se cerraron bloqueos externos.
- No se simularon datos clinicos.
- Configuracion persistente queda marcada como pendiente.
