# README PILOT - Nutri RC local

Este indice resume el estado del Release Candidate local de Nutri y apunta a los documentos que deben revisarse antes de un commit manual o un piloto real.

## 1. Estado actual

- Estado: RC local revisable.
- No equivale a piloto productivo.
- Build, lint, tests, smoke local, auditorias locales y `verify:pilot` pasan en el entorno local.
- Los bloqueos externos siguen abiertos: QA Seguridad P0, E2E Enteral, Edge Function deploy, `report.exported` y Pediatria WHO completa.

Leer primero:

- [Resumen ejecutivo RC local](./rc-local-executive-summary.md)
- [Estado final de piloto](./pilot-final-status.md)
- [Congelamiento RC local](./freeze-rc-local.md)
- [Release candidate local](./release-candidate-local.md)

## 2. Como levantar

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 8080
```

Configurar `.env.local` solo con variables locales privadas. No versionar `.env.local` ni imprimir secretos.

Guia completa:

- [Local setup guide](./local-setup-guide.md)
- [Deployment checklist](./deployment-checklist.md)

## 3. Como validar

Validacion local sin credenciales externas:

```bash
npm run build
npm run lint
npm test -- --run
npm run smoke:routes
npm run audit:ui
npm run audit:permissions
npm run verify:pilot
```

Validadores y auditorias:

- [Route health dashboard](./route-health-dashboard.md)
- [Audit implementation report](./audit-implementation-report.md)
- [High risk code review](./high-risk-code-review.md)

## 4. Que leer primero para revisar cambios

- [Final diff review](./final-diff-review.md)
- [Worktree review](./worktree-review.md)
- [Commit plan](./commit-plan.md)
- [Staging commands final](./staging-commands-final.md)
- [Human review guide](./human-review-guide.md)

## 5. Que esta bloqueado

| Bloqueo | Estado | Documento |
|---|---|---|
| Edge Function `admin-invite-user` | Bloqueada por `SUPABASE_ACCESS_TOKEN` | [E2E blockers](./e2e-blockers.md) |
| QA Seguridad P0 | Bloqueada por usuarios Auth QA y credenciales | [QA Seguridad P0](./qa-security-p0.md) |
| E2E Enteral | Bloqueado por `E2E_EMAIL` y `E2E_PASSWORD` | [E2E blockers](./e2e-blockers.md) |
| `report.exported` | Pendiente de evidencia autenticada en `/app/audit` | [Known limitations](./known-limitations.md) |
| Pediatria WHO completa | Bloqueada por CSV oficiales WHO/OMS | [WHO sources](./references/pediatric-growth-official-sources.md) |

## 6. Como desbloquear

Usar el runbook de desbloqueo cuando existan credenciales reales:

- [Runbook dia de desbloqueo](./unblock-day-runbook.md)

Comandos de preparacion:

```bash
npm run check:env
npm run unblock:steps
npm run unblock:orchestrate
node scripts/qa-security-p0-dry-run.mjs
node scripts/e2e-enteral-dry-run.mjs
node scripts/edge-function-deploy-dry-run.mjs
```

## 7. Como revisar antes de commit

No ejecutar `git add` automaticamente. Usar:

- [Commit plan](./commit-plan.md)
- [Staging commands final](./staging-commands-final.md)
- [Final diff review](./final-diff-review.md)

Antes de cada commit manual:

```bash
npm run verify:pilot
git status --short
git diff --stat
```

## 8. Como hacer demo

- [Pilot demo script](./pilot-demo-script.md)
- [Pilot demo QA checklist](./pilot-demo-qa-checklist.md)
- [User-facing pilot notes](./user-facing-pilot-notes.md)

Mensajes clave:

- Pediatria no calcula z-score real sin referencias oficiales.
- Copilot no es IA medica.
- QA Seguridad P0 requiere usuarios reales.
- E2E Enteral requiere credenciales E2E.

## 9. Que NO hacer

- No usar service role en frontend.
- No versionar `.env*`, `playwright/.auth/*`, `storageState.json`, `dist/`, `build/`, `test-results/`, `playwright-report/` ni `artifacts/*` sin decision explicita.
- No usar demo como fuente de vistas autenticadas.
- No cerrar QA Seguridad P0, E2E Enteral, Edge Function deploy, `report.exported` ni Pediatria WHO completa sin evidencia real.
- No ejecutar `db push`, deploy o E2E autenticado sin credenciales y aprobacion operativa.
