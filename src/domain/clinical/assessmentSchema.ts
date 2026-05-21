import type { ClinicalAssessmentSection } from "@/types/clinical";

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
