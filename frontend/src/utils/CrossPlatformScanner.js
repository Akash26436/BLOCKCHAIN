/**
 * CrossPlatformScanner.js
 * Fetches media from social platform URLs (Instagram, Twitter/X, Facebook, Reddit, etc.)
 * using CORS-safe proxies and Open Graph metadata extraction.
 * No API keys required — works entirely client-side.
 */

// ─── Platform Detection ────────────────────────────────────────────────────────

const PLATFORMS = {
  twitter: {
    name: 'Twitter / X',
    icon: '🐦',
    color: '#1d9bf0',
    patterns: [/twitter\.com/, /x\.com/],
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: '#e1306c',
    gradient: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    patterns: [/instagram\.com/],
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    patterns: [/facebook\.com/, /fb\.com/],
  },
  reddit: {
    name: 'Reddit',
    icon: '🤖',
    color: '#ff4500',
    patterns: [/reddit\.com/, /redd\.it/],
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: '#ff0000',
    patterns: [/youtube\.com/, /youtu\.be/],
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: '#69c9d0',
    patterns: [/tiktok\.com/],
  },
  direct: {
    name: 'Direct Image',
    icon: '🖼️',
    color: '#a855f7',
    patterns: [],
  },
};

/**
 * Detect which platform a URL belongs to.
 * @param {string} url
 * @returns {{ key: string, platform: object }}
 */
export function detectPlatform(url) {
  try {
    const normalized = url.toLowerCase().trim();

    // Check for direct image URL
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(normalized)) {
      return { key: 'direct', platform: PLATFORMS.direct };
    }

    for (const [key, platform] of Object.entries(PLATFORMS)) {
      if (key === 'direct') continue;
      if (platform.patterns.some((p) => p.test(normalized))) {
        return { key, platform };
      }
    }
  } catch (_) {}

  return { key: 'unknown', platform: { name: 'Unknown', icon: '🌐', color: '#6b7280' } };
}

// ─── CORS Proxy Helpers ────────────────────────────────────────────────────────

/**
 * Fetches a URL through allorigins CORS proxy.
 * Returns the raw HTML text of the target page.
 */
async function fetchViaProxy(targetUrl) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
  const data = await res.json();
  return data.contents;
}

/**
 * Extracts an og:image or twitter:image meta tag from HTML.
 */
function extractOgImage(html) {
  if (!html) return null;

  // Try og:image first
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
  );
  if (ogMatch) return ogMatch[1];

  // Fallback: twitter:image
  const twMatch = html.match(
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
  );
  if (twMatch) return twMatch[1];

  // Last resort: first <img> src
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp))["']/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

/**
 * Extracts og:title from HTML.
 */
function extractOgTitle(html) {
  if (!html) return null;
  const m = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
    || html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim() : null;
}

// ─── YouTube Thumbnail Extractor ──────────────────────────────────────────────

function extractYouTubeVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Image Blob Fetcher ────────────────────────────────────────────────────────

/**
 * Fetches an image by URL and returns a File object.
 * Tries direct fetch first; falls through CORS proxy if blocked.
 */
async function fetchImageAsFile(imageUrl, filename = 'scanned-image.jpg') {
  // 1. Try direct fetch
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0 && blob.type.startsWith('image/')) {
        return new File([blob], filename, { type: blob.type });
      }
    }
  } catch (_) {}

  // 2. Fallback: fetch via allorigins as raw bytes (base64 encoded)
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('Could not fetch the image. It may be behind a login or restricted.');
  const blob = await res.blob();
  if (blob.size === 0) throw new Error('Image appears to be empty or access-restricted.');
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

// ─── Main Scanner API ──────────────────────────────────────────────────────────

/**
 * Scan a social media or direct URL to extract its media content.
 *
 * @param {string} url - The URL to scan
 * @param {function} onStatus - Callback for status messages: onStatus(message: string)
 * @returns {{ file: File, imageUrl: string, title: string, platform: object }}
 */
export async function scanUrlForMedia(url, onStatus = () => {}) {
  const { key, platform } = detectPlatform(url);

  onStatus(`Detected platform: ${platform.name}`);

  // ── YouTube: use thumbnail API directly ─────────────────────────────────────
  if (key === 'youtube') {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) throw new Error('Could not extract YouTube video ID from URL.');
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    onStatus('Fetching YouTube thumbnail…');
    const file = await fetchImageAsFile(thumbUrl, `youtube-${videoId}.jpg`);
    return {
      file,
      imageUrl: thumbUrl,
      title: `YouTube Video ${videoId}`,
      platform,
    };
  }

  // ── Direct image URL ──────────────────────────────────────────────────────────
  if (key === 'direct') {
    onStatus('Fetching image directly…');
    const filename = url.split('/').pop().split('?')[0] || 'image.jpg';
    const file = await fetchImageAsFile(url, filename);
    const blobUrl = URL.createObjectURL(file);
    return {
      file,
      imageUrl: blobUrl,
      title: filename,
      platform,
    };
  }

  // ── Social platforms: fetch HTML → extract og:image ──────────────────────────
  onStatus(`Fetching page from ${platform.name}…`);
  const html = await fetchViaProxy(url);

  onStatus('Extracting media metadata…');
  const imageUrl = extractOgImage(html);
  const title = extractOgTitle(html) || url;

  if (!imageUrl) {
    throw new Error(
      `Could not find a public image on this ${platform.name} post. ` +
      'The account may be private, or the post may not have a public preview image.'
    );
  }

  onStatus('Downloading media for analysis…');
  const filename = `${key}-${Date.now()}.jpg`;
  const file = await fetchImageAsFile(imageUrl, filename);
  const blobUrl = URL.createObjectURL(file);

  return {
    file,
    imageUrl: blobUrl,
    title,
    platform,
  };
}
