import type { PackId, RiskLevel } from "@/types/domain";

export type MeasurementCategory =
  | "basic"
  | "skinfold"
  | "girth"
  | "length"
  | "breadth"
  | "depth"
  | "segment"
  | "derived";

export type FormulaStatus = "draft" | "active" | "deprecated";

export type FormulaOutputType =
  | "body_fat_percent"
  | "fat_free_mass_kg"
  | "muscle_mass_kg"
  | "bmr"
  | "somatotype"
  | "z_score"
  | "percentile"
  | "risk_score";

export interface MeasurementSite {
  id: string;
  code: string;
  name: string;
  category: MeasurementCategory;
  unit: "kg" | "cm" | "mm" | "ratio" | "score";
  bilateral: boolean;
  requiredAttempts: number;
  tolerance: number;
  anatomicalHint: string;
  packs: PackId[];
}

export interface MeasurementProtocol {
  id: string;
  name: string;
  shortName: string;
  description: string;
  level: "restricted" | "advanced" | "clinical" | "tenant_custom";
  siteIds: string[];
  requiredAttempts: number;
  qualityRules: string[];
  packs: PackId[];
}

export interface FormulaApplicability {
  minAgeYears: number;
  maxAgeYears: number;
  sex: "female" | "male" | "any";
  packs: PackId[];
  populations: string[];
  contexts: string[];
  requiredProtocolIds: string[];
}

export interface FormulaVersion {
  id: string;
  formulaId: string;
  version: string;
  status: FormulaStatus;
  expressionLabel: string;
  inputSiteIds: string[];
  outputs: FormulaOutputType[];
  applicability: FormulaApplicability;
  source: string;
  activatedAt: string;
  deprecatedAt: string;
  clinicalNotes: string;
}

export interface FormulaDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  owner: "system" | "tenant";
  versions: FormulaVersion[];
  auditRequired: boolean;
}

export interface ScreeningItem {
  id: string;
  label: string;
  type: "single_choice" | "multi_choice" | "numeric" | "boolean";
  options: { label: string; value: string; score: number; flag: string }[];
  unit: string;
  required: boolean;
}

export interface ScreeningRule {
  id: string;
  label: string;
  when: string;
  severity: RiskLevel;
  recommendation: string;
}

export interface ScreeningTemplate {
  id: string;
  name: string;
  description: string;
  packIds: PackId[];
  context: "hospital" | "outpatient" | "pediatric" | "geriatric" | "sports" | "maternal" | "critical_care";
  version: string;
  scoring: {
    low: [number, number];
    moderate: [number, number];
    high: [number, number];
    critical: [number, number];
  };
  items: ScreeningItem[];
  rules: ScreeningRule[];
}

export interface ScreeningExecution {
  id: string;
  templateId: string;
  tenantId: string;
  patientId: string;
  date: string;
  score: number;
  level: RiskLevel;
  flags: string[];
  nextReviewDays: number;
  recommendation: string;
}

export interface ClinicalAssessmentSection {
  id: string;
  title: string;
  fields: {
    id: string;
    label: string;
    type: "text" | "textarea" | "select" | "numeric" | "boolean" | "date";
    required: boolean;
    packIds: PackId[];
  }[];
}

export interface ClinicalRule {
  id: string;
  name: string;
  scope: "tenant" | "pack" | "patient" | "formula" | "screening";
  trigger: string;
  action: string;
  severity: RiskLevel;
  enabled: boolean;
}
