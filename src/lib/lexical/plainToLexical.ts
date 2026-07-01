export type LexicalState = {
  root: {
    children: unknown[]
    type: 'root'
    version: 1
    format: ''
    indent: 0
    direction: 'ltr'
  }
}

function textParagraph(text: string) {
  return {
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr' as const,
    textFormat: 0,
    textStyle: '',
    children: [
      { type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text },
    ],
  }
}

/** Düz metni (satır başına bir paragraf) Lexical editor state'ine çevirir. */
export function plainToLexical(text: string | null | undefined): LexicalState {
  const paras = (text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  return {
    root: {
      children: paras.map(textParagraph),
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
    },
  }
}

/**
 * Render/backfill için değeri normalize eder:
 * - null/undefined/boş string → null
 * - dolu string → plainToLexical
 * - Lexical state (root'lu obje) → aynen (children boşsa null)
 */
export function normalizeToLexical(value: unknown): LexicalState | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const s = plainToLexical(value)
    return s.root.children.length > 0 ? s : null
  }
  if (typeof value === 'object' && 'root' in (value as Record<string, unknown>)) {
    const st = value as LexicalState
    return st.root?.children?.length ? st : null
  }
  return null
}
