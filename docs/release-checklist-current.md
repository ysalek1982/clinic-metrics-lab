# Checklist local de release para piloto

Generado: 2026-05-11T18:06:19.799Z

- Artifact: `artifacts/release/release-checklist-2026-05-11T18-06-19-801Z.json`
- Nota: este checklist no cierra bloqueos que requieren credenciales, usuarios Auth o CSV oficiales.

| Area | Estado | Evidencia | Riesgo |
|---|---|---|---|
| Calidad local | ready_local | `artifacts/smoke/smoke-routes-local-2026-05-11T18-02-58-562Z.json` | No reemplaza smoke autenticado. |
| Acciones UI | ready_local | `artifacts/ui-audit/ui-actions-2026-05-11T18-05-50-128Z.json` | Revisar riesgos medios/altos antes de demo con usuarios reales. |
| Accesibilidad basica | ready_local | `artifacts/accessibility/accessibility-audit-2026-05-11T18-06-12-651Z.json` | No es certificacion WCAG completa. |
| Permission gates UI | ready_local | `artifacts/security/permission-gates-2026-05-11T18-05-25-649Z.json` | RLS sigue siendo el control final; QA P0 requiere usuarios reales. |
| Demo usage | ready_local | `artifacts/security/demo-usage-2026-05-11T18-05-25-607Z.json` | Validar de nuevo con sesion autenticada real. |
| RLS/migraciones | review_required | `artifacts/security/migrations-rls-2026-05-11T18-05-25-698Z.json` | No sustituye pruebas multi-tenant remotas. |
| Edge Function admin-invite-user | blocked_credential | `supabase/functions/admin-invite-user/index.ts` | No desplegar sin token autorizado. |
| QA Seguridad P0 | blocked_users_or_credentials | `scripts/qa-security-p0.mjs` | Requiere usuarios Auth QA confirmados. |
| E2E Enteral | blocked_credential | `scripts/e2e-enteral-flow.mjs` | No cerrar Fase 9 sin UI E2E autenticado. |
| Pediatria WHO/OMS | blocked_clinical_input | `docs/references/pediatric-growth-official-sources.md` | Faltan CSV oficiales normalizados. |
| report.exported | blocked_authenticated_evidence | `docs/known-limitations.md` | Falta confirmacion visible en /app/audit. |
