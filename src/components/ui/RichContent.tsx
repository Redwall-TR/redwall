import { RichText, type JSXConverterArgs, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import { normalizeToLexical } from '@/lib/lexical/plainToLexical';
import { MediaEmbed } from '@/components/ui/MediaEmbed';

type RichData = Parameters<typeof RichText>[0]['data'];

/** mediaEmbed bloğunun Lexical node'undaki alan şekli (Payload blok tanımıyla eşleşir). */
type MediaEmbedNode = { fields: { url?: string; baslik?: string } };

function mediaEmbedConverter({ node }: JSXConverterArgs<MediaEmbedNode>) {
  return <MediaEmbed url={node.fields?.url} baslik={node.fields?.baslik} />;
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    mediaEmbed: mediaEmbedConverter,
  },
});

/**
 * İçeriği (Lexical state VEYA düz string) tek noktada render eder.
 * Düz string gelirse paragrafa sarılır (koddaki fallback'ler ve henüz
 * taşınmamış içerik çalışmaya devam eder). Boş/null → hiçbir şey render etmez.
 */
export function RichContent({ value, className }: { value: unknown; className?: string }) {
  const data = normalizeToLexical(value);
  if (!data) return null;
  return (
    <div className={className}>
      <RichText data={data as unknown as RichData} converters={converters} />
    </div>
  );
}
