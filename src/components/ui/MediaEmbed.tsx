import { parseEmbedUrl } from '@/lib/embed/parseEmbedUrl';

/** Lexical mediaEmbed bloğunu güvenli, responsive oynatıcı iframe'ine çevirir.
 *  Tanınmayan URL → düz bağlantı fallback (asla ham iframe). */
export function MediaEmbed({ url, baslik }: { url?: unknown; baslik?: unknown }) {
  const src = typeof url === 'string' ? url : '';
  const caption = typeof baslik === 'string' && baslik.trim() ? baslik.trim() : undefined;
  const parsed = parseEmbedUrl(src);

  if (!parsed) {
    if (!src) return null;
    return (
      <a href={src} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline">
        {caption ?? src}
      </a>
    );
  }

  const title = caption ?? parsed.platform;
  const iframe = (
    <iframe
      src={parsed.embedSrc}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen"
      allowFullScreen
      className={parsed.oran ? 'absolute inset-0 h-full w-full' : 'w-full'}
      style={parsed.oran ? undefined : { height: parsed.platform === 'spotify' ? 152 : 166 }}
    />
  );

  return (
    <figure className="my-6 not-prose">
      {parsed.oran ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-border" style={{ aspectRatio: '16 / 9' }}>
          {iframe}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">{iframe}</div>
      )}
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
