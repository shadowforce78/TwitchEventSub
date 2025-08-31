function getRedirectUri() {
  return process.env.NGROK_REDIRECT_URI || process.env.TWITCH_REDIRECT_URI;
}

function getPublicBaseUrl() {
  // Try to infer from NGROK_REDIRECT_URI, else fallback to http://localhost:PORT
  const ngrok = process.env.NGROK_REDIRECT_URI;
  if (ngrok) {
    try {
      const u = new URL(ngrok);
      return `${u.protocol}//${u.host}`;
    } catch (_e) {}
  }
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

function getEventSubSecret() {
  return process.env.EVENTSUB_SECRET || process.env.SESSION_SECRET || 'change-me-secret';
}

function getEventSubCallbackUrl() {
  return `${getPublicBaseUrl()}/eventsub/webhook`;
}

module.exports = {
  getRedirectUri,
  getPublicBaseUrl,
  getEventSubSecret,
  getEventSubCallbackUrl,
};
