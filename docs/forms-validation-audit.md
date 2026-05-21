# Auditoria de validacion de formularios

Fecha: 2026-05-11

| Formulario | Validacion actual | Riesgo | Accion tomada | Pendiente |
|---|---|---|---|---|
| Crear/editar paciente | Campos requeridos y errores visibles segun flujo actual | Validar edge cases con usuario real | Documentado para QA | QA autenticado |
| Evaluacion clinica | Validaciones estructurales existentes | Reglas clinicas avanzadas no inventadas | Mantener dominio/servicios | Revision clinica |
| Plan nutricional | Datos reales y persistencia | Evitar doble submit en QA | Documentado | E2E con credenciales |
| Agenda | Fechas/estado y acciones auditadas | Timezone en casos frontera | Documentado | QA real |
| Mensajes | No enviar vacio, hilos reales | Permisos de envio | Documentado | QA real |
| Alertas | Resolver/ack real | Permisos por accion | Documentado | QA P0 |
| Labs | Datos reales | Rangos clinicos no inventados | Documentado | QA real |
| Recetas | Ingredientes/macros reales | Gramos/cantidades extremas | Tests de calculadora | Validacion UI con datos |
| Menu semanal | Items reales y calculos dominio | Export audit pendiente | Documentado | Fase 18A |
| Enteral | Plan/log real, tolerancia dominio | E2E bloqueado | Documentado | E2E credentials |
| Parenteral | Basico controlado | No calcular osmolaridad | Documentado | Revision clinica futura |
| Deportivo | Datos insuficientes si falta somatotipo | No inventar interpretacion | Reporte con secciones insuficientes | Datos reales |
| Usuarios/Roles | RPC admin, estado activo/inactivo | Crear Auth requiere Edge Function | Bloqueo claro | Deploy Edge Function |
| Reportes | Vista previa/generacion real | Export audit pendiente | Documentado | Sesion autenticada |

Regla para nuevos formularios: indicar requeridos, mostrar errores en espanol, deshabilitar mientras guarda, evitar doble submit y auditar acciones relevantes.

## Aplicacion Macrofase 28

| Formulario | Accion aplicada | Pendiente |
|---|---|---|
| Enteral plan/log | Inputs numericos con minimo 0 por defecto y parseo no negativo | E2E autenticado |
| Parenteral plan | Paciente requerido, numeros no negativos, disabled mientras guarda | Validacion con sesion real |
| Parenteral monitoreo | Glucosa/trigliceridos no negativos, disabled mientras guarda | Validacion con sesion real |
| Deportivo evaluacion | Numeros antropometricos no negativos, dato insuficiente visible | Datos reales suficientes para somatotipo |
| Dashboard reportes | Boton de informe gateado por permiso de reportes | QA permisos con usuarios reales |
