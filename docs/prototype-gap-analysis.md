# Brechas prototipo Lovable vs Nutri

Generado: 2026-05-11

Fuente: render Playwright en `artifacts/prototype-deep/`.

| Area | Prototipo | Nutri antes | Nutri despues | Brecha restante | Bloqueo |
|---|---|---|---|---|---|
| Navegacion | Sidebar amplio con Copilot, cockpit ejecutivo y ecosistema. | Sidebar premium con modulos reales, sin Copilot dedicado. | Sidebar incluye Copilot clinico y conserva modulos reales. | Items del prototipo no implementados siguen fuera para evitar pantallas falsas. | Ninguno local. |
| Dashboard | Command center oscuro con KPIs y accesos. | Dashboard funcional con datos reales/fallback controlado. | Dashboard enlaza Copilot y muestra top pendientes contextuales. | Validacion autenticada visual pendiente. | Credenciales/sesion. |
| Copilot | Chat tipo IA con sugerencias clinicas y evidencia. | No existia ruta dedicada. | `/app/copilot` madurado como command center contextual con tareas, timeline, hoy requiere atencion, respuestas locales, quick links gateados y reglas locales. | No hay IA generativa ni historial persistente. | Backend IA real, auditoria de consultas y guardrails, si se decide. |
| Pacientes | Listado clinico con navegacion. | Funcional real. | Sin cambio funcional; Copilot enlaza expedientes. | QA P0 tenant-cross pendiente. | Usuarios QA. |
| Labs | Panel de marcadores. | Labs reales funcionales. | Copilot usa estado de labs para hallazgos. | Smoke autenticado pendiente. | Credenciales. |
| Reportes | Galeria/reportes visuales. | Reportes reales iniciales. | Copilot enlaza reportes recientes si existen. | `report.exported` no confirmado en audit. | Evidencia autenticada. |
| Nutricion operativa | Biblioteca, recetas, menu. | Funcional real. | Sin cambio directo. | QA P0 pendiente. | Usuarios QA. |
| Pediatria | Curvas visuales demo. | Referencia incompleta controlada. | Copilot expone referencia incompleta sin z-score falso. | CSV WHO/OMS oficiales. | Insumo clinico. |
| Enteral | Cockpit visible en modulo. | Funcional, E2E automatizado bloqueado. | Copilot marca riesgo enteral solo desde datos de plan/log. | E2E autenticado pendiente. | `E2E_EMAIL/E2E_PASSWORD`. |
| Parenteral | No avanzado visible en captura publica. | Basico controlado. | Copilot cuenta soporte hospitalario sin prometer avanzado. | Validacion autenticada futura. | Credenciales. |
| Deportivo | Somatocarta visual. | Funcional condicionado a datos suficientes. | Copilot muestra conteo deportivo sin inventar somatotipo. | Datos suficientes reales. | Datos/QA. |
| Usuarios/Roles | Menos prioritario en prototipo visual. | Gestion real de memberships. | Sin cambio funcional. | Deploy invitacion Auth pendiente. | `SUPABASE_ACCESS_TOKEN`. |
| Auditoria | No central en prototipo. | Auditoria real disponible. | Copilot enlaza auditoria desde header. | Eventos de consulta Copilot no se auditan porque es solo lectura local. | Decision futura. |
| Estetica general | Oscuro, denso, premium. | RC local alineado. | Copilot usa tres columnas, cards, badges y ModuleState. | Ajustes finos con sesion autenticada. | Credenciales. |
| Acciones rapidas | Muchas acciones demo. | Acciones reales/gateadas. | Copilot tiene enlaces reales y botones deshabilitados como `Proximamente` o `Sin permiso`. | Validacion autenticada con roles reales. | Usuarios QA. |
| Estados | Prototipo demo siempre poblado. | Estados honestos. | Copilot agrega empty/loading/error/no tenant. | Smoke autenticado pendiente. | Credenciales. |
| Permisos | No observable completamente. | Rutas y acciones guardadas. | Copilot requiere `ai.assist` y mantiene permisos especificos en quick links. | QA Seguridad P0 pendiente. | Usuarios QA. |
| Datos reales | Prototipo usa demo. | Supabase/RLS como fuente. | Copilot no usa demo autenticado ni servicios externos. | Validar con usuarios reales. | QA P0/E2E. |
