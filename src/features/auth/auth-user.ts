import type { Session } from "@supabase/supabase-js";
import type { AuthUser } from "./auth-context";

export function buildAuthUser(session: Session | null, profile: { fullName: string; title: string | null } | null): AuthUser | null {
  if (!session?.user) return null;

  const fullName =
    profile?.fullName ??
    session.user.user_metadata.full_name ??
    session.user.user_metadata.name ??
    session.user.email ??
    "Usuario";

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: fullName,
    initials: fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    title: profile?.title ?? "Usuario autenticado",
    source: "supabase",
  };
}
