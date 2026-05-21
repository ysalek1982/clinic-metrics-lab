# Guion de demo local/pre-piloto Nutri

Este recorrido sirve para demo interna. No presenta como cerradas las fases bloqueadas por credenciales, usuarios QA o referencias oficiales.

## Recorrido sugerido

1. Login
   - Iniciar sesión con un usuario real del tenant.
   - Confirmar que no aparece DEMO con sesión autenticada.

2. Dashboard
   - Mostrar Clinical Command Center, KPIs y accesos principales.
   - Explicar que todos los datos autenticados vienen de Supabase.

3. Pacientes
   - Abrir lista de pacientes.
   - Buscar paciente y abrir expediente.

4. PatientDetail
   - Mostrar resumen clínico, actividad reciente, planes, mensajes, soporte hospitalario y módulos relacionados.

5. Labs
   - Mostrar órdenes/resultados reales y estados fuera de rango si existen.

6. Agenda
   - Mostrar citas, estados y persistencia.

7. Alertas
   - Mostrar alertas reales y derivadas, incluyendo enterales si hay logs de riesgo.

8. Reportes
   - Abrir vista previa y reportes recientes.
   - Indicar: `report.exported` aún requiere evidencia autenticada visible en `/app/audit`.

9. Alimentos, Recetas y Menú semanal
   - Mostrar biblioteca de alimentos, editor de recetas y matriz semanal.
   - Recalcar que los cálculos viven en dominio/servicios.

10. Pediatría
   - Mostrar estado seguro de referencia incompleta.
   - Frase obligatoria: “Pediatría no calcula z-score sin referencias oficiales.”

11. Enteral
   - Mostrar cockpit, plan, logs, tolerancia y alertas si existen.
   - Frase obligatoria: “E2E Enteral automatizado requiere credenciales E2E.”

12. Parenteral básico
   - Mostrar flujo básico controlado.
   - Frase obligatoria: “Parenteral es funcional básico controlado, no parenteral avanzado.”

13. Deportivo/Somatocarta
   - Mostrar perfil/evaluaciones y somatocarta solo si hay datos suficientes.
   - Frase obligatoria: “No se inventa somatotipo si faltan mediciones.”

14. Usuarios/Roles
   - Mostrar memberships, roles y panel QA.
   - Frase obligatoria: “Edge Function requiere SUPABASE_ACCESS_TOKEN para deploy.”

15. Auditoría
   - Mostrar timeline de eventos sensibles.
   - Confirmar auditoría de acciones cerradas.

16. Bloqueos pendientes
   - “QA Seguridad P0 requiere usuarios reales.”
   - “E2E Enteral requiere credenciales E2E.”
   - “Edge Function requiere SUPABASE_ACCESS_TOKEN.”
   - “Pediatría avanzada requiere CSV oficiales WHO/OMS.”
   - “report.exported requiere confirmación autenticada en `/app/audit`.”

## Comandos útiles antes de la demo

```bash
npm run verify:pilot
```

Si se necesita separar pasos:

```bash
npm run check:env
npm run qa:local
npm run unblock:steps
```
