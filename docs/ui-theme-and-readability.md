# UI Theme And Readability

Fecha local: 2026-05-23.

Se implemento un sistema de tema global con modo light, dark y system. La preferencia persiste en localStorage y se aplica al documento desde `src/App.tsx` mediante `useTheme`.

Archivos principales:
- `src/lib/theme.ts`
- `src/hooks/useTheme.ts`
- `src/components/common/ThemeToggle.tsx`
- `src/index.css`
- `src/components/layout/AppTopbar.tsx`

| Area UI | Antes | Correccion | Light | Dark | Pendiente |
|---|---|---|---|---|---|
| Tema global | Solo experiencia oscura efectiva | Tokens CSS para light/dark/system y persistencia | Validado visualmente | Validado visualmente | Revisar cada modulo en mobile |
| Topbar | Sin selector de tema | ThemeToggle visible con aria-label | Visible | Visible | Ninguno critico |
| Contraste | Grises poco consistentes | Tokens foreground/muted/card/border ajustados | Legible | Legible | Ajustes finos por tabla compleja |
| Focus | Inconsistente | `:focus-visible` global | Visible | Visible | Revision teclado completa |
| Free dashboard | Lenguaje institucional | Copy personal: Mi cuenta/Mi espacio | Validado | Validado | Ninguno critico |
| Mojibake | Textos con `Ã`/`Â` en Topbar/Dashboard | Normalizado a texto legible | Sin mojibake detectado | Sin mojibake detectado | Buscar historico en docs no critico |

Tests agregados:
- `src/lib/theme.test.ts`
- `src/components/common/ThemeToggle.test.tsx`

Resultado:
- `npm test -- --run`: 165 passed.
- Marcela Free en produccion ve selector de tema, Dashboard personal y sin Organizacion institucional.

## Macrofase 51 - Responsive y legibilidad por breakpoint

Se agrego `qa:mobile` para validar tema claro/oscuro y responsive en mobile, tablet y desktop con Marcela Free, QA Clinic y ysalek.

| Area UI | Correccion | Evidencia | Pendiente |
|---|---|---|---|
| Sidebar | Oculto hasta `lg` para evitar overflow en pantallas estrechas. | Mobile QA produccion 162/162. | Prueba manual en dispositivos fisicos. |
| Topbar | Busqueda/tenant/acciones compactadas por breakpoint. | `artifacts/mobile/mobile-responsive-2026-05-23T13-43-42-755Z.json`. | Ajustes finos si se agregan nuevas acciones. |
| Tablas/cards/dialogs | QA detecta overflow global, textos de runtime y botones fuera de viewport. | Sin fallos en produccion. | Revision visual humana por modulo. |

Resultado actualizado:

- `npm test -- --run`: 166 passed.
- `npm run qa:mobile`: passed en produccion, 162 checks.
