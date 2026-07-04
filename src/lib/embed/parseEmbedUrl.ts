export type EmbedResult = {
  platform: 'youtube' | 'vimeo' | 'soundcloud' | 'spotify';
  embedSrc: string;
  tur: 'video' | 'ses';
  oran: '16/9' | null;
};

/**
 * Desteklenen platform URL'sini güvenli embed src'ye çevirir.
 * Tanınmayan host, http(s) dışı şema veya geçersiz URL → null (ham iframe basılmaz).
 */
export function parseEmbedUrl(raw: string): EmbedResult | null {
  if (!raw || typeof raw !== 'string') return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = u.searchParams.get('v') ?? (u.pathname.startsWith('/embed/') ? u.pathname.slice(7) : '');
    if (!id) return null;
    return { platform: 'youtube', embedSrc: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`, tur: 'video', oran: '16/9' };
  }
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1);
    if (!id) return null;
    return { platform: 'youtube', embedSrc: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`, tur: 'video', oran: '16/9' };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(\d+)/);
    if (!m) return null;
    return { platform: 'vimeo', embedSrc: `https://player.vimeo.com/video/${m[1]}`, tur: 'video', oran: '16/9' };
  }
  if (host === 'soundcloud.com') {
    return { platform: 'soundcloud', embedSrc: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u.href)}&color=%23c41e3a`, tur: 'ses', oran: null };
  }
  if (host === 'spotify.com' || host === 'open.spotify.com') {
    const m = u.pathname.match(/^\/(track|episode|album|playlist|show)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return { platform: 'spotify', embedSrc: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, tur: 'ses', oran: null };
  }
  return null;
}
