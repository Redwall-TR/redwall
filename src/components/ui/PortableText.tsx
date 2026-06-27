import { PortableText, type PortableTextBlock } from '@portabletext/react';

export function PortableTextRenderer({ value }: { value?: PortableTextBlock[] }) {
  if (!value?.length) return null;
  return <div className="prose-redwall space-y-4"><PortableText value={value} /></div>;
}
