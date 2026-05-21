# Analisis de `/app/copilot` del prototipo

Generado: 2026-05-11

Fuente renderizada: `artifacts/prototype-deep/prototype-deep-analysis-2026-05-11T19-43-12-366Z.json`

El prototipo se usa solo como referencia visual e interactiva. Nutri no copia sus datos demo ni simula IA generativa.

| Elemento | En prototipo | En Nutri | Brecha | Accion recomendada |
|---|---|---|---|---|
| Ruta `/app/copilot` | Existe y renderiza `Nutos Copilot`. | Existe como `/app/copilot`. | Nutri no tenia ruta dedicada antes de esta macrofase. | Implementada con reglas locales y datos reales. |
| Sidebar | Item `Nutos Copilot` aparece junto a Dashboard/Cockpit. | Item `Copilot clinico` agregado al workspace y filtrado por `ai.assist`. | Nombre adaptado a marca Nutri. | Mantener visible solo para roles autorizados. |
| Topbar/contexto | Prototipo muestra workspace, busqueda y usuario. | Nutri conserva AppShell/topbar existente. | No se redisenia topbar para evitar riesgo. | Evaluar microajustes visuales luego de smoke autenticado. |
| Chat/prompt | Textarea de pregunta clinica con sugerencias tipo generativas. | Input contextual local con respuesta deterministica y mensaje "sin IA generativa". | No hay backend IA real. | Mantener modo asistente contextual hasta integrar backend seguro. |
| Sugerencias | Incluye calculos, planes, evidencia y cohortes. | Muestra acciones rapidas y hallazgos basados en datos reales. | Nutri evita planes/tratamientos generados. | Solo habilitar IA real con backend, permisos, auditoria y guardrails. |
| Cards de riesgo | Prototipo usa cards conversacionales y capacidades. | Nutri usa prioridades, hallazgos, riesgos, tareas, timeline y pendientes. | Nutri es mas operacional, menos conversacional. | Correcto para piloto seguro. |
| Acciones rapidas | Navegacion amplia a modulos. | Enlaces reales a pacientes, alertas, labs, agenda, planes, enteral, parenteral, somatocarta y reportes; acciones no implementadas quedan deshabilitadas. | Acciones sensibles dependen de permisos/RLS. | Mantener auditoria UI y QA P0 pendiente. |
| Contexto paciente | Prototipo promete cohorte activa y registros clinicos. | Nutri consolida pacientes, alertas, labs, agenda, planes, enteral, reportes y referencias. | Falta validacion autenticada con datos reales. | Cerrar con smoke autenticado cuando existan credenciales. |
| Contexto tenant | Prototipo usa HSM demo. | Nutri usa tenant activo real por Supabase/RLS. | Sin sesion local redirige a login. | Correcto; no usar demo autenticado. |
| Reportes/alertas | Prototipo permite preguntas sobre reportes y alertas. | Nutri enlaza reportes y alertas; no genera respuestas medicas. | `report.exported` sigue pendiente de evidencia audit. | No cerrar Fase 18A. |
| Historial | Prototipo sugiere nueva conversacion/historial. | Nutri no persiste conversaciones. | Persistir historial requeriria modelo y auditoria. | Dejar fuera hasta backend real. |
| Datos demo | Prototipo muestra datos de demostracion. | Nutri no usa demo con sesion autenticada. | N/A | Mantener auditor demo en 0 prohibidos. |

## Decision tecnica

Nutri implementa un Copilot contextual, no una IA falsa. La vista resume datos reales visibles por RLS y aplica reglas locales conservadoras:

- paciente con alerta activa;
- laboratorio fuera de rango o critico;
- plan nutricional faltante;
- cita proxima, vencida o sin seguimiento;
- referencia pediatrica incompleta;
- soporte enteral con baja entrega o mala tolerancia;
- soporte parenteral activo;
- datos deportivos insuficientes para somatotipo;
- reporte reciente disponible.
- tareas operativas y timeline derivados de esos mismos datos.

La vista no emite diagnosticos, pronosticos, tratamientos, dosis ni recomendaciones clinicas avanzadas.

## Limitacion

La captura local de Nutri sin sesion redirige a `/login`. La validacion autenticada de contenido real queda pendiente hasta disponer de storage state o credenciales E2E.
