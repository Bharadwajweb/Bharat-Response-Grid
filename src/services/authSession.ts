import { authClient } from './neonAuth';
import { recordAuthEvent } from './brgApi';

export async function endAuthSession() {
  await recordAuthEvent('logout');
  if (!authClient) return;
  await authClient.signOut();
}
