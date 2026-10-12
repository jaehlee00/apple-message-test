export const CHART_PATH = '/chart/msft-fy2025';
export const IMAGE_PATH = '/assets/revenue-preview.png';
export const TITLE = 'Microsoft FY2025 revenue';
export const DESCRIPTION = 'Quarterly revenue in USD billions. Fiscal data; all quarters marked restated and Q4 marked calculated. Open for exact values, dates, and sources.';

export function validatePublicOrigin(value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new TypeError('PUBLIC_BASE_URL must be an HTTPS origin, without credentials, path, query, or fragment.');
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname === '127.0.0.1' || url.hostname === '[::1]') {
    throw new TypeError('PUBLIC_BASE_URL must be a deployed HTTPS origin.');
  }
  return url.origin;
}

// Application-owned content. This is deliberately NOT a Twilio wire payload.
export function buildRichLink(publicOrigin) {
  const origin = validatePublicOrigin(publicOrigin);
  return {
    title: TITLE,
    description: DESCRIPTION,
    url: origin ? origin + CHART_PATH : null,
    imageUrl: origin ? origin + IMAGE_PATH : null,
    sourceTableUrl: origin ? origin + '/sources' : null,
    imageMimeType: 'image/png',
    imageAlt: 'Microsoft quarterly revenue: Q1 65.585, Q2 69.632, Q3 70.066, Q4 76.441 billion USD. Fiscal; all restated, Q4 calculated.',
    kind: 'chart-rich-link'
  };
}

export function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

export function openGraphHead(publicOrigin) {
  const link = buildRichLink(publicOrigin);
  const tags = [
    ['og:type', 'website'], ['og:title', TITLE], ['og:description', DESCRIPTION]
  ];
  if (link.url) tags.push(['og:url', link.url]);
  if (link.imageUrl) tags.push(['og:image', link.imageUrl], ['og:image:type', 'image/png'], ['og:image:width', '1200'], ['og:image:height', '630'], ['og:image:alt', link.imageAlt]);
  return tags.map(([key, value]) => `<meta property="${key}" content="${htmlEscape(value)}">`).join('\n');
}
