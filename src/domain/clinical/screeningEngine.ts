import type { RiskLevel } from "@/types/domain";
import type { ScreeningTemplate } from "@/types/clinical";

export type ScreeningAnswers = Record<string, string | string[] | number | boolean | null | undefined>;

export interface ScreeningScoreResult {
  score: number;
  level: RiskLevel;
  flags: string[];
  recommendation: string;
  triggeredRuleIds: string[];
}

export function scoreScreening(template: ScreeningTemplate, answers: ScreeningAnswers): ScreeningScoreResult {
  let score = 0;
  const flags = new Set<string>();

  template.items.forEach((item) => {
    const answer = answers[item.id];

    if (item.type === "single_choice") {
      const selected = item.options.find((option) => option.value === answer);
      score += selected.score ?? 0;
      if (selected.flag) flags.add(selected.flag);
    }

    if (item.type === "multi_choice" && Array.isArray(answer)) {
      item.options
        .filter((option) => answer.includes(option.value))
        .forEach((option) => {
          score += option.score;
          if (option.flag) flags.add(option.flag);
        });
    }

    if (item.type === "numeric" && typeof answer === "number") {
      score += answer;
    }

    if (item.type === "boolean" && answer === true) {
      const positive = item.options.find((option) => option.value === "true");
      score += positive.score ?? 1;
      if (positive.flag) flags.add(positive.flag);
    }
  });

  const level = riskLevelFromScore(template, score);
  const triggeredRules = template.rules.filter((rule) => ruleMatches(rule.when, score, flags));
  const highestRule = triggeredRules.sort((a, b) => riskWeight(b.severity) - riskWeight(a.severity))[0];

  return {
    score,
    level: highestRule && riskWeight(highestRule.severity) > riskWeight(level) ? highestRule.severity : level,
    flags: Array.from(flags),
    recommendation: highestRule.recommendation ?? defaultRecommendation(level),
    triggeredRuleIds: triggeredRules.map((rule) => rule.id),
  };
}

export function riskLevelFromScore(template: ScreeningTemplate, score: number): RiskLevel {
  const entries = Object.entries(template.scoring) as [RiskLevel, [number, number]][];
  return entries.find(([, range]) => score >= range[0] && score <= range[1])?.[0] ?? "low";
}

function ruleMatches(expression: string, score: number, flags: Set<string>) {
  const normalized = expression.replace(/\s+/g, " ").trim();

  if (/score\s*>=\s*\d+/.test(normalized)) {
    const threshold = Number(normalized.match(/\d+/)?.[0] ?? 0);
    return score >= threshold;
  }

  if (/score\s*<=\s*\d+/.test(normalized)) {
    const threshold = Number(normalized.match(/\d+/)?.[0] ?? 0);
    return score <= threshold;
  }

  if (normalized.includes("&&")) {
    return normalized.split("&&").every((token) => flags.has(token.trim()));
  }

  return flags.has(normalized);
}

function defaultRecommendation(level: RiskLevel) {
  switch (level) {
    case "critical":
      return "Intervencion inmediata y reevaluación en 48 horas.";
    case "high":
      return "Plan nutricional prioritario y seguimiento semanal.";
    case "moderate":
      return "Seguimiento programado y completar datos faltantes.";
    default:
      return "Continuar seguimiento habitual.";
  }
}

function riskWeight(level: RiskLevel) {
  return { low: 1, moderate: 2, high: 3, critical: 4 }[level];
}
