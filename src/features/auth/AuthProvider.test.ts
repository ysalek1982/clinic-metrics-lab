import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { buildAuthUser } from "./auth-user";

describe("buildAuthUser", () => {
  it("tolera perfil nulo cuando Supabase ya devolvió sesión", () => {
    const session = {
      user: {
        id: "user-1",
        email: "qa@nutri.test",
        user_metadata: {},
      },
    } as Session;

    expect(buildAuthUser(session, null)).toMatchObject({
      id: "user-1",
      email: "qa@nutri.test",
      name: "qa@nutri.test",
      title: "Usuario autenticado",
      source: "supabase",
    });
  });

  it("usa perfil cuando está disponible", () => {
    const session = {
      user: {
        id: "user-2",
        email: "profile@nutri.test",
        user_metadata: {},
      },
    } as Session;

    expect(buildAuthUser(session, { fullName: "Nutricionista QA", title: "Nutricionista clínico" })).toMatchObject({
      name: "Nutricionista QA",
      initials: "NQ",
      title: "Nutricionista clínico",
    });
  });
});
