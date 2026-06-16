// Resolve the app's public base URL for building absolute links — the
// verification / password-reset emails, the book QR code, and the Google OAuth
// callback. Priority:
//   1. APP_URL              — explicit override (set this in any host's env)
//   2. RENDER_EXTERNAL_URL  — auto-injected by Render, so deploys need no config
//   3. the incoming request — local dev, or any proxy that forwards the Host header
const stripTrailingSlash = (url) => url.replace(/\/+$/, '')

const getBaseUrl = (req) => {
  if (process.env.APP_URL) return stripTrailingSlash(process.env.APP_URL)
  if (process.env.RENDER_EXTERNAL_URL) return stripTrailingSlash(process.env.RENDER_EXTERNAL_URL)
  if (req) return `${req.protocol}://${req.get('host')}`
  return ''
}

module.exports = { getBaseUrl }
