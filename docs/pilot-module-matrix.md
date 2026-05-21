# Matriz de módulos para piloto Nutri

Estado al 2026-05-11. Esta matriz no cierra bloqueos que requieren credenciales, usuarios QA o referencias oficiales.

| Módulo | Estado | Fuente de datos | RLS | Auditoría | Pendiente |
|---|---|---|---|---|---|
| Copilot clínico | Funcional contextual local | Supabase via hooks existentes y reglas locales; tareas/timeline derivados | Ruta protegida por `ai.assist`; datos por servicios tenant-scoped/RLS | Solo lectura; no crea eventos por consulta contextual | Validar con sesión autenticada, usuarios QA y datos reales |
| Dashboard | Funcional para piloto | Supabase con estados fallback controlados | Aplica por servicios tenant-scoped | Eventos visibles vía `audit_logs` | Smoke autenticado pendiente |
| Pacientes | Funcional | Supabase `patients` y datos clínicos asociados | Activa en tablas clínicas | Acciones clínicas auditadas según servicio | QA tenant-cross pendiente |
| Evaluaciones | Funcional parcial fuerte | Supabase `clinical_assessments`, `encounters` | Activa | Eventos clínicos relevantes | QA multi-tenant pendiente |
| Planes | Funcional | Supabase `nutrition_plans` | Activa | Eventos de planes según flujo | QA multi-tenant pendiente |
| Labs | Cerrado funcionalmente | Supabase `lab_orders`, `lab_results` | Activa | Eventos de labs/audit | QA multi-tenant pendiente |
| Alertas | Cerrado funcionalmente | Supabase y alertas derivadas reales | Activa | Acknowledgements y eventos derivados | QA multi-tenant pendiente |
| Agenda | Cerrada funcionalmente | Supabase `appointments` | Activa | Eventos de agenda | QA multi-tenant pendiente |
| Mensajes | Cerrado funcionalmente | Supabase `message_threads`, `messages`, receipts | Activa | `message_thread.*`, `message.sent` | QA multi-tenant pendiente |
| Alimentos | Cerrado funcional y visual | Supabase `food_groups`, `food_items` | Activa para tenant-scoped; catálogo global controlado | Acciones de gestión si aplica | Completar catálogo real según operación |
| Recetas | Cerrado funcional y visual | Supabase `recipes`, `recipe_ingredients` | Activa | `recipe.create/update/archive` | QA multi-tenant pendiente |
| Menú semanal | Cerrado funcional y visual | Supabase `weekly_menus`, `weekly_menu_items` | Activa | `weekly_menu.*` | QA multi-tenant pendiente |
| Reportes | Funcional | Supabase + `report_runs` | Activa | `report.generated`, `report.printed`; `report.exported` pendiente de evidencia | Confirmar `report.exported` en `/app/audit` autenticado |
| Pediatría | Funcional con referencia incompleta controlada | Supabase `pediatric_growth_records/results`; referencias incompletas | Activa | Medición y cálculo auditables | CSV oficiales WHO/OMS para z-score/percentil real |
| Enteral | Funcional E2E aceptado previamente; E2E automatizado pendiente por credenciales | Supabase `enteral_plans`, `enteral_daily_logs` | Activa; anon validado | `enteral_plan.*`, `enteral_daily_log.create` | Reproducir E2E con `E2E_EMAIL/E2E_PASSWORD` |
| Parenteral | Funcional básico controlado, no avanzado | Supabase `parenteral_plans`, `parenteral_monitoring_logs` | Activa; anon validado | `parenteral_plan.*`, `parenteral_log.create` | No marcar como parenteral avanzado |
| Deportivo/Somatocarta | Funcional condicionado a datos antropométricos suficientes | Supabase `sports_profiles`, evaluaciones deportivas | Activa | `sports_profile.*`, `sports_assessment.*`, reportes | No inventar somatotipo si faltan datos |
| Usuarios/Roles | Funcional para memberships existentes | Supabase RPC admin, roles, permisos, memberships | RLS/RPC autorizados | `membership.*`, `role.assign` | Deploy Edge Function para invitar Auth |
| Auditoría | Funcional de lectura | Supabase `audit_logs` | Activa | N/A | Exportar auditoría permanece Próximamente |
| Exportaciones | Parcial real | PDF/XLSX locales desde datos autorizados | Respeta datos ya filtrados por RLS | `report.exported` pendiente de evidencia visible | Cerrar Fase 18A con sesión autenticada |
