import { describe, expect, it } from "vitest";
import { presentPermission, presentRole, presentSeverity, presentStatus, presentUpperStatus, statusTone } from "./presentation";

describe("presentation helpers", () => {
  it("traduce estados conocidos y conserva fallback seguro", () => {
    expect(presentStatus("active")).toBe("Activo");
    expect(presentStatus("out_of_range")).toBe("Fuera de rango");
    expect(presentStatus("custom_state")).toBe("custom state");
    expect(presentStatus(null)).toBe("--");
    expect(presentUpperStatus("paused")).toBe("PAUSADO");
  });

  it("presenta roles y permisos en espanol", () => {
    expect(presentRole("clinical_nutritionist")).toBe("Nutricionista clinico");
    expect(presentRole("platform_superadmin")).toBe("Superadministrador plataforma");
    expect(presentPermission("reports.generate")).toBe("Generar reportes");
    expect(presentPermission("custom.permission")).toBe("custom · permission");
  });

  it("usa fallbacks seguros para roles, permisos y severidades desconocidas", () => {
    expect(presentRole(undefined)).toBe("Rol no registrado");
    expect(presentPermission(null)).toBe("Permiso no registrado");
    expect(presentSeverity("unknown_status")).toBe("unknown status");
    expect(statusTone("unknown_status")).toBe("default");
    expect(presentStatus("estado_\u00fanico")).toBe("estado \u00fanico");
  });

  it("resuelve severidades y tonos sin mojibake", () => {
    const labels = [presentSeverity("critical"), presentStatus("admission"), presentPermission("enteral.log")];

    expect(statusTone("critical")).toBe("red");
    expect(statusTone("resolved")).toBe("green");
    expect(statusTone(undefined)).toBe("muted");
    expect(labels.join(" ")).not.toMatch(new RegExp("[\\u00c3\\u00c2\\ufffd]"));
  });
});
