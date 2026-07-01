import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  LinkFeature,
  ParagraphFeature,
  UnorderedListFeature,
  OrderedListFeature,
  HeadingFeature,
  BlockquoteFeature,
  InlineToolbarFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'

/** Kısa alanlar (kart/görüş/lead): paragraf + kalın/italik/altçizgi + link + liste. Başlık yok. */
export const liteEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    InlineToolbarFeature(),
    FixedToolbarFeature(),
  ],
})

/** Uzun alanlar (SSS/giriş/ürün açıklaması): lite + h2/h3 başlık + alıntı. */
export const fullEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    InlineToolbarFeature(),
    FixedToolbarFeature(),
  ],
})
