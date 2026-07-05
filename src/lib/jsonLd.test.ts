import { describe, it, expect } from 'vitest';
import { organizationJsonLd, websiteJsonLd, articleJsonLd, softwareAppJsonLd, faqPageJsonLd, breadcrumbJsonLd } from './jsonLd';

describe('jsonLd builders', () => {
  it('organization — zorunlu alanlar + boş atlanır', () => {
    const o = organizationJsonLd({ name: 'Redwall', url: 'https://redwall.tr', sameAs: ['https://x.com/redwall'] });
    expect(o['@type']).toBe('Organization');
    expect(o['@context']).toBe('https://schema.org');
    expect(o.name).toBe('Redwall');
    expect(o.sameAs).toEqual(['https://x.com/redwall']);
    expect('logo' in o).toBe(false); // logoUrl verilmedi → alan yok
  });
  it('organization — logo/telefon verilince eklenir', () => {
    const o = organizationJsonLd({ name: 'R', url: 'https://redwall.tr', logoUrl: 'https://redwall.tr/l.png', phone: '+90 212 000 00 00' });
    expect(o.logo).toBe('https://redwall.tr/l.png');
    expect((o.contactPoint as Record<string, unknown>)['@type']).toBe('ContactPoint');
  });
  it('website', () => {
    expect(websiteJsonLd({ name: 'Redwall', url: 'https://redwall.tr' })['@type']).toBe('WebSite');
  });
  it('article — headline + date + image', () => {
    const a = articleJsonLd({ headline: 'Başlık', url: 'https://redwall.tr/tr/blog/x', datePublished: '2026-01-01', imageUrl: 'https://redwall.tr/c.jpg' });
    expect(a['@type']).toBe('Article');
    expect(a.headline).toBe('Başlık');
    expect(a.datePublished).toBe('2026-01-01');
    expect(a.image).toBe('https://redwall.tr/c.jpg');
  });
  it('softwareApp', () => {
    const s = softwareAppJsonLd({ name: 'YangınPro', url: 'https://redwall.tr/tr/yazilim/yanginpro', category: 'BusinessApplication' });
    expect(s['@type']).toBe('SoftwareApplication');
    expect(s.applicationCategory).toBe('BusinessApplication');
    expect(s.operatingSystem).toBe('Web');
  });
  it('faqPage — boş item elenir', () => {
    const f = faqPageJsonLd([ { question: 'S?', answer: 'C' }, { question: '', answer: 'x' }, { question: 'S2', answer: '' } ]);
    expect(f['@type']).toBe('FAQPage');
    expect((f.mainEntity as unknown[]).length).toBe(1);
    const q = (f.mainEntity as Record<string, unknown>[])[0];
    expect(q['@type']).toBe('Question');
    expect((q.acceptedAnswer as Record<string, unknown>).text).toBe('C');
  });
  it('breadcrumb — position sıralı', () => {
    const b = breadcrumbJsonLd([ { name: 'Ana', url: 'https://redwall.tr/tr' }, { name: 'Blog', url: 'https://redwall.tr/tr/blog' } ]);
    expect(b['@type']).toBe('BreadcrumbList');
    const items = b.itemListElement as Record<string, unknown>[];
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(items[1].name).toBe('Blog');
  });
});
