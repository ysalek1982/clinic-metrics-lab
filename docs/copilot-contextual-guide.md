# Guia del Copilot contextual Nutri

## Que es

El Copilot contextual es un centro operativo para priorizar trabajo clinico y administrativo dentro del tenant activo. Usa datos reales ya visibles por Supabase/RLS y reglas locales deterministicas.

## Que no es

- No es IA generativa.
- No llama OpenAI ni servicios externos.
- No diagnostica.
- No prescribe tratamientos.
- No calcula dosis.
- No inventa alertas, curvas, somatotipos ni recomendaciones.

## Capacidades

| Capacidad | Estado | Fuente de datos | Accion | Limitacion |
|---|---|---|---|---|
| Pacientes prioritarios | Funcional local | `patients`, alertas, labs, agenda, planes | Abrir expediente | Validacion autenticada pendiente |
| Alertas activas | Funcional local | `alert_acknowledgements`/alertas derivadas por servicios | Abrir alertas | No resuelve alertas desde Copilot |
| Laboratorios criticos/fuera de rango | Funcional local | hooks de Labs | Abrir laboratorios | No interpreta diagnosticos |
| Plan nutricional faltante | Funcional local | `nutrition_plans` | Abrir planes | No crea plan desde Copilot |
| Cita proxima/vencida | Funcional local | `appointments` | Abrir agenda | Crear cita queda `Proximamente` |
| Enteral mala tolerancia | Funcional local | `enteral_plans` y logs expuestos por servicio | Abrir cockpit enteral | E2E autenticado pendiente |
| Parenteral activo | Funcional local | `parenteral_plans` y ultimo monitoreo | Abrir soporte parenteral | Basico controlado, no avanzado |
| Pediatria referencia incompleta | Funcional local | `growth_reference_sets/points` | Abrir curvas pediátricas | CSV WHO/OMS faltantes |
| Deportivo datos insuficientes | Funcional local | `sports_profiles` y snapshots | Abrir somatocarta | No inventa somatotipo |
| Reporte reciente | Funcional local | `report_runs` | Abrir reportes | `report.exported` pendiente de evidencia audit |
| Tareas operativas | Funcional local | Hallazgos derivados de alertas, labs, agenda, planes y packs | Abrir modulo de origen | No crea tareas nuevas |
| Timeline operativo | Funcional local | Eventos derivados de datos visibles | Abrir modulo de origen | No reemplaza historia clinica completa |
| Hoy requiere atencion | Funcional local | Tareas vencidas, de hoy o de alta severidad | Abrir modulo de origen | Depende de fechas reales registradas |
| Consulta contextual | Funcional local | Hallazgos, tareas y timeline ya calculados en cliente | Respuesta limitada a resumen local | Sin IA generativa ni historial persistente |

## Reglas locales aplicadas

1. Paciente con alertas activas: prioridad segun severidad de alerta.
2. Lab critico: prioridad critica y link a Labs.
3. Lab fuera de rango: prioridad alta y link a Labs.
4. Sin plan nutricional activo: pendiente moderado.
5. Cita proxima: seguimiento informativo.
6. Cita vencida o sin seguimiento: pendiente de agenda.
7. Enteral con baja entrega o mala tolerancia: riesgo enteral.
8. Parenteral activo: seguimiento de soporte hospitalario.
9. Pediatria sin referencia completa: referencia incompleta, sin z-score.
10. Deportivo sin componentes suficientes: datos insuficientes, sin somatotipo.
11. Reporte reciente: acceso a trazabilidad de reportes.
12. Tareas: se derivan de hallazgos existentes; no se inventan tareas ni responsables.
13. Timeline: consolida eventos operativos visibles sin crear datos nuevos.

## Copilot no es IA medica

- No diagnostica, no prescribe, no recomienda dosis y no emite pronosticos.
- No usa OpenAI ni servicios externos.
- La caja de consulta responde solo sobre resumen, alertas, laboratorios, citas, planes, soporte nutricional, pediatria, deporte, pendientes, datos faltantes y timeline registrados.
- Cualquier accion clinica requiere revision profesional en el modulo correspondiente.

## Validacion pendiente con usuarios reales

- Confirmar permiso `ai.assist` con usuario clinico no-superadmin.
- Confirmar que un usuario sin permiso ve forbidden.
- Confirmar que usuarios de tenant A no ven datos de tenant B.
- Ejecutar smoke autenticado con storage state.
