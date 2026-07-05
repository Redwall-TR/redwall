/** Yapısal veriyi <script type="application/ld+json"> olarak basar.
 *  Güvenlik: JSON.stringify + `<`→< kaçışı script-breakout/XSS'i engeller.
 *  İçerik sunucu-üretimi JSON'dur (kullanıcı girdisi değil); kod tabanındaki tek
 *  dangerouslySetInnerHTML — bu desen JSON-LD için endüstri standardıdır. */
export function JsonLd({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
