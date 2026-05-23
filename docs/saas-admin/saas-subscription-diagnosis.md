# Diagnostico SaaS de suscripciones

| Elemento | Estado actual | Falta para SaaS real | Riesgo | Accion |
|---|---|---|---|---|
| Plan gratuito | Implementado localmente como `free` en migracion incremental y helpers de UI. | Aplicar migracion en Supabase. | Usuario sin plan no debe recibir premium por error. | Free requiere aprobacion inicial por plataforma. |
| Estado de suscripcion | `tenant_subscriptions` existe y se extendio con `plan_code`, `ends_at`, `courtesy_ends_at` y proveedor futuro. | Validacion remota con DB real. | Estados antiguos pueden convivir con nuevos. | Helpers normalizan `trial`/`trialing` y planes legacy. |
| Vencimiento de cortesia | Implementado con `courtesy_ends_at` y funciones de extension/cancelacion. | Job futuro para marcar expiradas automaticamente. | Cortesia vencida no debe habilitar premium. | `subscriptionAccess` bloquea premium si vence. |
| Limites por plan | `plan_entitlements` define features y limites. | Enforcement profundo en backend por modulo. | UI sola no reemplaza RLS. | PlanGate es guard visual; RLS/permisos siguen mandando. |
| Control de features | Helpers `hasPlanFeature`, `getPlanLimit`, `PlanGate`. | Aplicacion gradual por modulo productivo. | Bloquear rutas basicas accidentalmente. | Aplicado solo en panel SaaS y listo para expansion segura. |
| Usuario sin plan | No entra a premium; si no tiene membership va a activacion/solicitud. | Politica de auto-provision si se decide. | Crear tenants automaticos podria abrir superficie. | Decision segura: solicitud free requiere aprobacion. |
| Usuario free | Puede tener dashboard/pacientes limitados/antropometria/agenda basica segun entitlements. | Aplicar migracion y validar con usuario real. | Modulos premium deben quedar bloqueados. | Entitlements free limitan reportes, Copilot, usuarios y hospitalario. |
| Cortesia activa | Plan `courtesy` con fecha fin y eventos de suscripcion. | Validar con usuario/tenant real. | Vencimiento manual si no hay job. | Admin puede extender/cancelar desde UI. |
| Cortesia vencida | Helpers la tratan como vencida y recomiendan fallback a free. | Automatizacion DB programada futura. | Tenant podria mantener datos pero no premium. | `admin_cancel_courtesy_subscription` baja a free. |
| Administracion ysalek | `/app/saas-admin` gestiona planes, suscripciones, cortesias e invitaciones con `platform_superadmin`. | Auth user y migraciones aplicadas. | Acceso indebido si rol mal asignado. | Ruta protegida y RPCs validan `is_platform_superadmin()`. |
