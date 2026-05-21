import { describe, expect, it } from "vitest";
import { SCREENING_TEMPLATES } from "@/data/clinical";
import { scoreScreening } from "./screeningEngine";

describe("screeningEngine", () => {
  it("scores NRS-2002 and triggers critical rule", () => {
    const nrs = SCREENING_TEMPLATES.find((template) => template.id === "screening-nrs-2002")!;
    const result = scoreScreening(nrs, {
      "nrs-weight-loss": "critical",
      "nrs-intake": "severe",
      "nrs-disease": "severe",
    });

    expect(result.score).toBe(9);
    expect(result.level).toBe("critical");
    expect(result.flags).toContain("rapid_weight_loss");
    expect(result.flags).toContain("severe_low_intake");
    expect(result.triggeredRuleIds).toContain("nrs-critical");
    expect(result.triggeredRuleIds).toContain("nrs-refeeding");
  });

  it("scores STAMP pediatric screening", () => {
    const stamp = SCREENING_TEMPLATES.find((template) => template.id === "screening-stamp")!;
    const result = scoreScreening(stamp, {
      "stamp-diagnosis": "defined",
      "stamp-intake": "reduced",
      "stamp-growth": "alert",
    });

    expect(result.score).toBe(6);
    expect(result.level).toBe("critical");
    expect(result.flags).toContain("growth_faltering");
  });
});
