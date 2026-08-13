import { createContext, useContext } from "react";
import type { MockIdentity, Permission } from "./permissions";

export type AuthenticationStatus =
  | "authenticated"
  | "unauthenticated"
  | "expired";

export interface AuthenticationState {
  status: AuthenticationStatus;
  user: MockIdentity | null;
  expiresAt: number | null;
}

export interface AuthContextValue extends AuthenticationState {
  can: (permission: Permission) => boolean;
  signIn: (identityId: string) => void;
  switchIdentity: (identityId: string) => void;
  signOut: () => void;
  expireSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
