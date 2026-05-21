// ============================================================
// Nutri - Domain Types
// Core entities + pack-specific extensions
// ============================================================

export type PackId =
  | "clinical"
  | "pediatric"
  | "neonatal"
  | "gineco"
  | "enteral"
  | "parenteral"
  | "sport"
  | "onco"
  | "nephro"
  | "gastro"
  | "endocrine"
  | "geriatric"
  | "wellness"
  | "tele";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type RoleId =
  | "superadmin"
  | "med_director"
  | "nut_director"
  | "clinical_nut"
  | "sport_nut"
  | "anthropometrist"
  | "nurse"
  | "physician"
  | "kitchen"
  | "trainer"
  | "reception"
  | "patient";

export interface Organization {
  id: string;
  name: string;
  type: "hospital" | "clinic" | "sports_center" | "private" | "university" | "pediatric_center";
  branches: string[];
  activePacks: PackId[];
  logo: string;
  primaryColor: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  avatar: string;
  org_id: string;
}

export type PatientStatus = "stable" | "monitoring" | "at_risk" | "critical" | "discharged";

export interface Patient {
  id: string;
  mrn: string; // medical record number
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: "male" | "female" | "other";
  status: PatientStatus;
  risk: RiskLevel;
  primaryPack: PackId;
  packs: PackId[];
  diagnoses: string[];
  allergies: string[];
  ward: string;
  bed: string;
  admissionDate: string;
  attendingPhysician: string;
  lastEvaluation: string;
  nextFollowUp: string;
  avatar: string;
  // pack-specific snapshots
  pediatric: {
    gestationalAgeWeeks: number;
    weightForAgeZ: number;
    heightForAgeZ: number;
    bmiForAgeZ: number;
  };
  pregnancy: {
    weeksGestation: number;
    prePregnancyWeight: number;
    expectedGain: [number, number];
    actualGain: number;
  };
  enteral: {
    tubeType: string;
    formula: string;
    rateMlH: number;
    totalKcal: number;
    tolerance: "good" | "moderate" | "poor";
  };
  sport: {
    discipline: string;
    position: string;
    category: string;
    phase: string;
    objective: string;
  };
}

export interface AnthropometryMeasurement {
  site: string;
  value: number;
  unit: string;
  attempt: number;
  category: "basic" | "skinfold" | "girth" | "length" | "breadth" | "depth";
}

export interface AnthropometrySession {
  id: string;
  patientId: string;
  date: string;
  evaluator: string;
  protocol: string;
  measurements: AnthropometryMeasurement[];
  derived: {
    bmi: number;
    sumSkinfolds6: number;
    sumSkinfolds8: number;
    fatMassPct: number;
    fatFreeMassKg: number;
    muscleMassKg: number;
    waistHip: number;
    somatotype: { endo: number; meso: number; ecto: number };
  };
  formulaVersionId: string;
  qualityIndex: number; // TEM-derived
  notes: string;
}

export interface ScreeningResult {
  id: string;
  patientId: string;
  date: string;
  protocol: string;
  score: number;
  level: RiskLevel;
  flags: string[]; // e.g. ["weight_loss", "low_intake", "refeeding_risk"]
  recommendation: string;
  nextReview: string;
}

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  type: "nutritional_risk" | "weight_loss" | "tolerance" | "lab_value" | "missing_data" | "follow_up";
  severity: RiskLevel;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface NutritionPlan {
  id: string;
  patientId: string;
  type: "oral" | "enteral" | "parenteral" | "mixed";
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fluids_ml: number;
  diet: string;
  texture: string;
  restrictions: string[];
  startDate: string;
  status: "active" | "scheduled" | "ended";
}

export interface EvolutionEntry {
  id: string;
  patientId: string;
  date: string;
  weightKg: number;
  notes: string;
  author: string;
  type: "anthropometry" | "screening" | "clinical" | "plan_change" | "lab" | "note";
}

export interface PackDefinition {
  id: PackId;
  name: string;
  shortName: string;
  description: string;
  color: string; // tailwind class fragment
  cssVar: string; // --pack-*
  icon: string; // lucide name
}

