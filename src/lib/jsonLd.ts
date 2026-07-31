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

/**
 * Local business (ProfessionalService) structured data.
 *
 * NOT — Bu veri sayfada GÖRÜNMEZ; yalnızca arama motorları / AI ajanları okur.
 * Yerel-alaka sinyali (şehir + hizmet türü) buradan verilir, görünür metne
 * "Sakarya" yazmaya gerek kalmadan. Değerler CMS SiteSettings'ten override
 * edilebilir; verilmezse aşağıdaki gerçek Adapazarı/Sakarya varsayılanları kullanılır.
 */
export function localBusinessJsonLd(o: {
  name: string;
  url: string;
  logoUrl?: string;
  imageUrl?: string;
  phone?: string;
  email?: string;
  sameAs?: string[];
  description?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  areaServed?: string[];
  serviceTypes?: string[];
  openingHours?: { days: string[]; opens: string; closes: string }[];
  priceRange?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@context': CTX,
    '@type': 'ProfessionalService',
    '@id': `${o.url}#localbusiness`,
    name: o.name,
    url: o.url,
  };
  if (o.description) out.description = o.description;
  if (o.logoUrl) out.logo = o.logoUrl;
  if (o.imageUrl ?? o.logoUrl) out.image = o.imageUrl ?? o.logoUrl;
  if (o.phone) out.telephone = o.phone;
  if (o.email) out.email = o.email;
  if (o.priceRange) out.priceRange = o.priceRange;
  if (o.sameAs && o.sameAs.length) out.sameAs = o.sameAs;

  out.address = {
    '@type': 'PostalAddress',
    streetAddress: o.streetAddress ?? 'Kurtuluş Mah. Bahçıvan Sok. Sağlık İşhanı No: 2 Kat: 1',
    addressLocality: o.addressLocality ?? 'Adapazarı',
    addressRegion: o.addressRegion ?? 'Sakarya',
    postalCode: o.postalCode ?? '54100',
    addressCountry: o.countryCode ?? 'TR',
  };

  // Adapazarı/Sakarya merkez yaklaşık koordinatı — kesin konum için güncelleyin.
  out.geo = {
    '@type': 'GeoCoordinates',
    latitude: o.latitude ?? 40.7808,
    longitude: o.longitude ?? 30.4033,
  };

  const areas = o.areaServed ?? ['Sakarya', 'Kocaeli', 'Bursa', 'İstanbul', 'Türkiye'];
  out.areaServed = areas.map((a) => ({ '@type': 'AdministrativeArea', name: a }));

  const services = o.serviceTypes ?? [
    'Yangın danışmanlığı',
    'Yangın sistemleri',
    'Yangın güvenliği mühendisliği',
    'Yangın algılama ve söndürme sistemleri',
  ];
  out.serviceType = services;
  out.knowsAbout = services;

  const hours = o.openingHours ?? [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
  ];
  out.openingHoursSpecification = hours.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.days,
    opens: h.opens,
    closes: h.closes,
  }));

  return out;
}

export function articleJsonLd(o: {
  headline: string; description?: string; datePublished?: string; dateModified?: string; imageUrl?: string; url: string; authorName?: string; authorUrl?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@context': CTX, '@type': 'Article', headline: o.headline, url: o.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': o.url },
  };
  if (o.description) out.description = o.description;
  if (o.datePublished) out.datePublished = o.datePublished;
  if (o.dateModified) out.dateModified = o.dateModified;
  if (o.imageUrl) out.image = o.imageUrl;
  if (o.authorName) {
    const author: Record<string, unknown> = { '@type': 'Organization', name: o.authorName };
    if (o.authorUrl) author.url = o.authorUrl;
    out.author = author;
  }
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
