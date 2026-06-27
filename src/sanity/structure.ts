import type { StructureResolver } from 'sanity/structure';

const SINGLETONS = [
  { id: 'siteSettings', title: 'Site Ayarları' },
  { id: 'navigation', title: 'Navigasyon' },
  { id: 'homePage', title: 'Ana Sayfa' },
];
const COLLECTIONS = ['service', 'product', 'project', 'referans', 'faq', 'post', 'jobPosting', 'page'];

export const structure: StructureResolver = (S) =>
  S.list().title('İçerik').items([
    ...SINGLETONS.map((s) =>
      S.listItem().title(s.title).id(s.id).child(S.document().schemaType(s.id).documentId(s.id))),
    S.divider(),
    ...COLLECTIONS.map((t) => S.documentTypeListItem(t)),
  ]);
