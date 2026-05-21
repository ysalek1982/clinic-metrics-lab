import type { Json } from "@/integrations/supabase/types";
import type { RiskLevel, ScreeningTemplate } from "@/types/clinical";

export type ScreeningAnswerDraft = Record<string, string | boolean | number | string[] | null | undefined>;

export interface CalculatedScreeningAnswer {
  itemId: string;
  answerValue: Json;
  score: number;
  flags: string[];
}

export interface CalculatedScreeningResult {
  score: number;
  riskLevel: RiskLevel;
  flags: string[];
  recommendation: string;
  nextReviewDays: number;
  answers: CalculatedScreeningAnswer[];
}

function riskFromScore(template: ScreeningTemplate, score: number): RiskLevel {
  const entries = Object.entries(template.scoring ?? {}) as Array<[RiskLevel, [number, number]]>;
  return entries.find(([, [min, max]]) => score >= min && score <= max)?.[0] ?? "low";
}

function ruleMatches(ruleWhen: string, score: number, flags: string[]) {
  const normalized = ruleWhen.trim();
  const scoreMatch = normalized.match(/^score\s*(>=|<=|>|<|=)\s*(\d+(?:\.\d+)?)$/);
  if (scoreMatch) {
    const [, operator, rawValue] = scoreMatch;
    const value = Number(rawValue);
    if (operator === ">=") return score >= value;
    if (operator === "<=") return score <= value;
    if (operator === ">") return score > value;
    if (operator === "<") return score < value;
    return score === value;
  }

  if (normalized.includes("&&")) {
    return normalized.split("&&").map((part) => part.trim()).every((flag) => flags.includes(flag));
  }

  return flags.includes(normalized);
}

export function calculateScreeningFromAnswers(template: ScreeningTemplate, draft: ScreeningAnswerDraft): CalculatedScreeningResult {
  const answers: CalculatedScreeningAnswer[] = (template.items ?? []).map((item) => {
    const value = draft[item.id];
    const options = item.options ?? [];
    if (item.type === "single_choice") {
      const option = options.find((candidate) => candidate.value === value);
      return {
        itemId: item.id,
        answerValue: { value: option?.value ?? null, label: option?.label ?? null },
        score: option?.score ?? 0,
        flags: option?.flag ? [option.flag] : [],
      };
    }

    if (item.type === "multi_choice") {
      const values = Array.isArray(value) ? value : [];
      const selected = options.filter((candidate) => values.includes(candidate.value)) ?? [];
      return {
        itemId: item.id,
        answerValue: { values },
        score: selected.reduce((total, option) => total + option.score, 0),
        flags: selected.map((option) => option.flag).filter((flag): flag is string => Boolean(flag)),
      };
    }

    if (item.type === "boolean") {
      const boolValue = Boolean(value);
      const option = options.find((candidate) => candidate.value === String(boolValue));
      return {
        itemId: item.id,
        answerValue: { value: boolValue },
        score: option?.score ?? (boolValue ? 1 : 0),
        flags: option?.flag ? [option.flag] : [],
      };
    }

    const numeric = Number(value);
    return {
      itemId: item.id,
      answerValue: { value: Number.isFinite(numeric) ? numeric : null, unit: item.unit ?? null },
      score: Number.isFinite(numeric) ? numeric : 0,
      flags: [],
    };
  });

  const score = answers.reduce((total, answer) => total + answer.score, 0);
  const flags = [...new Set(answers.flatMap((answer) => answer.flags))];
  const riskLevel = riskFromScore(template, score);
  const matchedRule = (template.rules ?? []).find((rule) => ruleMatches(rule.when, score, flags));
  const nextReviewDays = riskLevel === "critical" ? 2 : riskLevel === "high" ? 3 : riskLevel === "moderate" ? 7 : 30;

  return {
    score,
    riskLevel,
    flags,
    recommendation: matchedRule?.recommendation ?? `Riesgo ${riskLevel}. Programar reevaluación en ${nextReviewDays} días.`,
    nextReviewDays,
    answers,
  };
}
