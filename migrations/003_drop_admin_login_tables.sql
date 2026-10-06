-- Admin sign-in is handled entirely by Cloudflare Access (email one-time code),
-- so the app no longer keeps its own admin sessions or authenticator-code state.
DROP TABLE IF EXISTS admin_totp;
DROP TABLE IF EXISTS admin_sessions;
