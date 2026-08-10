function normaliseBaseUrl(value: string | undefined): string {
  return value?.trim().replace(/\/$/, "") ?? "";
}

export const environment = {
  apiBaseUrl: normaliseBaseUrl(import.meta.env.VITE_API_URL),
  isDemoMode: !import.meta.env.VITE_API_URL?.trim(),
} as const;
