# Politica de versionado de artifacts

Fecha: 2026-05-11

| Tipo | Versionar | Motivo |
|---|---|---|
| `docs/*.md` | Si | Evidencia revisable y liviana |
| `scripts/*.mjs` | Si | Herramientas reproducibles |
| `artifacts/*.json` | No por defecto | Evidencia local reproducible; puede crecer y contener rutas locales |
| `artifacts/screenshots/*` | No por defecto | Archivos pesados; publicar solo bajo acuerdo |
| `artifacts/visual-parity/*` | No por defecto | Evidencia visual local, no fuente de verdad |
| `playwright/.auth/*` | Nunca | Puede contener storage state de sesion |
| `storageState.json` | Nunca | Puede contener tokens de sesion |
| `dist/`, `build/` | Nunca | Build reproducible |
| `.env*` reales | Nunca | Pueden contener secretos |
| `.env.example` | Si | Solo placeholders seguros |

## Estado `.gitignore`

El repositorio ignora `artifacts/`, `playwright/.auth/`, `storageState.json`, `.env`, `.env.local`, `.env.*.local`, `dist/`, `build/`, `*.pem` y `*.key`.

## Recomendacion para revision

Antes de commit, ejecutar:

```bash
git status --short
git diff --stat
npm run verify:pilot
```

Si se decide versionar un artifact puntual, revisar manualmente que no contenga tokens, emails sensibles, rutas privadas que no deban publicarse o datos clinicos reales.
