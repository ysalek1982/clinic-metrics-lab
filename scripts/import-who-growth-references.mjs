#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INDICATOR_MAP = {
  weight_for_age: "weight_for_age",
  height_for_age: "height_for_age",
  length_height_for_age: "height_for_age",
  weight_for_length_height: "weight_for_length_height",
  bmi_for_age: "bmi_for_age",
  head_circumference_for_age: "head_circumference_for_age",
};

const REQUIRED_COLUMNS = ["standard", "indicator", "sex", "x_value", "x_unit", "l", "m", "s"];
const VALID_SEX_CODES = new Set(["male", "female"]);
const VALID_X_UNITS = new Set(["days", "months", "cm"]);
const NUMERIC_REQUIRED_COLUMNS = ["x_value", "l", "m", "s"];

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current.startsWith("--")) {
      args.set(current.slice(2), argv[index + 1]);
      index += 1;
    }
  }
  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  if (value === null || value === undefined || value === "") return "null";
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? String(parsed) : "null";
}

function sexCode(value) {
  const normalized = value.trim().toLowerCase();
  if (["f", "female", "girl", "girls", "niña", "nina", "ninas", "niñas"].includes(normalized)) return "female";
  if (["m", "male", "boy", "boys", "niño", "nino", "ninos", "niños"].includes(normalized)) return "male";
  return normalized;
}

function indicatorCode(value) {
  const normalized = value.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_").replaceAll("/", "_");
  return INDICATOR_MAP[normalized] ?? normalized;
}

function xUnitCode(value) {
  return value.trim().toLowerCase();
}

function validateHeaders(headers) {
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length > 0) {
    throw new Error(`CSV no normalizado. Faltan columnas: ${missing.join(", ")}`);
  }
}

function rowToObject(headers, values) {
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
}

function referenceCode(row) {
  const xUnit = xUnitCode(row.x_unit);
  return [
    row.standard,
    row.indicator,
    sexCode(row.sex),
    xUnit === "cm" ? "length_height" : "age",
  ]
    .join("_")
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]/g, "_");
}

function validateRows(rows) {
  const errors = [];
  const seenPoints = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const sex = sexCode(row.sex);
    const indicator = indicatorCode(row.indicator);
    const xUnit = xUnitCode(row.x_unit);

    if (!row.standard.trim()) errors.push(`fila ${rowNumber}: standard vacío`);
    if (!indicator.trim()) errors.push(`fila ${rowNumber}: indicator vacío`);
    if (!VALID_SEX_CODES.has(sex)) errors.push(`fila ${rowNumber}: sex inválido (${row.sex})`);
    if (!VALID_X_UNITS.has(xUnit)) errors.push(`fila ${rowNumber}: x_unit inválido (${row.x_unit})`);

    for (const column of NUMERIC_REQUIRED_COLUMNS) {
      if (sqlNumber(row[column]) === "null") errors.push(`fila ${rowNumber}: ${column} debe ser numérico`);
    }

    const pointKey = `${referenceCode({ ...row, x_unit: xUnit })}|${sqlNumber(row.x_value)}`;
    if (seenPoints.has(pointKey)) errors.push(`fila ${rowNumber}: punto duplicado (${pointKey})`);
    seenPoints.add(pointKey);
  });

  if (errors.length > 0) {
    throw new Error(`CSV WHO/OMS no válido:\n- ${errors.join("\n- ")}`);
  }
}

function setValues(row, sourceUrl, version) {
  const code = referenceCode(row);
  const indicator = indicatorCode(row.indicator);
  const sex = sexCode(row.sex);
  const xUnit = xUnitCode(row.x_unit);
  const ageMin = row.age_min_months || (xUnit === "months" ? row.x_value : 0);
  const ageMax = row.age_max_months || (xUnit === "months" ? row.x_value : 60);

  return `(${[
    sqlString(code),
    sqlString(`${row.standard} ${indicator} ${sex}`),
    sqlString(row.source || "WHO"),
    sqlString(sourceUrl),
    sqlNumber(ageMin),
    sqlNumber(ageMax),
    sqlString(sex),
    sqlString(indicator),
    sqlString(version),
    "'active'",
  ].join(", ")})`;
}

function pointValues(row) {
  const xUnit = xUnitCode(row.x_unit);
  return `(${[
    sqlString(referenceCode(row)),
    sqlString(sexCode(row.sex)),
    sqlString(indicatorCode(row.indicator)),
    sqlNumber(row.x_value),
    sqlString(xUnit),
    sqlNumber(row.l),
    sqlNumber(row.m),
    sqlNumber(row.s),
    sqlNumber(row.p01),
    sqlNumber(row.p03),
    sqlNumber(row.p05),
    sqlNumber(row.p10),
    sqlNumber(row.p15),
    sqlNumber(row.p25),
    sqlNumber(row.p50),
    sqlNumber(row.p75),
    sqlNumber(row.p85),
    sqlNumber(row.p90),
    sqlNumber(row.p95),
    sqlNumber(row.p97),
    sqlNumber(row.p99),
    sqlNumber(row.sd_minus_3),
    sqlNumber(row.sd_minus_2),
    sqlNumber(row.sd_minus_1),
    sqlNumber(row.sd_0),
    sqlNumber(row.sd_plus_1),
    sqlNumber(row.sd_plus_2),
    sqlNumber(row.sd_plus_3),
  ].join(", ")})`;
}

function buildSql(rows, sourceUrl, version) {
  const setRows = Array.from(new Map(rows.map((row) => [referenceCode(row), row])).values());
  return `-- Generated from official WHO growth reference CSV files.
-- Do not edit clinical values by hand. Regenerate with scripts/import-who-growth-references.mjs.
-- Source URL: ${sourceUrl}
-- Version: ${version}
-- Reference sets: ${setRows.length}
-- Reference points: ${rows.length}

with reference_sets(code, name, source, source_url, age_min_months, age_max_months, sex, indicator_code, version, status) as (
  values
    ${setRows.map((row) => setValues(row, sourceUrl, version)).join(",\n    ")}
)
insert into public.growth_reference_sets (
  code, name, source, source_url, age_min_months, age_max_months, sex, indicator_code, version, status
)
select code, name, source, source_url, age_min_months::integer, age_max_months::integer, sex, indicator_code, version, status
from reference_sets
on conflict (code, version, sex, indicator_code) do update set
  name = excluded.name,
  source = excluded.source,
  source_url = excluded.source_url,
  age_min_months = excluded.age_min_months,
  age_max_months = excluded.age_max_months,
  status = 'active';

with reference_points(
  reference_code, sex, indicator_code, x_value, x_unit, l_value, m_value, s_value,
  p01, p03, p05, p10, p15, p25, p50, p75, p85, p90, p95, p97, p99,
  z_minus_3, z_minus_2, z_minus_1, z_0, z_plus_1, z_plus_2, z_plus_3
) as (
  values
    ${rows.map(pointValues).join(",\n    ")}
)
insert into public.growth_reference_points (
  reference_set_id, sex, indicator_code, x_value, x_unit, l_value, m_value, s_value,
  p01, p03, p05, p10, p15, p25, p50, p75, p85, p90, p95, p97, p99,
  z_minus_3, z_minus_2, z_minus_1, z_0, z_plus_1, z_plus_2, z_plus_3
)
select
  grs.id,
  rp.sex,
  rp.indicator_code,
  rp.x_value::numeric,
  rp.x_unit,
  rp.l_value::numeric,
  rp.m_value::numeric,
  rp.s_value::numeric,
  rp.p01::numeric,
  rp.p03::numeric,
  rp.p05::numeric,
  rp.p10::numeric,
  rp.p15::numeric,
  rp.p25::numeric,
  rp.p50::numeric,
  rp.p75::numeric,
  rp.p85::numeric,
  rp.p90::numeric,
  rp.p95::numeric,
  rp.p97::numeric,
  rp.p99::numeric,
  rp.z_minus_3::numeric,
  rp.z_minus_2::numeric,
  rp.z_minus_1::numeric,
  rp.z_0::numeric,
  rp.z_plus_1::numeric,
  rp.z_plus_2::numeric,
  rp.z_plus_3::numeric
from reference_points rp
join public.growth_reference_sets grs
  on grs.code = rp.reference_code
 and grs.sex = rp.sex
 and grs.indicator_code = rp.indicator_code
 and grs.version = ${sqlString(version)}
on conflict (reference_set_id, x_value) do update set
  l_value = excluded.l_value,
  m_value = excluded.m_value,
  s_value = excluded.s_value,
  p01 = excluded.p01,
  p03 = excluded.p03,
  p05 = excluded.p05,
  p10 = excluded.p10,
  p15 = excluded.p15,
  p25 = excluded.p25,
  p50 = excluded.p50,
  p75 = excluded.p75,
  p85 = excluded.p85,
  p90 = excluded.p90,
  p95 = excluded.p95,
  p97 = excluded.p97,
  p99 = excluded.p99,
  z_minus_3 = excluded.z_minus_3,
  z_minus_2 = excluded.z_minus_2,
  z_minus_1 = excluded.z_minus_1,
  z_0 = excluded.z_0,
  z_plus_1 = excluded.z_plus_1,
  z_plus_2 = excluded.z_plus_2,
  z_plus_3 = excluded.z_plus_3;
`;
}

const args = parseArgs(process.argv.slice(2));
const input = args.get("input");
const output = args.get("output") ?? "supabase/migrations/20260510190000_who_growth_reference_points.sql";
const sourceUrl = args.get("source-url") ?? "https://www.who.int/tools/child-growth-standards/standards";
const version = args.get("version") ?? "WHO-official";

if (!input) {
  throw new Error("Uso: node scripts/import-who-growth-references.mjs --input data/who-growth-normalized.csv --output supabase/migrations/YYYYMMDDHHMMSS_who_growth_reference_points.sql --version WHO-2006");
}

const csv = await readFile(input, "utf8");
const [rawHeaders, ...rawRows] = parseCsv(csv);
const headers = rawHeaders.map(normalizeHeader);
validateHeaders(headers);

const rows = rawRows.map((row) => rowToObject(headers, row)).filter((row) => row.standard && row.indicator && row.sex);
if (rows.length === 0) {
  throw new Error("El CSV no contiene filas de referencia válidas.");
}
validateRows(rows);

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, buildSql(rows, sourceUrl, version), "utf8");
console.log(`Migración generada: ${output}`);
