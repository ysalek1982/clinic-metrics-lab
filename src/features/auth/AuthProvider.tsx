import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app";
import { getIdentityContext, type IdentityMembership } from "@/services/identityService";
import { AuthContext, type AuthContextValue, type AuthUser } from "./auth-context";
import { buildAuthUser } from "./auth-user";

const AUTH_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const selectedTenantId = useAppStore((state) => state.activeTenantId);
  const setActiveTenant = useAppStore((state) => state.setActiveTenant);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [memberships, setMemberships] = useState<IdentityMembership[]>([]);
  const [activationRequired, setActivationRequired] = useState(false);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ fullName: string; title: string | null } | null>(null);

  const getFallbackSession = useCallback(async () => {
    if (!supabase) return null;
    const {
      data: { session: fallbackSession },
    } = await supabase.auth.getSession();
    return fallbackSession;
  }, []);

  const runWithTimeout = useCallback(async <T,>(task: () => Promise<T>, onTimeout: () => Promise<T> | T) => {
    let timeoutId: number | undefined;

    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutId = window.setTimeout(async () => {
        resolve(await onTimeout());
      }, AUTH_TIMEOUT_MS);
    });

    try {
      return await Promise.race([task(), timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    }
  }, []);

  const applyIdentityState = useCallback(
    (nextSession: Session | null, identity: Awaited<ReturnType<typeof getIdentityContext>> | null) => {
      const storedTenantId = useAppStore.getState().activeTenantId;
      const membershipTenantIds = new Set(identity?.memberships.map((membership) => membership.tenantId) ?? []);
      const nextActiveTenantId =
        identity?.activeTenantId ?? (storedTenantId && membershipTenantIds.has(storedTenantId) ? storedTenantId : null);

      setSession(nextSession);
      setMemberships(identity?.memberships ?? []);
      setActivationRequired(identity?.activationRequired ?? false);
      setActiveTenantId(nextActiveTenantId);
      setActiveTenant(nextSession?.user ? nextActiveTenantId : null);
      setProfile(
        identity?.profile
          ? {
              fullName: identity.profile.fullName,
              title: identity.profile.title,
            }
          : null,
      );
    },
    [setActiveTenant],
  );

  const syncIdentityForSession = useCallback(
    async (nextSession: Session | null) => {
      const outcome = await runWithTimeout(
        async () => {
          try {
            const identity = await getIdentityContext();
            return { session: nextSession, identity };
          } catch {
            return { session: nextSession, identity: null };
          }
        },
        async () => ({ session: await getFallbackSession(), identity: null }),
      );

      applyIdentityState(outcome.session, outcome.identity);
      await queryClient.invalidateQueries({ queryKey: ["identity-context"] });
      setLoading(false);
    },
    [applyIdentityState, getFallbackSession, queryClient, runWithTimeout],
  );

  const refreshSession = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);

    try {
      const outcome = await runWithTimeout(
        async () => {
          const [{ data: sessionData }, identity] = await Promise.all([
            supabase.auth.getSession(),
            getIdentityContext(),
          ]);

          return { session: sessionData.session, identity };
        },
        async () => ({ session: await getFallbackSession(), identity: null }),
      );

      applyIdentityState(outcome.session, outcome.identity);
    } catch {
      applyIdentityState(await getFallbackSession(), null);
    } finally {
      setLoading(false);
    }
  }, [applyIdentityState, getFallbackSession, runWithTimeout]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        const outcome = await runWithTimeout(
          async () => {
            const [{ data: sessionData }, identity] = await Promise.all([
              supabase.auth.getSession(),
              getIdentityContext(),
            ]);

            return { session: sessionData.session, identity };
          },
          async () => ({ session: await getFallbackSession(), identity: null }),
        );

        if (!mounted) return;
        applyIdentityState(outcome.session, outcome.identity);
      } catch {
        if (!mounted) return;
        applyIdentityState(await getFallbackSession(), null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      window.setTimeout(() => {
        void syncIdentityForSession(nextSession);
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applyIdentityState, getFallbackSession, queryClient, runWithTimeout, syncIdentityForSession]);

  const user = useMemo<AuthUser | null>(() => buildAuthUser(session, profile), [profile, session]);
  const effectiveActiveTenantId = useMemo(() => {
    if (!session?.user) return null;
    if (activeTenantId) return activeTenantId;
    return selectedTenantId && memberships.some((membership) => membership.tenantId === selectedTenantId) ? selectedTenantId : null;
  }, [activeTenantId, memberships, selectedTenantId, session?.user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(session?.user),
      activationRequired,
      memberships,
      activeTenantId: effectiveActiveTenantId,
      async signInWithPassword(email, password) {
        if (!supabase) {
          return { error: "Supabase no está configurado para autenticación real." };
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          await syncIdentityForSession(data.session ?? null);
        } else {
          setLoading(false);
        }
        return error ? { error: error.message } : {};
      },
      async signUpWithPassword(email, password, metadata) {
        if (!supabase) {
          return { error: "Supabase no está configurado para autenticación real." };
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        });

        if (error) {
          return { error: error.message };
        }

        await refreshSession();
        return { needsEmailConfirmation: !data.session };
      },
      refreshSession,
      async signOut() {
        if (supabase) {
          await supabase.auth.signOut();
        }
        setSession(null);
        setMemberships([]);
        setActivationRequired(false);
        setActiveTenantId(null);
        setActiveTenant(null);
        setProfile(null);
      },
    }),
    [activationRequired, effectiveActiveTenantId, loading, memberships, refreshSession, session, setActiveTenant, syncIdentityForSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
