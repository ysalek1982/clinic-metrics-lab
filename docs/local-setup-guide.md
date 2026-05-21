# Instalacion local Nutri

## 1. Clonar repo

```bash
git clone <repo-url>
cd clinic-metrics-lab
```

## 2. Instalar dependencias

```bash
npm ci
```

## 3. Crear `.env.local`

Copiar `.env.example` y completar solo valores locales. No versionar `.env.local`.

Permitido en frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

No permitido en frontend:

- service role
- password DB
- access token Supabase

## 4. Levantar Vite

```bash
npm run dev -- --host 127.0.0.1 --port 8080
```

## 5. Validar piloto local

```bash
npm run verify:pilot
```

## 6. Ejecutar smoke

```bash
npm run smoke:routes
```

## 7. Ejecutar paridad visual

```bash
npm run visual:parity
```

## 8. Ejecutar auditorias locales

```bash
npm run audit:ui
npm run audit:accessibility
npm run audit:demo
npm run audit:permissions
npm run audit:rls
```

## 9. Checklist de release local

```bash
npm run release:checklist
```

Genera `docs/release-checklist-current.md` y un artifact en `artifacts/release/`.

## 10. Variables para desbloqueos

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `QA_*`

## 11. Problemas comunes

- Si smoke muestra login, no hay storage state autenticado. No cierra QA P0.
- Si Pediatria muestra referencia incompleta, faltan CSV oficiales WHO/OMS.
- Si Edge Function no despliega, falta `SUPABASE_ACCESS_TOKEN`.
- Si E2E Enteral no corre, faltan credenciales E2E.

## Versionado de artifacts

- Mantener fuera de git cualquier `playwright/.auth`, `storageState.json`, `.env*`, `dist` y `build`.
- Los artifacts de `artifacts/` sirven como evidencia local; revisar peso y sensibilidad antes de versionar.
