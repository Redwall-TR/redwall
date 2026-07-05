import { normalizeToLexical } from '@/lib/lexical/plainToLexical';

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] };

function collectText(node: LexicalNode, out: string[]): void {
  if (typeof node.text === 'string' && node.text) out.push(node.text);
  if (Array.isArray(node.children)) for (const c of node.children) collectText(c, out);
}

/** Lexical state (veya düz string) → düz metin. Paragraf/öğe metinleri boşlukla birleşir.
 *  JSON-LD (FAQPage acceptedAnswer vb.) için; null/boş → ''. */
export function lexicalToPlainText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  const data = normalizeToLexical(value) as unknown as { root?: LexicalNode } | null;
  if (!data?.root?.children) return '';
  const parts: string[] = [];
  for (const child of data.root.children) {
    if (child.type === 'list' && Array.isArray(child.children)) {
      // List items are treated as separate parts
      for (const item of child.children) {
        const buf: string[] = [];
        collectText(item, buf);
        if (buf.length) parts.push(buf.join(''));
      }
    } else {
      const buf: string[] = [];
      collectText(child, buf);
      if (buf.length) parts.push(buf.join(''));
    }
  }
  return parts.join(' ').trim();
}
