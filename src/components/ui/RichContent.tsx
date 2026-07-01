import { RichText } from '@payloadcms/richtext-lexical/react';
import { normalizeToLexical } from '@/lib/lexical/plainToLexical';

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
      <RichText data={data as unknown as Parameters<typeof RichText>[0]['data']} />
    </div>
  );
}
