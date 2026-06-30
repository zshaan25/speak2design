import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Config ───────────────────────────────────────────────────────────────────
// IMPORTANT: read process.env inside a function, NOT at module load time.
// In ESM, this file is evaluated before dotenv.config() runs in server.js,
// so top-level constants that read process.env will see undefined.
// Using getter functions ensures env vars are read on every request, after
// dotenv has already populated process.env.
const getBackendUrl  = () => process.env.BACKEND_URL  || 'http://speak2design-env.eba-kdpjyapi.ap-south-1.elasticbeanstalk.com';
const getFrontendUrl = () => process.env.FRONTEND_URL || 'https://d1khpu1t6zzts5.cloudfront.net';

const getProviders = () => ({
  google: {
    id:      process.env.GOOGLE_CLIENT_ID,
    secret:  process.env.GOOGLE_CLIENT_SECRET,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl:'https://oauth2.googleapis.com/token',
    scope:   'openid email profile'
  },
  github: {
    id:      process.env.GITHUB_CLIENT_ID,
    secret:  process.env.GITHUB_CLIENT_SECRET,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl:'https://github.com/login/oauth/access_token',
    scope:   'read:user user:email'
  }
});

const callbackUrl = (provider) => `${getBackendUrl()}/api/auth/oauth/${provider}/callback`;
const isConfigured = (p) => {
  const cfg = getProviders()[p];
  return !!(cfg?.id && cfg?.secret &&
    !String(cfg.id).includes('PASTE_') && !String(cfg.id).includes('YOUR_'));
};
const signToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
const frontendRedirect = (res, params) =>
  res.redirect(`${getFrontendUrl()}/?${new URLSearchParams(params).toString()}`);

// ─── Step 1: redirect user to the provider's consent screen ───────────────────
export const oauthRedirect = (req, res) => {
  const provider = req.params.provider;
  const cfg = getProviders()[provider];
  if (!cfg) return res.status(404).json({ success: false, message: 'Unknown OAuth provider.' });
  if (!isConfigured(provider)) {
    return frontendRedirect(res, { oauth_error: 'not_configured', provider });
  }
  const params = new URLSearchParams({
    client_id: cfg.id,
    redirect_uri: callbackUrl(provider),
    scope: cfg.scope,
    response_type: 'code',
    ...(provider === 'google' ? { access_type: 'online', prompt: 'select_account' } : {})
  });
  return res.redirect(`${cfg.authUrl}?${params.toString()}`);
};

// ─── Provider profile fetchers ────────────────────────────────────────────────
const exchangeCode = async (provider, code) => {
  const cfg = getProviders()[provider];
  const body = {
    client_id: cfg.id,
    client_secret: cfg.secret,
    code,
    redirect_uri: callbackUrl(provider),
    grant_type: 'authorization_code'
  };
  const resp = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('No access token from provider.');
  return data.access_token;
};

const fetchGoogleProfile = async (accessToken) => {
  const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const u = await r.json();
  return { providerId: u.id, email: u.email, name: u.name || u.email, avatarUrl: u.picture || '' };
};

const fetchGithubProfile = async (accessToken) => {
  const headers = { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Speak2Design', Accept: 'application/json' };
  const u = await (await fetch('https://api.github.com/user', { headers })).json();
  let email = u.email;
  if (!email) {
    const emails = await (await fetch('https://api.github.com/user/emails', { headers })).json();
    const primary = Array.isArray(emails) ? emails.find(e => e.primary && e.verified) || emails[0] : null;
    email = primary?.email || `${u.login}@users.noreply.github.com`;
  }
  return { providerId: String(u.id), email, name: u.name || u.login, avatarUrl: u.avatar_url || '' };
};

// ─── Step 2: provider redirects back here with a code ─────────────────────────
export const oauthCallback = async (req, res) => {
  const provider = req.params.provider;
  try {
    if (!getProviders()[provider]) return frontendRedirect(res, { oauth_error: 'unknown_provider' });
    if (!isConfigured(provider)) return frontendRedirect(res, { oauth_error: 'not_configured', provider });
    if (req.query.error || !req.query.code) {
      return frontendRedirect(res, { oauth_error: 'access_denied', provider });
    }

    const accessToken = await exchangeCode(provider, req.query.code);
    const profile = provider === 'google'
      ? await fetchGoogleProfile(accessToken)
      : await fetchGithubProfile(accessToken);

    if (!profile.email) return frontendRedirect(res, { oauth_error: 'no_email', provider });

    const idField = provider === 'google' ? 'googleId' : 'githubId';
    const email = profile.email.toLowerCase().trim();

    // Link by provider id first, then by existing email account.
    let user = await User.findOne({ [idField]: profile.providerId });
    if (!user) user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: profile.name,
        email,
        [idField]: profile.providerId,
        authProvider: provider,
        avatarUrl: profile.avatarUrl,
        tier: 'free',
        usageCount: 0
      });
    } else {
      // Link the provider to the existing account.
      if (!user[idField]) user[idField] = profile.providerId;
      if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
      if (user.authProvider === 'local' && !user.password) user.authProvider = provider;
      await user.save();
    }

    const token = signToken(user._id);
    return frontendRedirect(res, { token, oauth: 'success' });
  } catch (err) {
    console.error(`>>> OAuth (${provider}) callback error:`, err.message);
    return frontendRedirect(res, { oauth_error: 'oauth_failed', provider });
  }
};
