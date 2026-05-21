# Referencias pediátricas oficiales WHO/OMS

Nutri no debe calcular z-score, percentil ni curvas pediátricas con datos inventados. El módulo está preparado para cargar referencias oficiales, pero este repositorio no contiene actualmente CSV/XLSX oficiales completos y normalizados.

Estado actual: **Pediatría funcional con referencia incompleta controlada**.

## Fuentes oficiales

- WHO Child Growth Standards 0-5 años: https://www.who.int/tools/child-growth-standards/standards
- WHO 2006 BMI-for-age 0-5 años: https://www.who.int/toolkits/child-growth-standards/standards/body-mass-index-for-age-bmi-for-age
- WHO Growth Reference 5-19 años: https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators
- WHO 2007 height-for-age 5-19 años: https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/height-for-age
- WHO 2007 weight-for-age 5-10 años: https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/weight-for-age-5to10-years
- WHO 2007 BMI-for-age 5-19 años: https://www.who.int/growthref/who2007_bmi_for_age/en/

## Archivos requeridos

Descargar desde WHO/OMS y conservar trazabilidad de fuente, versión, fecha de descarga y responsable de normalización:

- 0-5 años: peso/edad, longitud o talla/edad, peso/longitud o peso/talla, IMC/edad, perímetro cefálico/edad.
- 5-19 años: IMC/edad, talla/edad, peso/edad solo para 5-10 años.

No cargar tablas transcritas manualmente sin revisión doble. No usar referencias de terceros si no se validan contra la fuente WHO/OMS.

## Formato normalizado

El importador espera un CSV con estas columnas:

```csv
standard,indicator,sex,x_value,x_unit,l,m,s,sd_minus_3,sd_minus_2,sd_minus_1,sd_0,sd_plus_1,sd_plus_2,sd_plus_3,p01,p03,p05,p10,p15,p25,p50,p75,p85,p90,p95,p97,p99,source,age_min_months,age_max_months
```

Valores esperados:

- `standard`: `WHO-2006` o `WHO-2007`.
- `indicator`: `weight_for_age`, `height_for_age`, `weight_for_length_height`, `bmi_for_age`, `head_circumference_for_age`.
- `sex`: `male` o `female`.
- `x_unit`: `days`, `months` o `cm`, según indicador.
- `x_value`: edad o talla de la tabla fuente, según `x_unit`.
- `l`, `m`, `s`: parámetros LMS oficiales.
- `sd_*` y `p*`: líneas de referencia oficiales si existen en la tabla fuente.
- `source`: URL o nombre de archivo oficial.

Ejemplo de fila normalizada:

```csv
WHO-2006,weight_for_age,male,24,months,-0.3521,12.1515,0.10895,9.1,9.8,10.8,12.2,13.8,15.4,17.1,8.6,9.1,9.4,9.9,10.3,10.9,12.2,13.6,14.3,14.8,15.6,16.1,17.0,WHO Child Growth Standards,0,60
```

El ejemplo muestra formato, no autoriza cargar valores no verificados. Cada fila debe contrastarse contra el archivo oficial correspondiente.

## Generación de migración

Cuando exista un CSV normalizado y revisado:

```powershell
node scripts/import-who-growth-references.mjs `
  --input data/who-growth-normalized.csv `
  --output supabase/migrations/20260511190000_who_growth_reference_points.sql `
  --source-url "https://www.who.int/tools/child-growth-standards/standards" `
  --version "WHO-2006-2007"
```

El importador valida:

- columnas mínimas obligatorias;
- sexo permitido (`male`, `female`);
- unidad permitida (`days`, `months`, `cm`);
- LMS y eje `x_value` numéricos;
- puntos duplicados por referencia y eje.

La migración generada inserta `growth_reference_sets` activos y `growth_reference_points` con LMS y líneas SD/percentiles. Revisar el SQL generado antes de aplicarlo en remoto.

## QA clínico requerido

Antes de cerrar Pediatría avanzada completa:

- Confirmar que `growth_reference_points` contiene puntos oficiales para indicador, sexo y edad/talla usados en prueba.
- Confirmar que el motor LMS calcula z-score solo cuando existen `L`, `M`, `S`.
- Confirmar que el percentil deriva del z-score real.
- Confirmar que la UI dibuja curvas solo desde puntos oficiales.
- Confirmar que si falta referencia la UI muestra “Referencia incompleta” y no calcula.
- Confirmar `pediatric_reference.imported` si se importan referencias.

Mientras no existan referencias oficiales completas cargadas, el cierre permitido sigue siendo:

**Pediatría funcional con referencia incompleta controlada**.
