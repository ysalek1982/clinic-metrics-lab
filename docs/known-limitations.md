# Known Limitations

## Seguridad

- QA Seguridad P0 multi-tenant sigue bloqueado hasta tener usuarios QA Auth confirmados y credenciales.
- Tenant-cross no-superadmin debe repetirse antes de produccion.
- No se debe usar platform superadmin para validar aislamiento tenant-cross.

## Edge Functions

- `admin-invite-user` esta implementada localmente.
- Despliegue remoto bloqueado si falta `SUPABASE_ACCESS_TOKEN`.
- `SUPABASE_SERVICE_ROLE_KEY` solo puede existir en secretos de Edge Function, nunca en frontend.

## E2E

- E2E Enteral automatizado queda bloqueado si faltan `E2E_EMAIL` y `E2E_PASSWORD`.
- La API puede verificar datos, pero no debe crear plan/log para declarar UI E2E.

## Pediatria

- Faltan referencias oficiales WHO/OMS completas en `growth_reference_points`.
- El modulo no debe declararse Pediatria avanzada completa hasta cargar referencias y validar LMS/z-score/percentil real.
- Si falta referencia para indicador, edad o sexo, la UI debe mantener "Referencia incompleta".

## Parenteral

- Es funcional basico controlado.
- No implementa calculos avanzados de osmolaridad, electrolitos ni dosificacion clinica compleja.
- No debe presentarse como parenteral avanzado.

## Exportaciones

- Reportes, menu semanal y enteral tienen exportacion real inicial.
- `report.exported` sigue pendiente hasta confirmarse visible en `/app/audit`.
- Los botones no implementados deben permanecer deshabilitados o como "Proximamente".

## Copilot contextual

- Copilot no es IA medica.
- No diagnostica, no prescribe, no recomienda dosis y no emite pronosticos.
- Solo resume datos registrados y aplica reglas locales conservadoras.
- Las acciones clinicas requieren revision profesional en el modulo correspondiente.

## Pediatria WHO/OMS

- No hay CSV/XLSX oficiales versionados en el repo.
- El importador valida formato normalizado, pero no descarga ni inventa referencias.

## Dependencias

- No se ejecuto `npm audit fix` porque puede modificar dependencias de forma riesgosa para piloto.
