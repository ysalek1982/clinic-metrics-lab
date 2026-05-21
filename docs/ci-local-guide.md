# Guia CI local

Este flujo no requiere secretos y no intenta cerrar QA P0 ni E2E autenticado.

## Comandos base

```bash
npm ci
npm run build
npm run lint
npm test -- --run
npm run smoke:routes
npm run check:env
npm run audit:ui
npm run audit:accessibility
npm run audit:demo
npm run audit:permissions
npm run audit:rls
```

## Workflow sugerido

1. Instalar dependencias con `npm ci`.
2. Ejecutar build, lint y tests.
3. Ejecutar smoke local sin credenciales.
4. Ejecutar auditorias locales.
5. Publicar artifacts de `artifacts/` solo como salida de CI, no versionarlos.

## GitHub Actions local-quality

Se incluye `.github/workflows/local-quality.yml` sin secretos. Ejecuta:

- `npm ci`
- `npm run build`
- `npm run lint`
- `npm test -- --run`
- `npm run check:env`

No ejecuta E2E autenticado, DB push ni deploy.

## No ejecutar en CI local sin secretos

- E2E Enteral autenticado.
- QA Seguridad P0 multi-tenant.
- Deploy de Edge Function.
- DB push remoto.

## Criterio de aceptacion

- Build, lint y tests pasan.
- Smoke local pasa.
- Auditorias generan docs/artifacts.
- Scripts de readiness reportan bloqueos sin fallar por variables ausentes.
