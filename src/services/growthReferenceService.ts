import { supabase } from "@/integrations/supabase/client";
import type {
  GrowthIndicatorCode,
  GrowthReferencePoint,
  GrowthReferencePolicy,
  GrowthReferenceSet,
  PediatricSex,
} from "@/domain/clinical/pediatricGrowthEngine";

export interface GrowthReferenceBundle {
  source: "supabase" | "demo";
  policies: GrowthReferencePolicy[];
  referenceSets: GrowthReferenceSet[];
  referencePoints: GrowthReferencePoint[];
}

type UnknownRow = Record<string, unknown>;

async function hasRemoteSession() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

function stringValue(row: UnknownRow, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function numberValue(row: UnknownRow, key: string) {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(row: UnknownRow, key: string, fallback = false) {
  const value = row[key];
  return typeof value === "boolean" ? value : fallback;
}

function mapReferenceSet(row: UnknownRow): GrowthReferenceSet {
  const rawStatus = stringValue(row, "status", "incomplete");

  return {
    id: stringValue(row, "id"),
    code: stringValue(row, "code"),
    name: stringValue(row, "name"),
    source: stringValue(row, "source", "Sin fuente"),
    sourceUrl: stringValue(row, "source_url") || null,
    ageMinMonths: numberValue(row, "age_min_months") ?? 0,
    ageMaxMonths: numberValue(row, "age_max_months") ?? 0,
    sex: stringValue(row, "sex") as PediatricSex,
    indicatorCode: stringValue(row, "indicator_code") as GrowthIndicatorCode,
    version: stringValue(row, "version", "sin version"),
    status: rawStatus === "active" || rawStatus === "demo" || rawStatus === "draft" || rawStatus === "deprecated" ? rawStatus : "draft",
  };
}

function mapReferencePoint(row: UnknownRow): GrowthReferencePoint {
  return {
    referenceSetId: stringValue(row, "reference_set_id"),
    sex: stringValue(row, "sex") as PediatricSex,
    indicatorCode: stringValue(row, "indicator_code") as GrowthIndicatorCode,
    xValue: numberValue(row, "x_value") ?? 0,
    xUnit: stringValue(row, "x_unit", "months") as GrowthReferencePoint["xUnit"],
    lValue: numberValue(row, "l_value"),
    mValue: numberValue(row, "m_value"),
    sValue: numberValue(row, "s_value"),
    p01: numberValue(row, "p01"),
    p03: numberValue(row, "p03"),
    p05: numberValue(row, "p05"),
    p10: numberValue(row, "p10"),
    p15: numberValue(row, "p15"),
    p25: numberValue(row, "p25"),
    p50: numberValue(row, "p50"),
    p75: numberValue(row, "p75"),
    p85: numberValue(row, "p85"),
    p90: numberValue(row, "p90"),
    p95: numberValue(row, "p95"),
    p97: numberValue(row, "p97"),
    p99: numberValue(row, "p99"),
    zMinus3: numberValue(row, "z_minus_3"),
    zMinus2: numberValue(row, "z_minus_2"),
    zMinus1: numberValue(row, "z_minus_1"),
    z0: numberValue(row, "z_0"),
    zPlus1: numberValue(row, "z_plus_1"),
    zPlus2: numberValue(row, "z_plus_2"),
    zPlus3: numberValue(row, "z_plus_3"),
  };
}

function mapPolicy(row: UnknownRow): GrowthReferencePolicy {
  return {
    indicatorCode: stringValue(row, "indicator_code") as GrowthIndicatorCode,
    ageMinMonths: numberValue(row, "age_min_months") ?? 0,
    ageMaxMonths: numberValue(row, "age_max_months") ?? 60,
    preferredReferenceSetId: stringValue(row, "preferred_reference_set_id") || null,
    fallbackReferenceSetId: stringValue(row, "fallback_reference_set_id") || null,
    isActive: booleanValue(row, "is_active", true),
  };
}

export async function getGrowthReferencesForTenant(tenantId: string | null, packCode = "pediatric"): Promise<GrowthReferenceBundle> {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    return { source: "demo", policies: [], referenceSets: [], referencePoints: [] };
  }

  const policiesResult = await supabase
    .from("tenant_growth_reference_policies")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("pack_code", packCode)
    .eq("is_active", true);

  if (policiesResult.error) {
    throw policiesResult.error;
  }

  const policies = (policiesResult.data ?? []).map((row) => mapPolicy(row as UnknownRow));
  const configuredReferenceIds = Array.from(
    new Set(
      policies
        .flatMap((policy) => [policy.preferredReferenceSetId, policy.fallbackReferenceSetId])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const referenceSetsQuery = supabase
    .from("growth_reference_sets")
    .select("*")
    .in("status", ["active", "complete", "demo"]);

  const referenceSetsResult = configuredReferenceIds.length > 0
    ? await referenceSetsQuery.in("id", configuredReferenceIds)
    : await referenceSetsQuery.limit(200);

  if (referenceSetsResult.error) {
    throw referenceSetsResult.error;
  }

  const referenceSets = (referenceSetsResult.data ?? []).map((row) => mapReferenceSet(row as UnknownRow));
  const referenceSetIds = referenceSets.map((set) => set.id);

  if (referenceSetIds.length === 0) {
    return { source: "supabase", policies, referenceSets, referencePoints: [] };
  }

  const pointsResult = await supabase
    .from("growth_reference_points")
    .select("*")
    .in("reference_set_id", referenceSetIds)
    .order("x_value", { ascending: true });

  if (pointsResult.error) {
    throw pointsResult.error;
  }

  return {
    source: "supabase",
    policies,
    referenceSets,
    referencePoints: (pointsResult.data ?? []).map((row) => mapReferencePoint(row as UnknownRow)),
  };
}
