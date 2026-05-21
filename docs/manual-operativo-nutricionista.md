# Manual Operativo Nutricionista

## Flujo clinico principal

1. Entrar a `/app/patients`.
2. Crear o editar paciente.
3. Abrir expediente en PatientDetail.
4. Registrar episodios, evaluaciones y planes.
5. Revisar alertas en `/app/alerts`.
6. Gestionar agenda y mensajes si el rol lo permite.

## Nutricion operativa

- `/app/foods`: biblioteca real de alimentos.
- `/app/recipes`: crear y editar recetas con ingredientes reales.
- `/app/weekly-menu`: planificar menu por paciente y semana.

## Hospitalario

- `/app/pack/enteral/cockpit`: soporte enteral.
- `/app/pack/parenteral`: soporte parenteral basico controlado.

No usar parenteral como calculadora avanzada. No calcula osmolaridad ni electrolitos.

En parenteral basico se puede registrar:

- plan con volumen, glucosa, aminoacidos, lipidos y notas clinicas;
- monitoreo con glucosa, trigliceridos, notas hepaticas, cateter y complicaciones;
- cierre del plan cuando deja de estar activo.

## Pediatria

`/app/pediatric-curves` muestra mediciones reales y referencia incompleta cuando no hay puntos WHO/OMS cargados. No interpretar z-score si el sistema indica referencia incompleta.

## Deportivo

`/app/pack/sport/somatocarta` usa perfiles y evaluaciones reales. Si faltan datos antropometricos, no calcula somatotipo. El reporte deportivo se genera desde el centro de reportes.

## Reportes

`/app/reports` permite vista previa y generacion de reportes reales. Si una plantilla indica "Requiere datos", no inventar informacion.

El reporte deportivo puede generarse con datos insuficientes, pero debe marcar esas secciones como insuficientes y no inventar somatotipo.
