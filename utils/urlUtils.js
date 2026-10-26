/**
 * URL normalization and validation utilities for news ingestion.
 * Handles tracking-parameter stripping and SSRF protection.
 */

// Tracking parameters that should be removed during normalization
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid',
  'mc_cid', 'mc_eid', 'ref', 'referer', 'referrer',
  '_ga', '_gl', '_hsenc', '_hsmi', '__hstc', '__hsfp',
  'oly_enc_id', 'oly_anon_id', 'vero_id',
  'wickedid', 'nb_klid', 'twclid', 'ttclid',
  'igshid', 'si', 's', 'share',
]);

// Blocked IP ranges for SSRF protection
const BLOCKED_HOSTS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /^169\.254\.\d+\.\d+$/,
  /^\.internal$/i,
  /\.local$/i,
];

/**
 * Normalize a URL by removing tracking parameters while preserving meaningful ones.
 * @param {string} rawUrl - The URL to normalize
 * @returns {string} Normalized URL, or empty string if invalid
 */
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  try {
    const url = new URL(rawUrl.trim());

    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) return '';

    // Remove tracking parameters
    const paramsToDelete = [];
    for (const key of url.searchParams.keys()) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        paramsToDelete.push(key);
      }
    }
    for (const key of paramsToDelete) {
      url.searchParams.delete(key);
    }

    // Sort remaining params for consistent dedup
    url.searchParams.sort();

    // Remove trailing slash from pathname (unless it's just "/")
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }

    // Remove default ports
    if (
      (url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')
    ) {
      url.port = '';
    }

    // Remove fragment
    url.hash = '';

    // Lowercase the hostname
    url.hostname = url.hostname.toLowerCase();

    return url.toString();
  } catch {
    return '';
  }
}

/**
 * Validate a URL is safe to fetch (SSRF protection).
 * @param {string} rawUrl - The URL to validate
 * @param {string[]} allowedHosts - List of allowed hostnames (if empty, all public hosts allowed)
 * @returns {{ valid: boolean, reason?: string }} Validation result
 */
function validateFetchUrl(rawUrl, allowedHosts = []) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'Empty or invalid URL' };
  }

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { valid: false, reason: 'Malformed URL' };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, reason: `Disallowed protocol: ${url.protocol}` };
  }

  const hostname = url.hostname.toLowerCase();

  // Check blocked hosts (private IPs, localhost, etc.)
  for (const pattern of BLOCKED_HOSTS) {
    if (pattern.test(hostname)) {
      return { valid: false, reason: `Blocked host: ${hostname}` };
    }
  }

  // If allowedHosts are specified, enforce them
  if (allowedHosts.length > 0) {
    const isAllowed = allowedHosts.some((allowed) => {
      const normalizedAllowed = allowed.toLowerCase().trim();
      return hostname === normalizedAllowed || hostname.endsWith(`.${normalizedAllowed}`);
    });

    if (!isAllowed) {
      return { valid: false, reason: `Host ${hostname} is not in the allowed hosts list` };
    }
  }

  return { valid: true };
}

/**
 * Extract the hostname from a URL for use as allowedHost.
 * @param {string} rawUrl - The URL to extract hostname from
 * @returns {string} The hostname, or empty string if invalid
 */
function extractHostname(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    return new URL(rawUrl.trim()).hostname.toLowerCase();
  } catch {
    return '';
  }
}

module.exports = {
  normalizeUrl,
  validateFetchUrl,
  extractHostname,
};
