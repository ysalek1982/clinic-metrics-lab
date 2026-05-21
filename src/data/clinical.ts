import type {
  ClinicalAssessmentSection,
  ClinicalRule,
  FormulaDefinition,
  MeasurementProtocol,
  MeasurementSite,
  ScreeningExecution,
  ScreeningTemplate,
} from "@/types/clinical";

export const MEASUREMENT_SITES: MeasurementSite[] = [
  { id: "site-weight", code: "weight", name: "Peso", category: "basic", unit: "kg", bilateral: false, requiredAttempts: 2, tolerance: 0.2, anatomicalHint: "Balanza calibrada, ropa ligera, sin calzado.", packs: ["clinical", "sport", "pediatric", "gineco", "geriatric", "wellness"] },
  { id: "site-height", code: "height", name: "Talla", category: "basic", unit: "cm", bilateral: false, requiredAttempts: 2, tolerance: 0.5, anatomicalHint: "Plano de Frankfurt, talones juntos, inspiracion normal.", packs: ["clinical", "sport", "pediatric", "gineco", "geriatric", "wellness"] },
  { id: "site-sitting-height", code: "sitting_height", name: "Talla sentado", category: "length", unit: "cm", bilateral: false, requiredAttempts: 2, tolerance: 0.5, anatomicalHint: "Sujeto sentado erguido sobre banco antropometrico.", packs: ["sport", "pediatric"] },
  { id: "site-arm-span", code: "arm_span", name: "Envergadura", category: "length", unit: "cm", bilateral: false, requiredAttempts: 2, tolerance: 0.7, anatomicalHint: "Brazos extendidos horizontalmente, medicion dedo a dedo.", packs: ["sport", "pediatric", "geriatric"] },
  { id: "site-triceps", code: "triceps", name: "Pliegue tricipital", category: "skinfold", unit: "mm", bilateral: true, requiredAttempts: 2, tolerance: 1.0, anatomicalHint: "Linea media posterior del brazo, entre acromiale y radiale.", packs: ["sport", "pediatric", "geriatric", "wellness"] },
  { id: "site-subscapular", code: "subscapular", name: "Pliegue subescapular", category: "skinfold", unit: "mm", bilateral: false, requiredAttempts: 2, tolerance: 1.0, anatomicalHint: "Oblicuo, 2 cm bajo angulo inferior de la escapula.", packs: ["sport", "pediatric", "wellness"] },
  { id: "site-biceps", code: "biceps", name: "Pliegue bicipital", category: "skinfold", unit: "mm", bilateral: false, requiredAttempts: 2, tolerance: 1.0, anatomicalHint: "Linea anterior del brazo al nivel del triceps.", packs: ["sport", "wellness"] },
  { id: "site-iliac-crest", code: "iliac_crest", name: "Pliegue cresta iliaca", category: "skinfold", unit: "mm", bilateral: false, requiredAttempts: 2, tolerance: 1.5, anatomicalHint: "Sobre cresta iliaca, linea axilar media.", packs: ["sport", "wellness"] },
  { id: "site-supraspinale", code: "supraspinale", name: "Pliegue supraespinal", category: "skinfold", unit: "mm", bilateral: false, requiredAttempts: 2, tolerance: 1.5, anatomicalHint: "Interseccion entre iliocristale y borde axilar anterior.", packs: ["sport", "wellness"] },
  { id: "site-abdominal", code: "abdominal", name: "Pliegue abdominal", category: "skinfold", unit: "mm", bilateral: false, requiredAttempts: 2, tolerance: 2.0, anatomicalHint: "Vertical, 5 cm lateral al ombligo.", packs: ["sport", "wellness", "endocrine"] },
  { id: "site-front-thigh", code: "front_thigh", name: "Pliegue muslo frontal", category: "skinfold", unit: "mm", bilateral: true, requiredAttempts: 2, tolerance: 2.0, anatomicalHint: "Linea media anterior del muslo, sujeto sentado o de pie segun protocolo.", packs: ["sport", "wellness"] },
  { id: "site-medial-calf", code: "medial_calf", name: "Pliegue pierna medial", category: "skinfold", unit: "mm", bilateral: true, requiredAttempts: 2, tolerance: 1.5, anatomicalHint: "Maxima circunferencia de pantorrilla, cara medial.", packs: ["sport", "wellness", "geriatric"] },
  { id: "site-waist", code: "waist", name: "Perimetro cintura", category: "girth", unit: "cm", bilateral: false, requiredAttempts: 2, tolerance: 0.5, anatomicalHint: "Punto medio entre ultima costilla e iliocrestale.", packs: ["clinical", "sport", "endocrine", "wellness"] },
  { id: "site-hip", code: "hip", name: "Perimetro cadera", category: "girth", unit: "cm", bilateral: false, requiredAttempts: 2, tolerance: 0.5, anatomicalHint: "Mayor prominencia glutea, cinta horizontal.", packs: ["clinical", "sport", "endocrine", "wellness"] },
  { id: "site-arm-relaxed", code: "arm_relaxed", name: "Brazo relajado", category: "girth", unit: "cm", bilateral: true, requiredAttempts: 2, tolerance: 0.4, anatomicalHint: "Brazo relajado, punto medio acromiale-radiale.", packs: ["sport", "geriatric", "pediatric"] },
  { id: "site-humerus", code: "humerus_breadth", name: "Diametro humero", category: "breadth", unit: "cm", bilateral: true, requiredAttempts: 2, tolerance: 0.2, anatomicalHint: "Epicondilos humerales con antropometro pequeno.", packs: ["sport"] },
  { id: "site-femur", code: "femur_breadth", name: "Diametro femur", category: "breadth", unit: "cm", bilateral: true, requiredAttempts: 2, tolerance: 0.2, anatomicalHint: "Epicondilos femorales con rodilla flexionada.", packs: ["sport"] },
];

export const MEASUREMENT_PROTOCOLS: MeasurementProtocol[] = [
  {
    id: "protocol-isak-restricted",
    name: "ISAK restringido",
    shortName: "ISAK-R",
    description: "Base de peso, talla, ocho pliegues y perimetros clave para evaluacion deportiva y clinica.",
    level: "restricted",
    siteIds: ["site-weight", "site-height", "site-triceps", "site-subscapular", "site-biceps", "site-iliac-crest", "site-supraspinale", "site-abdominal", "site-front-thigh", "site-medial-calf", "site-waist", "site-hip"],
    requiredAttempts: 2,
    qualityRules: ["Delta por sitio dentro de tolerancia", "TEM intraevaluador < 2.5%", "Formula versionada obligatoria"],
    packs: ["sport", "wellness", "clinical"],
  },
  {
    id: "protocol-isak-advanced",
    name: "ISAK avanzado",
    shortName: "ISAK-A",
    description: "Incluye longitudes, diametros, perimetros y pliegues para somatotipo y composición avanzada.",
    level: "advanced",
    siteIds: MEASUREMENT_SITES.map((site) => site.id),
    requiredAttempts: 2,
    qualityRules: ["Doble medicion completa", "Revision de outliers", "Control interevaluador disponible"],
    packs: ["sport"],
  },
  {
    id: "protocol-pediatric-growth",
    name: "Crecimiento pediatrico",
    shortName: "PED-G",
    description: "Antropometria pediatrica con peso, talla, perimetros y z-scores.",
    level: "clinical",
    siteIds: ["site-weight", "site-height", "site-arm-relaxed", "site-triceps", "site-subscapular"],
    requiredAttempts: 2,
    qualityRules: ["Edad exacta obligatoria", "Curva y referencia versionadas", "Alerta z-score fuera de rango"],
    packs: ["pediatric", "neonatal"],
  },
];

export const FORMULA_LIBRARY: FormulaDefinition[] = [
  {
    id: "formula-yuhasz-1987",
    name: "Yuhasz",
    category: "Composición corporal",
    description: "Estimacion de porcentaje de grasa corporal mediante sumatoria de pliegues.",
    owner: "system",
    auditRequired: true,
    versions: [
      {
        id: "fv-yuhasz-1987-1-2",
        formulaId: "formula-yuhasz-1987",
        version: "1.2",
        status: "active",
        expressionLabel: "% grasa = a + b * sumatoria pliegues segun sexo/poblacion",
        inputSiteIds: ["site-triceps", "site-subscapular", "site-supraspinale", "site-abdominal", "site-front-thigh", "site-medial-calf"],
        outputs: ["body_fat_percent", "fat_free_mass_kg"],
        applicability: { minAgeYears: 18, maxAgeYears: 45, sex: "any", packs: ["sport", "wellness"], populations: ["adult athletes"], contexts: ["performance", "body composition"], requiredProtocolIds: ["protocol-isak-restricted", "protocol-isak-advanced"] },
        source: "Yuhasz MS. Physical Fitness Manual. 1987.",
        activatedAt: "2026-01-01",
        clinicalNotes: "Usar con cautela fuera de poblacion deportiva adulta.",
      },
    ],
  },
  {
    id: "formula-carter-heath",
    name: "Carter & Heath",
    category: "Somatotipo",
    description: "Metodo antropometrico para endomorfia, mesomorfia y ectomorfia.",
    owner: "system",
    auditRequired: true,
    versions: [
      {
        id: "fv-carter-heath-1990-1-0",
        formulaId: "formula-carter-heath",
        version: "1.0",
        status: "active",
        expressionLabel: "Somatotipo = endo + meso + ecto segun pliegues, diametros y talla",
        inputSiteIds: ["site-height", "site-triceps", "site-subscapular", "site-supraspinale", "site-humerus", "site-femur", "site-arm-relaxed", "site-medial-calf"],
        outputs: ["somatotype"],
        applicability: { minAgeYears: 14, sex: "any", packs: ["sport"], populations: ["athletes", "adolescents"], contexts: ["performance"], requiredProtocolIds: ["protocol-isak-advanced"] },
        source: "Carter JEL, Heath BH. Somatotyping. 1990.",
        activatedAt: "2026-01-01",
        clinicalNotes: "Requiere diametros y perimetros validados.",
      },
    ],
  },
  {
    id: "formula-who-growth",
    name: "OMS Growth Standards",
    category: "Crecimiento pediatrico",
    description: "Z-scores y percentiles para peso/edad, talla/edad e IMC/edad.",
    owner: "system",
    auditRequired: true,
    versions: [
      {
        id: "fv-who-growth-2-1",
        formulaId: "formula-who-growth",
        version: "2.1",
        status: "active",
        expressionLabel: "LMS z-score segun edad, sexo y medicion",
        inputSiteIds: ["site-weight", "site-height"],
        outputs: ["z_score", "percentile"],
        applicability: { minAgeYears: 0, maxAgeYears: 19, sex: "any", packs: ["pediatric", "neonatal"], populations: ["children", "adolescents"], contexts: ["growth monitoring"], requiredProtocolIds: ["protocol-pediatric-growth"] },
        source: "WHO Child Growth Standards and Growth Reference.",
        activatedAt: "2026-01-01",
        clinicalNotes: "Requiere edad exacta y seleccion de curva por poblacion.",
      },
    ],
  },
  {
    id: "formula-mifflin",
    name: "Mifflin-St Jeor",
    category: "Requerimiento energetico",
    description: "Estimacion de tasa metabolica basal en adultos.",
    owner: "system",
    auditRequired: true,
    versions: [
      {
        id: "fv-mifflin-1-0",
        formulaId: "formula-mifflin",
        version: "1.0",
        status: "active",
        expressionLabel: "BMR = 10W + 6.25H - 5A + S",
        inputSiteIds: ["site-weight", "site-height"],
        outputs: ["bmr"],
        applicability: { minAgeYears: 18, sex: "any", packs: ["clinical", "endocrine", "wellness", "gineco"], populations: ["adults"], contexts: ["nutrition planning"] },
        source: "Mifflin MD et al. Am J Clin Nutr. 1990.",
        activatedAt: "2026-01-01",
        clinicalNotes: "No reemplaza calorimetria indirecta cuando esta disponible.",
      },
    ],
  },
];

export const SCREENING_TEMPLATES: ScreeningTemplate[] = [
  {
    id: "screening-nrs-2002",
    name: "NRS-2002",
    description: "Tamizaje hospitalario adulto para riesgo nutricional.",
    packIds: ["clinical", "enteral", "onco", "geriatric"],
    context: "hospital",
    version: "1.0",
    scoring: { low: [0, 1], moderate: [2, 2], high: [3, 4], critical: [5, 7] },
    items: [
      { id: "nrs-weight-loss", label: "Perdida de peso involuntaria", type: "single_choice", required: true, options: [{ label: "No", value: "none", score: 0 }, { label: "5% en 3 meses", value: "moderate", score: 1, flag: "weight_loss" }, { label: ">5% en 2 meses", value: "high", score: 2, flag: "weight_loss" }, { label: ">5% en 1 mes", value: "critical", score: 3, flag: "rapid_weight_loss" }] },
      { id: "nrs-intake", label: "Disminucion de ingesta", type: "single_choice", required: true, options: [{ label: "Normal", value: "normal", score: 0 }, { label: "50-75%", value: "mild", score: 1, flag: "low_intake" }, { label: "25-50%", value: "moderate", score: 2, flag: "low_intake" }, { label: "<25%", value: "severe", score: 3, flag: "severe_low_intake" }] },
      { id: "nrs-disease", label: "Severidad de enfermedad", type: "single_choice", required: true, options: [{ label: "Leve", value: "mild", score: 1 }, { label: "Moderada", value: "moderate", score: 2 }, { label: "Severa/UCI", value: "severe", score: 3, flag: "severe_disease" }] },
    ],
    rules: [
      { id: "nrs-critical", label: "Score critico", when: "score >= 5", severity: "critical", recommendation: "Intervencion nutricional intensiva y reevaluación en 48 horas." },
      { id: "nrs-refeeding", label: "Riesgo de realimentacion", when: "rapid_weight_loss && severe_low_intake", severity: "high", recommendation: "Evaluar riesgo de realimentacion antes de incrementar aporte." },
    ],
  },
  {
    id: "screening-mna-sf",
    name: "MNA-SF",
    description: "Mini Nutritional Assessment para geriatria.",
    packIds: ["geriatric", "clinical"],
    context: "geriatric",
    version: "1.0",
    scoring: { low: [12, 14], moderate: [8, 11], high: [4, 7], critical: [0, 3] },
    items: [
      { id: "mna-intake", label: "Disminucion de ingesta en 3 meses", type: "single_choice", required: true, options: [{ label: "Severa", value: "severe", score: 0, flag: "low_intake" }, { label: "Moderada", value: "moderate", score: 1 }, { label: "Sin disminucion", value: "none", score: 2 }] },
      { id: "mna-weight-loss", label: "Perdida de peso", type: "single_choice", required: true, options: [{ label: ">3 kg", value: "high", score: 0, flag: "weight_loss" }, { label: "No sabe", value: "unknown", score: 1, flag: "missing_data" }, { label: "1-3 kg", value: "moderate", score: 2 }, { label: "Sin perdida", value: "none", score: 3 }] },
      { id: "mna-mobility", label: "Movilidad", type: "single_choice", required: true, options: [{ label: "Cama/silla", value: "bed", score: 0, flag: "frailty" }, { label: "Sale de cama", value: "limited", score: 1 }, { label: "Sale al exterior", value: "normal", score: 2 }] },
    ],
    rules: [
      { id: "mna-high-risk", label: "Malnutricion probable", when: "score <= 7", severity: "high", recommendation: "Plan hiperproteico, evaluacion funcional y seguimiento semanal." },
    ],
  },
  {
    id: "screening-stamp",
    name: "STAMP",
    description: "Screening pediatrico hospitalario.",
    packIds: ["pediatric", "neonatal"],
    context: "pediatric",
    version: "1.1",
    scoring: { low: [0, 1], moderate: [2, 3], high: [4, 5], critical: [6, 9] },
    items: [
      { id: "stamp-diagnosis", label: "Diagnostico con implicacion nutricional", type: "single_choice", required: true, options: [{ label: "Sin implicacion", value: "none", score: 0 }, { label: "Posible", value: "possible", score: 2 }, { label: "Definida", value: "defined", score: 3, flag: "disease_risk" }] },
      { id: "stamp-intake", label: "Ingesta reciente", type: "single_choice", required: true, options: [{ label: "Normal", value: "normal", score: 0 }, { label: "Reducida", value: "reduced", score: 2, flag: "low_intake" }, { label: "Nula/minima", value: "minimal", score: 3, flag: "severe_low_intake" }] },
      { id: "stamp-growth", label: "Crecimiento / peso", type: "single_choice", required: true, options: [{ label: "Adecuado", value: "normal", score: 0 }, { label: "Alerta", value: "alert", score: 1, flag: "growth_faltering" }, { label: "Comprometido", value: "compromised", score: 2, flag: "growth_faltering" }] },
    ],
    rules: [
      { id: "stamp-growth-alert", label: "Crecimiento comprometido", when: "growth_faltering", severity: "moderate", recommendation: "Registrar z-scores y programar control de crecimiento." },
    ],
  },
];

export const SCREENING_EXECUTIONS: ScreeningExecution[] = [
  { id: "scr-001", templateId: "screening-nrs-2002", tenantId: "tenant-san-mateo", patientId: "pt-hsm-001", date: "2026-04-22", score: 5, level: "critical", flags: ["weight_loss", "low_intake", "severe_disease"], nextReviewDays: 2, recommendation: "Intervencion nutricional intensiva y reevaluación en 48 horas." },
  { id: "scr-002", templateId: "screening-mna-sf", tenantId: "tenant-san-mateo", patientId: "pt-hsm-005", date: "2026-04-21", score: 6, level: "high", flags: ["sarcopenia_risk", "low_intake", "weight_loss"], nextReviewDays: 7, recommendation: "Plan hiperproteico y evaluacion funcional." },
  { id: "scr-003", templateId: "screening-stamp", tenantId: "tenant-infantia", patientId: "pt-infantia-001", date: "2026-04-22", score: 4, level: "high", flags: ["growth_faltering", "disease_risk"], nextReviewDays: 3, recommendation: "Control antropometrico seriado y plan de recuperacion." },
];

export const CLINICAL_ASSESSMENT_SECTIONS: ClinicalAssessmentSection[] = [
  {
    id: "assessment-intake",
    title: "Historia alimentaria",
    fields: [
      { id: "recall_24h", label: "Recordatorio de 24 horas", type: "textarea", required: true },
      { id: "appetite", label: "Apetito", type: "select", required: true },
      { id: "food_frequency", label: "Frecuencia alimentaria relevante", type: "textarea", required: false },
    ],
  },
  {
    id: "assessment-gi",
    title: "Sintomas gastrointestinales",
    fields: [
      { id: "nausea", label: "Nauseas", type: "boolean", required: false },
      { id: "vomiting", label: "Vomitos", type: "boolean", required: false },
      { id: "swallowing", label: "Deglucion", type: "select", required: false, packIds: ["clinical", "enteral", "geriatric"] },
      { id: "stool_pattern", label: "Evacuacion", type: "text", required: false },
    ],
  },
  {
    id: "assessment-diagnosis",
    title: "Diagnostico nutricional estructurado",
    fields: [
      { id: "problem", label: "Problema nutricional", type: "textarea", required: true },
      { id: "etiology", label: "Etiologia / causa", type: "textarea", required: true },
      { id: "signs_symptoms", label: "Signos y síntomas", type: "textarea", required: true },
      { id: "conduct", label: "Conducta", type: "textarea", required: true },
    ],
  },
];

export const CLINICAL_RULES: ClinicalRule[] = [
  { id: "rule-followup-overdue", name: "Seguimiento vencido", scope: "patient", trigger: "next_follow_up_at < today", action: "create_alert:follow_up", severity: "moderate", enabled: true },
  { id: "rule-enteral-tolerance", name: "Tolerancia enteral baja", scope: "pack", trigger: "enteral.tolerance = poor", action: "create_alert:tolerance", severity: "high", enabled: true },
  { id: "rule-anthro-outlier", name: "Medicion antropometrica atipica", scope: "formula", trigger: "measurement_delta > site.tolerance", action: "require_repetition", severity: "moderate", enabled: true },
  { id: "rule-refeeding", name: "Riesgo de realimentacion", scope: "screening", trigger: "rapid_weight_loss && severe_low_intake", action: "clinical_warning", severity: "high", enabled: true },
];

export function getFormulaVersions() {
  return FORMULA_LIBRARY.flatMap((formula) => formula.versions.map((version) => ({ ...version, formula })));
}

export function getSitesByProtocol(protocolId: string) {
  const protocol = MEASUREMENT_PROTOCOLS.find((item) => item.id === protocolId) ?? MEASUREMENT_PROTOCOLS[0];
  return protocol.siteIds
    .map((siteId) => MEASUREMENT_SITES.find((site) => site.id === siteId))
    .filter((site): site is MeasurementSite => Boolean(site));
}
