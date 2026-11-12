import { createInternalNeonAuth } from '@neon/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL?.trim();

export const neonAuth = authUrl ? createInternalNeonAuth(authUrl) : null;
export const authClient = neonAuth?.adapter ?? null;

export async function getAuthToken() {
  if (!neonAuth) return null;
  return neonAuth.getJWTToken();
}
