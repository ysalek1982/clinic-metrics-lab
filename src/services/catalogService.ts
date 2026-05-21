import { FORMULA_LIBRARY, MEASUREMENT_PROTOCOLS, MEASUREMENT_SITES, SCREENING_TEMPLATES } from "@/data/clinical";
import { supabase } from "@/integrations/supabase/client";
import type {
  FormulaApplicability,
  FormulaDefinition,
  FormulaVersion,
  MeasurementProtocol,
  MeasurementSite,
  ScreeningTemplate,
} from "@/types/clinical";
import type { Json } from "@/integrations/supabase/types";

export interface CatalogStatus {
  source: "supabase" | "demo";
  planCount: number;
  packCount: number;
  measurementSiteCount: number;
  measurementProtocolCount: number;
  formulaCount: number;
  formulaVersionCount: number;
  screeningTemplateCount: number;
  checkedAt: string;
}

export interface CatalogResult<T> {
  source: "supabase" | "demo";
  data: T;
}

const DEMO_CATALOG_STATUS: CatalogStatus = {
  source: "demo",
  planCount: 0,
  packCount: 0,
  measurementSiteCount: 0,
  measurementProtocolCount: 0,
  formulaCount: 0,
  formulaVersionCount: 0,
  screeningTemplateCount: 0,
  checkedAt: new Date(0).toISOString(),
};

async function countRows(table: Parameters<NonNullable<typeof supabase>["from"]>[0]) {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

async function hasRemoteSession() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session.user);
}

export async function getCatalogStatus(): Promise<CatalogStatus> {
  if (!supabase) return { ...DEMO_CATALOG_STATUS, checkedAt: new Date().toISOString() };

  const [
    planCount,
    packCount,
    measurementSiteCount,
    measurementProtocolCount,
    formulaCount,
    formulaVersionCount,
    screeningTemplateCount,
  ] = await Promise.all([
    countRows("subscription_plans"),
    countRows("specialty_packs"),
    countRows("measurement_sites"),
    countRows("measurement_protocols"),
    countRows("formula_library"),
    countRows("formula_versions"),
    countRows("screening_templates"),
  ]);

  return {
    source: "supabase",
    planCount,
    packCount,
    measurementSiteCount,
    measurementProtocolCount,
    formulaCount,
    formulaVersionCount,
    screeningTemplateCount,
    checkedAt: new Date().toISOString(),
  };
}

function asStringArray(value: Json | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseApplicability(value: Json): FormulaApplicability {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { packs: [], populations: [], contexts: [] };
  }

  const record = value as Record<string, Json | undefined>;

  return {
    minAgeYears: typeof record.minAgeYears === "number" ? record.minAgeYears : undefined,
    maxAgeYears: typeof record.maxAgeYears === "number" ? record.maxAgeYears : undefined,
    sex:
      record.sex === "female" || record.sex === "male" || record.sex === "any"
        ? record.sex
        : undefined,
    packs: asStringArray(record.packs) as FormulaApplicability["packs"],
    populations: asStringArray(record.populations),
    contexts: asStringArray(record.contexts),
    requiredProtocolIds: asStringArray(record.requiredProtocolIds),
  };
}

export async function getFormulaCatalog(): Promise<CatalogResult<FormulaDefinition[]>> {
  if (!supabase) {
    return { source: "demo", data: FORMULA_LIBRARY };
  }

  const [{ data: formulas, error: formulaError }, { data: versions, error: versionError }] = await Promise.all([
    supabase.from("formula_library").select("*").order("name"),
    supabase.from("formula_versions").select("*").order("formula_id").order("version"),
  ]);

  if (formulaError || versionError || !formulas || !versions) {
    if (await hasRemoteSession()) {
      throw formulaError ?? versionError ?? new Error("No se pudo cargar el catálogo de formulas.");
    }
    return { source: "demo", data: FORMULA_LIBRARY };
  }

  const versionsByFormula = new Map<string, FormulaVersion[]>();
  for (const version of versions) {
    const mapped: FormulaVersion = {
      id: version.id,
      formulaId: version.formula_id,
      version: version.version,
      status: version.status as FormulaVersion["status"],
      expressionLabel: version.expression_label,
      inputSiteIds: version.input_site_ids,
      outputs: version.outputs as FormulaVersion["outputs"],
      applicability: parseApplicability(version.applicability),
      source: version.source ?? "",
      activatedAt: version.activated_at ?? version.created_at,
      deprecatedAt: version.deprecated_at ?? undefined,
      clinicalNotes: version.clinical_notes ?? "",
    };

    const current = versionsByFormula.get(version.formula_id) ?? [];
    current.push(mapped);
    versionsByFormula.set(version.formula_id, current);
  }

  const mappedFormulas: FormulaDefinition[] = formulas.map((formula) => ({
    id: formula.id,
    name: formula.name,
    category: formula.category,
    description: formula.description,
    owner: formula.owner === "tenant" ? "tenant" : "system",
    auditRequired: formula.audit_required,
    versions: versionsByFormula.get(formula.id) ?? [],
  }));

  return { source: "supabase", data: mappedFormulas };
}

function isScoringRecord(
  value: Json,
): value is ScreeningTemplate["scoring"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const record = value as Record<string, Json | undefined>;
  return ["low", "moderate", "high", "critical"].every((key) => {
    const item = record[key];
    return Array.isArray(item) && item.length === 2 && item.every((valuePart) => typeof valuePart === "number");
  });
}

export async function getScreeningCatalog(): Promise<CatalogResult<ScreeningTemplate[]>> {
  if (!supabase) {
    return { source: "demo", data: SCREENING_TEMPLATES };
  }

  const { data, error } = await supabase.from("screening_templates").select("*").order("name");

  if (error || !data) {
    if (await hasRemoteSession()) {
      throw error ?? new Error("No se pudo cargar el catálogo de screenings.");
    }
    return { source: "demo", data: SCREENING_TEMPLATES };
  }

  const templates: ScreeningTemplate[] = data.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    packIds: template.pack_ids as ScreeningTemplate["packIds"],
    context: template.context as ScreeningTemplate["context"],
    version: template.version,
    scoring: isScoringRecord(template.scoring) ? template.scoring : SCREENING_TEMPLATES[0].scoring,
    items: Array.isArray(template.items) ? (template.items as ScreeningTemplate["items"]) : [],
    rules: Array.isArray(template.rules) ? (template.rules as ScreeningTemplate["rules"]) : [],
  }));

  return { source: "supabase", data: templates };
}

export async function getMeasurementCatalog(): Promise<
  CatalogResult<{
    protocols: MeasurementProtocol[];
    sites: MeasurementSite[];
  }>
> {
  if (!supabase) {
    return { source: "demo", data: { protocols: MEASUREMENT_PROTOCOLS, sites: MEASUREMENT_SITES } };
  }

  const [{ data: protocols, error: protocolsError }, { data: sites, error: sitesError }] = await Promise.all([
    supabase.from("measurement_protocols").select("*").order("name"),
    supabase.from("measurement_sites").select("*").order("name"),
  ]);

  if (protocolsError || sitesError || !protocols || !sites) {
    if (await hasRemoteSession()) {
      throw protocolsError ?? sitesError ?? new Error("No se pudo cargar el catálogo antropométrico.");
    }

    return { source: "demo", data: { protocols: MEASUREMENT_PROTOCOLS, sites: MEASUREMENT_SITES } };
  }

  return {
    source: "supabase",
    data: {
      protocols: protocols.map((protocol) => ({
        id: protocol.id,
        name: protocol.name,
        shortName: protocol.short_name,
        description: protocol.description,
        level: protocol.level as MeasurementProtocol["level"],
        siteIds: protocol.site_ids,
        requiredAttempts: protocol.required_attempts,
        qualityRules: Array.isArray(protocol.quality_rules)
          ? protocol.quality_rules.filter((item): item is string => typeof item === "string")
          : [],
        packs: protocol.packs as MeasurementProtocol["packs"],
      })),
      sites: sites.map((site) => ({
        id: site.id,
        code: site.code,
        name: site.name,
        category: site.category as MeasurementSite["category"],
        unit: site.unit as MeasurementSite["unit"],
        bilateral: site.bilateral,
        requiredAttempts: site.required_attempts,
        tolerance: Number(site.tolerance),
        anatomicalHint: site.anatomical_hint ?? "",
        packs: site.packs as MeasurementSite["packs"],
      })),
    },
  };
}
