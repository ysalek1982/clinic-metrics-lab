# Auditoria funcional del Copilot contextual

Actualizado en Macrofase 33.

El Copilot de Nutri es un asistente contextual deterministico. Resume datos reales visibles por Supabase/RLS y aplica reglas locales conservadoras. No usa IA generativa, no llama servicios externos y no emite diagnosticos, dosis, tratamientos ni pronosticos.

| Elemento | Estado actual | Riesgo | Accion recomendada | Estado |
|---|---|---|---|---|
| Ruta `/app/copilot` | Existe y esta protegida por sesion, tenant activo y permiso `ai.assist`. | Usuario sin permiso debe ver forbidden, no datos. | Mantener guard en `App.tsx` y sidebar filtrada por permiso. | Aplicado |
| Navegacion Sidebar | Item `Copilot clinico` visible solo con `ai.assist`. | Acceso visual indebido si se muestra a roles no autorizados. | Ocultar cuando falta permiso. | Aplicado |
| Deep-link paciente | `?patient=<id>` selecciona contexto del paciente aunque no tenga senales. | Perder contexto desde expediente. | Mantener `selectedPatientContext` estable. | Aplicado |
| Contexto de tenant | Hook usa `useTenantRuntime` y consultas tenant-scoped. | Sin tenant activo debe mostrar estado visible. | Conservar ModuleState no tenant/loading/error. | Aplicado |
| Prioridades operativas | Reglas locales ordenan por severidad y puntaje. | Sobreinterpretacion clinica. | Mostrar fuente/accion y evitar lenguaje diagnostico. | Aplicado |
| Tareas operativas | Deriva pendientes por paciente, modulo, severidad y fecha desde hallazgos reales. | Inventar tareas o responsables. | Mantener tareas como vista derivada, sin persistir ni asignar automaticamente. | Aplicado |
| Hoy requiere atencion | Muestra tareas vencidas, de hoy, alta severidad, alertas, labs y soporte enteral. | Usar fechas falsas. | Usar solo fechas registradas y fallback honesto cuando no hay datos. | Aplicado |
| Timeline operativo | Consolida eventos derivados de alertas, labs, agenda, planes, reportes y packs. | Duplicar historia clinica o crear eventos falsos. | Mostrar como resumen operativo, no como expediente legal completo. | Aplicado |
| Consulta local | Parser local responde sobre resumen, alertas, labs, citas, planes, soporte, pediatria, deporte, pendientes y timeline. | Simular IA generativa. | Mantener fallback explicito de IA generativa pendiente. | Aplicado |
| Acciones rapidas | Links reales o botones deshabilitados con `Proximamente`/`Sin permiso`. | Botones falsos. | Auditar con `audit:ui`. | Aplicado |
| Datos insuficientes | Missing data se muestra como pendiente estructural. | Inventar hallazgos. | Usar solo datos recibidos por hooks. | Aplicado |
| Datos reales vs demo | No importa `src/data/demo` ni `src/data/clinical` en la vista. | Demo autenticado. | Mantener auditoria `audit:demo`. | Aplicado |
| Permisos | Ruta usa `ai.assist`; reportes/agenda/enteral/parenteral se gatean por permisos existentes. | RLS sigue siendo el control final. | Cerrar QA P0 con usuarios reales cuando existan. | Pendiente externo |
| Integracion Dashboard | Card muestra top pendientes y respeta permiso `ai.assist`. | Mostrar acceso sin permiso. | Boton disabled si falta permiso. | Aplicado |
| Integracion PatientDetail | Panel con top 3 hallazgos, tareas, timeline y link contextual si hay permiso. | Link falso o sin permiso. | Boton disabled si falta `ai.assist`. | Aplicado |
| Auditoria | El Copilot es solo lectura local; no escribe eventos por consulta. | Falta trazabilidad si se decide auditar consultas. | Definir politica futura antes de auditar lecturas. | Documentado |
| Tests | Reglas y composicion de contexto tienen tests con fixtures. | Cobertura UI autenticada pendiente. | Ejecutar smoke autenticado cuando existan credenciales. | Parcial |

## Bloqueos conservados

- QA Seguridad P0: requiere usuarios QA reales.
- E2E Enteral: requiere `E2E_EMAIL` y `E2E_PASSWORD`.
- Edge Function deploy: requiere `SUPABASE_ACCESS_TOKEN`.
- `report.exported`: requiere evidencia autenticada visible en `/app/audit`.
- Pediatria WHO completa: requiere CSV oficiales WHO/OMS.
