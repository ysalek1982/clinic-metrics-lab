# Revision de worktree para RC local

Fecha: 2026-05-11

Alcance: clasificacion para revision humana antes de commit. No se hizo commit ni push.

| Categoria | Archivos | Motivo | Riesgo | Recomendacion |
|---|---|---|---|---|
| UI/components | `src/components/common/*`, `src/components/layout/*`, `src/components/ui/*`, `src/index.css`, `tailwind.config.ts` | Paridad visual, estados comunes, accesibilidad basica y refinamiento de shell | Medio: toca superficie amplia de UI | Revisar visualmente rutas principales y smoke antes de commit |
| Clinical modules | `src/pages/app/*`, `src/pages/app/pack-modules/*` | Funcionalidad real para labs, reportes, pediatria controlada, enteral, parenteral, deportivo y admin | Alto en pantallas clinicas con mutaciones | Revisar flujos por modulo y permisos UI; no cerrar E2E sin credenciales |
| Services/hooks | `src/hooks/*`, `src/services/*`, `src/integrations/*` | Supabase real, hooks estables, auditoria, export y packs | Alto: contrato de datos y RLS dependen de estos servicios | Revisar cambios de queries/mutaciones contra migraciones y audit logs |
| Domain/tests | `src/domain/*`, `src/lib/*.test.ts`, `src/components/common/*.test.tsx` | Motores clinicos y pruebas locales sin remoto | Bajo/medio | Listos para commit junto a los modulos que validan |
| Scripts/audits | `scripts/*` | Readiness, smoke, visual parity, auditorias UI/security/release | Bajo: no ejecutan produccion | Versionar scripts; no versionar artifacts generados |
| Docs | `docs/*` | Estado piloto, manuales, bloqueos, auditorias y guias de revision | Bajo | Versionar como soporte de piloto |
| Supabase/migrations/functions | `supabase/migrations/*`, `supabase/functions/admin-invite-user/*` | Esquema, RLS, admin memberships, Edge Function local | Alto: migraciones aplicadas/remotas deben revisarse por orden e idempotencia | Revisar manualmente antes de `db push`; Edge deploy bloqueado sin token |
| Package/config | `package.json`, `package-lock.json`, `vite.config.ts`, `eslint.config.js`, `.gitignore`, `.github/*` | Scripts piloto, deps export/Playwright, CI local, guardrails | Medio | Revisar scripts nuevos y lockfile por dependencias esperadas |
| Artifacts | `artifacts/*` | Evidencia local generada por smoke/audits/visual parity | Bajo si no contiene secretos; alto por volumen | No versionar por defecto; `.gitignore` cubre `artifacts/` |
| CI | `.github/workflows/local-quality.yml` | Validacion local sin secretos | Bajo | Versionar si se quiere gate automatizado sin E2E autenticado |

## Listo para commit logico

- Componentes comunes, formatters, presentation y tests locales.
- Scripts de readiness/auditoria/smoke/release.
- Documentacion operativa y estado piloto.
- Edge Function local `admin-invite-user` como codigo, no deploy.

## Revision manual recomendada

- `src/services/clinicalService.ts` y servicios con mutaciones/audit logs.
- `supabase/migrations/*` aplicadas o pendientes.
- `src/pages/app/pack-modules/EnteralCockpit.tsx` y `ParenteralBase.tsx`.
- `src/pages/app/UsersRoles.tsx`.
- `package-lock.json` por cambio de dependencias.

## No versionar

- `artifacts/`
- `playwright/.auth/`
- `storageState.json`
- `dist/`, `build/`
- `.env`, `.env.local`, `.env.*.local`
- trazas o screenshots pesados salvo que se acuerde publicar evidencia.
