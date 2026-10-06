// Cloudflare Access (Zero Trust) check for admin routes.
// After the email one-time PIN login, Cloudflare adds a signed JWT to every request
// (Cf-Access-Jwt-Assertion header). We verify its signature, issuer and audience, so a request
// that did not pass the Access login is rejected even if it reaches the Worker another way.
import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwksByTeam = new Map();

export async function verifyAccess(request, env) {
  // Local development has no Cloudflare in front. The bypass only works on localhost, never on the real domain.
  const host = new URL(request.url).hostname;
  if (env.DEV_SKIP_ACCESS === 'true' && (host === 'localhost' || host === '127.0.0.1')) return { ok: true, email: 'local-dev' };

  const team = (env.ACCESS_TEAM_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const aud = env.ACCESS_AUD;
  if (!team || !aud) return { ok: false, status: 503, error: 'Admin is locked: Cloudflare Access is not configured' };

  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return { ok: false, status: 403, error: 'Cloudflare Access login required' };

  if (!jwksByTeam.has(team)) jwksByTeam.set(team, createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`)));
  try {
    const { payload } = await jwtVerify(token, jwksByTeam.get(team), { issuer: `https://${team}`, audience: aud });
    return { ok: true, email: payload.email };
  } catch {
    return { ok: false, status: 403, error: 'Invalid Cloudflare Access token' };
  }
}
