# Design System local Nutri

Fecha: 2026-05-11

Objetivo: mantener una experiencia consistente, oscura y clinica tipo Clinical Command Center, alineada al prototipo Nutrition OS sin copiar datos demo.

| Componente | Uso | Variante | Ejemplo visual/textual | Estado |
|---|---|---|---|---|
| `PageHeader` | Encabezado de modulo | Meta, titulo, subtitulo, acciones | "Reportes avanzados" + badge Datos reales | Activo |
| `KpiCard` | Metricas ejecutivas | Normal, tendencia, sparkline | Pacientes activos, Labs criticos | Activo |
| `RiskBadge` | Riesgo clinico | Bajo, Moderado, Alto, Critico | Badge compacto uppercase | Activo |
| `PackPill` | Identificar packs | xs, sm | CCORP, Enteral, Deportivo | Activo |
| `SourceStateBadge` | Fuente real/fallback/demo | real, fallback, demo | Datos reales | Activo |
| `ModuleState` | Estado visible reutilizable | loading, empty, error, forbidden, warning | "No hay datos reales suficientes" | Nuevo |
| `EmptyState` | Listas/tablas vacias | Panel compacto | "No hay recetas registradas" | Nuevo |
| `ForbiddenState` | Sin permiso UI | Panel de acceso restringido | "No tienes permiso..." | Nuevo |
| `ErrorState` | Error controlado | Panel de error visible | "No se pudo cargar..." | Nuevo |
| `LoadingState` | Carga controlada | Spinner + texto | "Cargando modulo..." | Nuevo |
| Tablas clinicas | Datos densos | Header sticky si aplica | Pacientes, labs, recetas | Patron existente |
| Drawers | Formularios/edicion | Titulo + descripcion + scroll | Crear plan enteral | Patron existente |
| Badges | Estado y categoria | Uppercase tecnico | Activo, Cerrado, Requiere datos | Patron existente |

## Reglas de composicion

- Usar cards para items repetidos, KPIs y paneles funcionales. No anidar cards dentro de cards.
- Usar tablas cuando el usuario compara mas de 5 registros o columnas tecnicas.
- Usar drawer para crear/editar sin perder contexto.
- Usar dialog solo para confirmaciones o acciones destructivas.
- Usar badge para estado, riesgo, fuente y disponibilidad.
- Mantener labels tecnicos en uppercase cuando son categorias o estados.
- Mantener botones reales. Si no existe accion real, deshabilitar y marcar `Proximamente` o explicar requisito.

## Riesgo y severidad

| Estado | Color visual | Uso |
|---|---|---|
| Bajo | Verde | Riesgo bajo, tolerancia adecuada |
| Moderado | Amarillo | Seguimiento, advertencia |
| Alto | Naranja | Prioridad clinica |
| Critico | Rojo | Requiere revision inmediata |

## Mensajes estandar

- Proximamente: `Esta accion requiere backend/export real y esta deshabilitada para piloto.`
- Datos insuficientes: `Datos insuficientes para calcular este indicador sin inventar resultados.`
- Referencia incompleta: `Referencia incompleta: no se calcula z-score ni percentil.`
- Sin tenant activo: `No hay una organizacion activa seleccionada.`
- Sin permiso: `No tienes permiso para acceder a este modulo.`
- Error controlado: `No se pudo cargar la informacion del modulo.`

## Guardrails visuales

- No mostrar DEMO con sesion autenticada.
- No depender de ErrorBoundary para loading/empty/forbidden.
- No dejar pantalla negra o DOM vacio.
- No mostrar codigos tecnicos al usuario si existe traduccion en `presentation.ts`.

## Aplicacion en Macrofase 28

Pantallas con estados comunes y formatters aplicados o reforzados:

| Pantalla | Estado aplicado | Formato aplicado | Nota |
|---|---|---|---|
| Dashboard | Estado tenant activo ya visible | KPIs y porcentajes es-BO | `Generar informe` queda gateado por permisos de reportes |
| Labs | Estado existente | Valores y fecha/hora via formatters | No cambia fuente de datos |
| Alimentos | Estado existente | Nutrientes via formatter central | Sin datos demo autenticados |
| Recetas | Estado existente | Macros por porcion via formatter central | Calculadora de dominio intacta |
| Menu semanal | Estado existente | Metas y macros via formatter central | Export sigue sujeto a auditoria autenticada |
| PatientDetail | Estado existente | Fechas, numeros y somatotipo via formatters | Integra enteral/parenteral/deportivo |
| Enteral | Estados existentes | Kcal, proteina, volumen y porcentaje via formatters | E2E sigue bloqueado por credenciales |
| Parenteral | `ModuleState` para forbidden/loading/error/empty | Volumen, macros y monitoreo via formatters | Basico controlado, no avanzado |
| Deportivo/Somatocarta | `ModuleState` para empty/evolucion/somatocarta insuficiente | Fechas, %, kg y somatotipo via formatters | No inventa somatotipo |

## Aplicacion ampliada en Macrofase 29

| Pantalla | ModuleState aplicado | Pendiente |
|---|---|---|
| Alerts | Loading/error/empty de alertas | Smoke autenticado con usuario real |
| Audit | Loading/error/empty de timeline | Eventos remotos requieren sesion |
| Reports | Estados de preview/reporte con componente comun | Confirmar `report.exported` en `/app/audit` |
| Patients | Conteos y fecha de seguimiento con formatter | Smoke autenticado con usuario real |
| Plans | Energia, macros, liquidos y fecha con formatter | Revisar con datos reales de tenant |
| Parenteral | Ya aplicado en Macrofase 28 | E2E opcional con credenciales |
| Deportivo/Somatocarta | Ya aplicado en Macrofase 28 | Datos reales suficientes para somatocarta |
| Enteral | Estados propios robustos se mantienen | E2E Enteral bloqueado por credenciales |
| Patients/PatientDetail/Plans/Labs | Estados existentes robustos, sin reescritura masiva | Candidatos a migracion gradual si se toca funcionalidad |
