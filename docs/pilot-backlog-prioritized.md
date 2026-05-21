# Backlog priorizado para piloto

| Prioridad | Tarea | Bloqueo | Responsable | Evidencia necesaria | Estado |
|---|---|---|---|---|---|
| P0 | Definir `SUPABASE_ACCESS_TOKEN` | Credencial | Operacion/DevOps | Deploy `admin-invite-user` | Bloqueado |
| P0 | Crear usuarios Auth QA | Usuarios reales | Admin Supabase | Usuarios confirmados | Bloqueado |
| P0 | Definir `E2E_EMAIL/E2E_PASSWORD` | Credenciales E2E | QA/DevOps | Playwright/storageState | Bloqueado |
| P0 | Cerrar QA Seguridad P0 | Usuarios QA | QA | Matriz multi-tenant sin fugas | Bloqueado |
| P0 | Cerrar E2E Enteral | Credenciales E2E | QA | Plan/log/alert/audit desde UI | Bloqueado |
| P0 | Confirmar `report.exported` | Sesion autenticada | QA | Evento visible en `/app/audit` | Bloqueado |
| P0 | Smoke autenticado | Storage state | QA | Smoke sin ErrorBoundary con sesion | Bloqueado |
| P1 | Deploy Edge Function | Token Supabase | DevOps | Function remota responde | Bloqueado |
| P1 | Export audit completo | Sesion/QA | Producto/QA | Eventos export por formato | Parcial |
| P1 | Parenteral avanzado validado | Reglas clinicas | Clinico/Producto | Reglas aprobadas | No iniciado |
| P1 | CSV WHO/OMS | Insumo oficial | Clinico/Data | Referencias importadas | Bloqueado |
| P2 | Mejoras visuales finas | Sesion/datos reales | Frontend | Capturas comparativas | Pendiente |
| P2 | PDF/Excel avanzados | Alcance | Producto | Archivos verificables | Parcial |
| P2 | CI con secretos | Secrets CI | DevOps | Workflow protegido | Pendiente |
| P2 | Reportes especializados | Datos suficientes | Producto | `report_runs` reales | Parcial |
