import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { IdentityMembership } from "@/services/identityService";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  title: string;
  source: "supabase" | "demo";
}

export interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  activationRequired: boolean;
  memberships: IdentityMembership[];
  activeTenantId: string | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string }>;
  signUpWithPassword: (email: string, password: string, metadata: { full_name: string; name: string }) => Promise<{ error: string; needsEmailConfirmation: boolean }>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
