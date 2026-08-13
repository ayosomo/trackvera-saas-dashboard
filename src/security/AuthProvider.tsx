import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getIdentity,
  hasPermission,
  mockIdentities,
  type MockIdentity,
} from "./permissions";
import {
  AuthContext,
  type AuthenticationState,
  type AuthenticationStatus,
  type AuthContextValue,
} from "./AuthContext";

const SESSION_STORAGE_KEY = "flowops-mock-auth-session";
const SESSION_DURATION_MS = 30 * 60 * 1000;
const defaultIdentity = mockIdentities.find(
  (identity) => identity.role === "operations-manager",
)!;

interface StoredSession {
  status: AuthenticationStatus;
  identityId: string | null;
  expiresAt: number | null;
}

function createAuthenticatedState(identity: MockIdentity): AuthenticationState {
  return {
    status: "authenticated",
    user: identity,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
}

function readInitialState(): AuthenticationState {
  try {
    const storedValue = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedValue) return createAuthenticatedState(defaultIdentity);

    const stored = JSON.parse(storedValue) as StoredSession;
    const user = stored.identityId ? getIdentity(stored.identityId) : null;

    if (
      stored.status === "authenticated" &&
      user &&
      stored.expiresAt &&
      stored.expiresAt > Date.now()
    ) {
      return { status: "authenticated", user, expiresAt: stored.expiresAt };
    }

    if (stored.status === "expired" || (user && stored.expiresAt)) {
      return { status: "expired", user, expiresAt: stored.expiresAt };
    }

    return { status: "unauthenticated", user: null, expiresAt: null };
  } catch {
    return createAuthenticatedState(defaultIdentity);
  }
}

function storeState(state: AuthenticationState): void {
  const stored: StoredSession = {
    status: state.status,
    identityId: state.user?.id ?? null,
    expiresAt: state.expiresAt,
  };
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthenticationState>(readInitialState);

  const updateSession = useCallback(
    (nextState: AuthenticationState) => {
      queryClient.clear();
      storeState(nextState);
      setState(nextState);
    },
    [queryClient],
  );

  const signIn = useCallback(
    (identityId: string) => {
      const identity = getIdentity(identityId);
      if (!identity) return;
      updateSession(createAuthenticatedState(identity));
    },
    [updateSession],
  );

  const signOut = useCallback(() => {
    updateSession({ status: "unauthenticated", user: null, expiresAt: null });
  }, [updateSession]);

  const expireSession = useCallback(() => {
    updateSession({
      status: "expired",
      user: state.user,
      expiresAt: state.expiresAt ?? Date.now(),
    });
  }, [state.expiresAt, state.user, updateSession]);

  useEffect(() => {
    if (state.status !== "authenticated" || !state.expiresAt) return;

    const remainingTime = state.expiresAt - Date.now();
    if (remainingTime <= 0) {
      expireSession();
      return;
    }

    const timer = window.setTimeout(expireSession, remainingTime);
    return () => window.clearTimeout(timer);
  }, [expireSession, state.expiresAt, state.status]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      can: (permission) => hasPermission(state.user, permission),
      signIn,
      switchIdentity: signIn,
      signOut,
      expireSession,
    }),
    [expireSession, signIn, signOut, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
