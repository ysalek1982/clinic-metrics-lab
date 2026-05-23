# Integracion futura de billing

Estado actual:

- Pagos en linea deshabilitados.
- Proveedor activo: `none`.
- No se llama Stripe ni otro proveedor.
- No se crean checkout sessions.
- No se guardan tarjetas.
- No hay webhooks de pago activos.

La abstraccion local esta en `src/lib/billingProvider.ts` y solo declara tipos futuros:

- `BillingProvider`.
- `CheckoutSessionRequest`.
- `BillingPortalRequest`.
- `WebhookEvent`.

Siguiente fase para pagos reales:

1. Elegir proveedor.
2. Crear backend server-side para checkout.
3. Guardar claves solo en entorno seguro.
4. Implementar webhooks verificados.
5. Mapear eventos de pago a `tenant_subscriptions` y `subscription_events`.
6. Validar RLS y auditoria.

No se debe implementar billing desde frontend ni exponer secretos publicos.

En el modelo comercial actual, los planes `free`, `pro` y `clinic_hospital` pueden gestionarse manualmente por plataforma, pero no ejecutan cobros. Courtesy sigue siendo una concesion temporal con vencimiento.
