export const PROJECTS_QUERY = `*[_type=="project"]|order(yil desc){
  "slug": slug.current, baslik, musteri, isKolu, durum, yil, il, ozet,
  "gorsel": gorseller[0], oneCikan }`;
export const PROJECT_QUERY = `*[_type=="project" && slug.current==$slug][0]{
  baslik, musteri, isKolu, durum, yil, il, kapsam, ozet, aciklama, gorseller }`;
export const SERVICES_QUERY = `*[_type=="service"]|order(sira asc){
  isKolu, baslik, ozet, altHizmetler, imzaRengi }`;
export const SERVICE_QUERY = `*[_type=="service" && isKolu==$isKolu][0]{
  isKolu, baslik, ozet, chips, girisLead, girisParagraflar, altHizmetler, surec }`;
export const PRODUCTS_QUERY = `*[_type=="product"]|order(sira asc){
  "slug": slug.current, ad, slogan, aciklama, ozellikler }`;
export const PRODUCT_QUERY = `*[_type=="product" && slug.current==$slug][0]{
  ad, slogan, aciklama, ozellikler, hedefKitle, ekranGorselleri }`;
export const REFERENCES_QUERY = `*[_type=="referans"]{ ad, logo, gorus }`;
export const FAQS_QUERY = `*[_type=="faq"]|order(sira asc){ kategori, soru, cevap }`;
export const POSTS_QUERY = `*[_type=="post"]|order(tarih desc){ "slug":slug.current, baslik, tarih, kapak, ozet }`;
export const POST_QUERY = `*[_type=="post" && slug.current==$slug][0]{ baslik, tarih, kapak, icerik }`;
export const JOBS_QUERY = `*[_type=="jobPosting" && aktif==true]{ "slug":slug.current, baslik, lokasyon, tip }`;
export const PAGE_QUERY = `*[_type=="page" && slug.current==$slug][0]{
  baslik, altBaslik, chips, girisLead, girisParagraflar,
  vizyonBaslik, vizyonMetin, misyonBaslik, misyonMetin,
  kartlarEyebrow, kartlarBaslik, kartlarAciklama, kartlar }`;
export const SITE_SETTINGS_QUERY = `*[_type=="siteSettings"][0]{ sirketAdi, iletisim, sosyal, calismaSaatleri, istatistikler, seo }`;
export const NAV_QUERY = `*[_type=="navigation"][0]{ headerLinks, footerKolonlari }`;
export const HOME_QUERY = `*[_type=="homePage"][0]{ heroBaslik, heroAltMetin, heroBirincilCta, heroIkincilCta, yaklasim, "oneCikanUrun": oneCikanUrun->{ "slug":slug.current, ad, slogan } }`;
export const FEATURED_PROJECTS_QUERY = `*[_type=="project" && oneCikan==true]|order(yil desc)[0..2]{ "slug":slug.current, baslik, musteri, isKolu, durum, "gorsel": gorseller[0] }`;
