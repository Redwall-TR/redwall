const CTX = 'https://schema.org';

export function organizationJsonLd(o: {
  name: string; url: string; logoUrl?: string; phone?: string; email?: string; sameAs?: string[];
}): Record<string, unknown> {
  const out: Record<string, unknown> = { '@context': CTX, '@type': 'Organization', name: o.name, url: o.url };
  if (o.logoUrl) out.logo = o.logoUrl;
  if (o.sameAs && o.sameAs.length) out.sameAs = o.sameAs;
  if (o.phone || o.email) {
    const cp: Record<string, unknown> = { '@type': 'ContactPoint', contactType: 'customer service' };
    if (o.phone) cp.telephone = o.phone;
    if (o.email) cp.email = o.email;
    out.contactPoint = cp;
  }
  return out;
}

export function websiteJsonLd(o: { name: string; url: string }): Record<string, unknown> {
  return { '@context': CTX, '@type': 'WebSite', name: o.name, url: o.url };
}

export function articleJsonLd(o: {
  headline: string; description?: string; datePublished?: string; imageUrl?: string; url: string; authorName?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@context': CTX, '@type': 'Article', headline: o.headline, url: o.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': o.url },
  };
  if (o.description) out.description = o.description;
  if (o.datePublished) out.datePublished = o.datePublished;
  if (o.imageUrl) out.image = o.imageUrl;
  if (o.authorName) out.author = { '@type': 'Organization', name: o.authorName };
  return out;
}

export function softwareAppJsonLd(o: {
  name: string; description?: string; url: string; category?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@context': CTX, '@type': 'SoftwareApplication', name: o.name, url: o.url,
    applicationCategory: o.category ?? 'BusinessApplication', operatingSystem: 'Web',
  };
  if (o.description) out.description = o.description;
  return out;
}

export function faqPageJsonLd(items: { question: string; answer: string }[]): Record<string, unknown> {
  const mainEntity = items
    .filter((i) => i.question.trim() && i.answer.trim())
    .map((i) => ({
      '@type': 'Question', name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    }));
  return { '@context': CTX, '@type': 'FAQPage', mainEntity };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': CTX, '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
    })),
  };
}
