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
    // The signature check against this team's keys proves who issued the token; the issuer is
    // compared loosely because its spelling (scheme, trailing slash, case) can vary.
    const { payload } = await jwtVerify(token, jwksByTeam.get(team), { audience: aud });
    const iss = String(payload.iss || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const expected = (env.ACCESS_ISSUER || team).toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (iss !== expected) {
      return { ok: false, status: 403, error: `Invalid Cloudflare Access token (issuer "${payload.iss}", expected "https://${expected}")` };
    }
    return { ok: true, email: payload.email };
  } catch (e) {
    // Show which check failed (e.g. "aud" or "iss" mismatch); no secrets are included.
    const reason = e.claim ? `${e.claim} mismatch` : (e.code || e.message);
    console.error('Access JWT rejected:', e.code, e.claim, e.message);
    return { ok: false, status: 403, error: `Invalid Cloudflare Access token (${reason})` };
  }
}
