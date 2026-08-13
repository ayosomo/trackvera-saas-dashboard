function normaliseBaseUrl(value: string | undefined): string {
  return value?.trim().replace(/\/$/, "") ?? "";
}

const unsafeClientVariablePattern =
  /(^|_)(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)($|_)/i;

export function findUnsafeClientVariables(
  values: Record<string, unknown>,
): string[] {
  return Object.keys(values).filter(
    (key) => key.startsWith("VITE_") && unsafeClientVariablePattern.test(key),
  );
}

const unsafeClientVariables = findUnsafeClientVariables(import.meta.env);
if (unsafeClientVariables.length > 0) {
  throw new Error(
    `Remove sensitive client environment variables: ${unsafeClientVariables.join(", ")}`,
  );
}

export const environment = {
  apiBaseUrl: normaliseBaseUrl(import.meta.env.VITE_API_URL),
  isDemoMode: !import.meta.env.VITE_API_URL?.trim(),
} as const;
