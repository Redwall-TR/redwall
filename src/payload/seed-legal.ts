/**
 * Idempotent seed script — 4 yasal richPage (TR + EN)
 *
 * Usage:  npm run payload:seed-legal
 *
 * Oluşturur / günceller:
 *  • richPage: kvkk-aydinlatma, gizlilik-politikasi,
 *               cerez-politikasi, kullanim-kosullari
 *
 * İdempotentlik: slug ile bulur; yoksa create (locale:tr),
 * varsa veya yeni oluşturulduysa update (locale:en).
 *
 * NOT: Bu metinler hukuki taslaktır.
 * Yürürlük öncesi KVKK danışmanına kontrol ettirin.
 */

import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: resolve(__dirname, '../../.env.local') })
dotenvConfig({ path: resolve(__dirname, '../../.env') })

const { default: config } = await import('../../payload.config')
const { getPayload } = await import('payload')

// ── Lexical helper ────────────────────────────────────────────────────────────

type Block =
  | { h2: string }
  | { h3: string }
  | { p: string }

function lexText(text: string) {
  return {
    detail: 0,
    format: 0,
    mode: 'normal' as const,
    style: '',
    text,
    type: 'text',
    version: 1,
  }
}

function lexParagraph(text: string) {
  return {
    children: [lexText(text)],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'paragraph',
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}

function lexHeading(tag: 'h2' | 'h3', text: string) {
  return {
    children: [lexText(text)],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    tag,
    type: 'heading',
    version: 1,
  }
}

function lex(blocks: Block[]) {
  const children = blocks.map((b) => {
    if ('h2' in b) return lexHeading('h2', b.h2)
    if ('h3' in b) return lexHeading('h3', b.h3)
    return lexParagraph(b.p)
  })
  return {
    root: {
      children,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

// ── Content definitions ───────────────────────────────────────────────────────

const UNVAN =
  'Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri Limited Şirketi'
const ADRES =
  'Kurtuluş Mah. Bahçıvan Sok. Sağlık İşhanı No: 2 Kat: 1, Adapazarı / Sakarya'
const EMAIL = 'info@redwall.com.tr'

const DRAFT_NOTE_TR =
  'Bu metin hukuki taslaktır. Yürürlüğe girmeden önce bir KVKK danışmanına ya da hukuk müşavirine kontrol ettirmeniz tavsiye edilir. Aşağıdaki "[DOLDURULACAK: ...]" alanları, şirket tescil belgelerinden temin edilecek gerçek verilerle değiştirilmelidir.'
const DRAFT_NOTE_EN =
  'This is a draft legal text. It is strongly recommended that you have it reviewed by a data protection consultant or legal counsel before it takes effect. Fields marked "[TO BE FILLED: ...]" must be replaced with actual data from official company registration documents.'

// 1 ── KVKK Aydınlatma Metni
const kvkkTR: Block[] = [
  { p: DRAFT_NOTE_TR },
  { h2: 'Veri Sorumlusu' },
  {
    p: `6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 10. maddesi kapsamında veri sorumlusu sıfatıyla aşağıdaki bilgileri paylaşmaktayız.`,
  },
  {
    p: `Ticaret Unvanı: ${UNVAN}`,
  },
  { p: `Adres: ${ADRES}` },
  { p: `E-posta: ${EMAIL}` },
  { p: `Telefon: [DOLDURULACAK: telefon]` },
  { p: `MERSİS Numarası: [DOLDURULACAK: MERSİS no]` },
  { p: `Ticaret Sicil Numarası: [DOLDURULACAK: ticaret sicil no]` },
  { p: `KEP Adresi: [DOLDURULACAK: KEP adresi]` },
  { h2: 'İşlenen Kişisel Veri Kategorileri' },
  {
    p: 'Web sitemiz ve yazılım ürünlerimiz (YangınPro, MekanikPro) üzerinden aşağıdaki kategorilerde kişisel veri işlenebilmektedir:',
  },
  { p: 'Kimlik Verileri: Ad, soyad.' },
  {
    p: 'İletişim Verileri: E-posta adresi, telefon numarası, şirket adı ve görevi.',
  },
  { p: 'Kullanıcı İşlem Verileri: Hesap oluşturma, oturum açma ve yazılım kullanım kayıtları.' },
  { p: 'Teknik Veriler: IP adresi, tarayıcı türü, işletim sistemi, ziyaret tarihi/saati (sunucu erişim logları).' },
  { p: 'Müşteri İşlem Verileri: Teklif, sipariş ve fatura bilgileri.' },
  { h2: 'Kişisel Verilerin İşlenme Amaçları' },
  { p: 'Toplanan veriler; hizmet sunumu ve yazılım aboneliği yönetimi, müşteri ve kullanıcı desteği sağlanması, iletişim taleplerinin yanıtlanması, yasal yükümlülüklerin yerine getirilmesi, güvenlik ve sistem bütünlüğünün korunması amaçlarıyla işlenmektedir.' },
  { h2: 'Kişisel Verilerin İşlenmesinin Hukuki Sebepleri' },
  { p: 'KVKK Madde 5 kapsamındaki hukuki sebepler:' },
  { p: '(c) Sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması: Kullanıcı hesabı oluşturma, yazılım aboneliği ve hizmet sözleşmesi.' },
  { p: '(ç) Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi: Vergi ve ticaret hukuku gereklilikleri.' },
  { p: '(f) İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaatleri: Site güvenliği, hizmet kalitesinin iyileştirilmesi.' },
  { p: 'Açık rıza gerektiren işlemler (ör. pazarlama iletişimleri) için açık rızanız ayrıca alınacaktır.' },
  { h2: 'Kişisel Verilerin Aktarılması' },
  { p: 'Kişisel verileriniz; yazılım altyapı ve bulut hizmet sağlayıcıları (yurt içi ve/veya yurt dışı), ödeme ve fatura hizmet sağlayıcıları, yasal yükümlülükler çerçevesinde kamu kurum ve kuruluşları ile paylaşılabilir. Yurt dışı aktarımlar, KVKK\'nın 9. maddesi kapsamında gerçekleştirilmekte; yeterli koruma sağlayan veya taahhütname imzalayan ülkelere/alıcılara aktarım yapılmaktadır.' },
  { h2: 'Kişisel Verilerin Saklanma Süresi' },
  { p: 'Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama yükümlülükleri (ör. vergi mevzuatı gereği 10 yıl, ticaret kanunu gereği 5 yıl) gözetilerek saklanmakta; bu sürelerin dolmasının ardından silinmekte, yok edilmekte veya anonim hâle getirilmektedir.' },
  { h2: 'İlgili Kişinin Hakları (KVKK Madde 11)' },
  { p: 'KVKK\'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:' },
  { p: '(a) Kişisel verilerinizin işlenip işlenmediğini öğrenme.' },
  { p: '(b) Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme.' },
  { p: '(c) Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme.' },
  { p: '(ç) Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme.' },
  { p: '(d) Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme.' },
  { p: '(e) KVKK\'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme.' },
  { p: '(f) (d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme.' },
  { p: '(g) İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme.' },
  { p: '(ğ) Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.' },
  { h2: 'Başvuru Yöntemi' },
  { p: 'Haklarınızı kullanmak için KVKK Başvuru Formu sayfamızı (/yasal/kvkk-basvuru) kullanabilir ya da talebinizi aşağıdaki adrese yazılı olarak iletebilirsiniz:' },
  { p: `${UNVAN}, ${ADRES}` },
  { p: `E-posta: ${EMAIL} | KEP: [DOLDURULACAK: KEP adresi]` },
  { p: 'Başvurunuz en geç 30 gün içinde sonuçlandırılacaktır.' },
]

const kvkkEN: Block[] = [
  { p: DRAFT_NOTE_EN },
  { h2: 'Data Controller' },
  {
    p: `Pursuant to Article 10 of the Law on the Protection of Personal Data No. 6698 ("KVKK"), we provide the following information as data controller.`,
  },
  { p: `Company Name: ${UNVAN}` },
  { p: `Address: ${ADRES}` },
  { p: `E-mail: ${EMAIL}` },
  { p: `Phone: [TO BE FILLED: phone]` },
  { p: `MERSİS Number: [TO BE FILLED: MERSİS no]` },
  { p: `Trade Registry Number: [TO BE FILLED: trade registry no]` },
  { p: `Registered Electronic Mail (KEP): [TO BE FILLED: KEP address]` },
  { h2: 'Categories of Personal Data Processed' },
  { p: 'The following categories of personal data may be processed through our website and software products (YangınPro, MekanikPro):' },
  { p: 'Identity Data: First name, last name.' },
  { p: 'Contact Data: E-mail address, phone number, company name and title.' },
  { p: 'User Transaction Data: Account creation, login and software usage records.' },
  { p: 'Technical Data: IP address, browser type, operating system, visit date/time (server access logs).' },
  { p: 'Customer Transaction Data: Quotation, order and invoice information.' },
  { h2: 'Purposes of Processing' },
  { p: 'Collected data is processed for: service delivery and software subscription management, customer and user support, responding to contact requests, fulfilling legal obligations, and maintaining security and system integrity.' },
  { h2: 'Legal Grounds for Processing' },
  { p: 'Legal grounds under KVKK Article 5:' },
  { p: '(c) Necessity for the establishment or performance of a contract: User account creation, software subscriptions and service agreements.' },
  { p: '(ç) Compliance with a legal obligation of the data controller: Requirements under tax and commercial law.' },
  { p: '(f) Legitimate interests of the data controller, provided that fundamental rights of the data subject are not harmed: Website security, improvement of service quality.' },
  { p: 'Explicit consent will be separately obtained for processing that requires it (e.g., marketing communications).' },
  { h2: 'Transfer of Personal Data' },
  { p: 'Your personal data may be shared with software infrastructure and cloud service providers (domestic and/or overseas), payment and invoicing service providers, and public authorities within the scope of legal obligations. Overseas transfers are carried out under Article 9 of the KVKK, to countries offering adequate protection or recipients who have signed undertakings.' },
  { h2: 'Retention Period' },
  { p: 'Your personal data is retained for as long as required by the processing purpose and applicable statutory retention obligations (e.g., 10 years under tax law, 5 years under commercial law); upon expiry of these periods it is deleted, destroyed, or anonymised.' },
  { h2: 'Rights of the Data Subject (KVKK Article 11)' },
  { p: 'Under Article 11 of the KVKK you have the right to: learn whether your personal data has been processed; request information if it has; learn the purpose of processing and whether data is used accordingly; know third parties to whom data is transferred; request correction of incomplete or inaccurate data; request deletion or destruction under conditions in Article 7; request notification of corrections/deletions to third parties; object to automated profiling that produces adverse results; and claim compensation for damages arising from unlawful processing.' },
  { h2: 'How to Apply' },
  { p: 'To exercise your rights, please use our KVKK Application Form page (/yasal/kvkk-basvuru) or submit your request in writing to:' },
  { p: `${UNVAN}, ${ADRES}` },
  { p: `E-mail: ${EMAIL} | KEP: [TO BE FILLED: KEP address]` },
  { p: 'Your application will be concluded within 30 days at the latest.' },
]

// 2 ── Gizlilik Politikası
const gizlilikTR: Block[] = [
  { p: DRAFT_NOTE_TR },
  { h2: 'Giriş' },
  {
    p: `${UNVAN} olarak ("Redwall", "biz") bu Gizlilik Politikası ile redwall.tr web sitemizi ve yazılım ürünlerimizi (YangınPro, MekanikPro) kullanırken kişisel verilerinizi nasıl topladığımızı, işlediğimizi ve koruduğumuzu açıklamaktayız. Politika, 6698 sayılı KVKK ve ilgili ikincil mevzuat çerçevesinde hazırlanmıştır.`,
  },
  { h2: 'Toplanan Veriler' },
  { p: 'Sizi doğrudan tanımlayan veriler: Ad, soyad, e-posta adresi, telefon numarası.' },
  { p: 'Hesap ve kullanım verileri: Yazılım aboneliği, giriş geçmişi, kullanım istatistikleri.' },
  { p: 'İletişim verileri: Bizimle iletişime geçtiğinizde paylaştığınız mesaj ve ek bilgiler.' },
  { p: 'Teknik veriler: IP adresi, tarayıcı türü, işletim sistemi, ziyaret tarihi ve saati.' },
  { p: 'Çerez verileri: Yalnızca oturum ve dil tercihi çerezleri (bkz. Çerez Politikası).' },
  { h2: 'Kullanım Amaçları' },
  { p: 'Kişisel verileriniz; hizmet ve yazılım aboneliğinin sunulması ve yönetimi, müşteri destek taleplerinizin karşılanması, yazılım güvenliği ve dolandırıcılık önleme, yasal yükümlülüklerin yerine getirilmesi ve iletişim taleplerinizin yanıtlanması amaçlarıyla kullanılmaktadır.' },
  { h2: 'Çerezler' },
  { p: 'Sitemizde yalnızca teknik olarak zorunlu çerezler kullanılmaktadır. İzleme, reklam veya analitik amaçlı üçüncü taraf çerezler şu an aktif değildir. Çerezler hakkında ayrıntılı bilgi için Çerez Politikamızı (/yasal/cerez-politikasi) inceleyiniz.' },
  { h2: 'Üçüncü Taraf Paylaşımı' },
  { p: 'Kişisel verileriniz; hizmetlerin sunulması için gerekli teknik altyapı sağlayıcıları, ödeme/fatura hizmet sağlayıcıları ve kanunen zorunlu hallerde kamu kurumlarıyla paylaşılabilir. Verileriniz ticari amaçla üçüncü taraflara satılmaz veya kiralanmaz.' },
  { h2: 'Veri Güvenliği' },
  { p: 'Kişisel verilerinizin güvenliğini sağlamak amacıyla uygun teknik ve idari tedbirler alınmaktadır: Güvenli (HTTPS) iletişim, erişim denetimi ve yetkilendirme mekanizmaları, düzenli yedekleme ve şifreleme politikaları.' },
  { h2: 'Haklarınız' },
  { p: 'KVKK Madde 11 uyarınca kişisel verilerinize erişme, düzeltme, silme ve itiraz haklarına sahipsiniz. Başvurularınız için KVKK Aydınlatma Metni (/yasal/kvkk-aydinlatma) sayfamıza bakınız.' },
  { h2: 'İletişim' },
  { p: `Politika veya verilerinizle ilgili sorularınız için: ${EMAIL}` },
  { p: `Adres: ${ADRES}` },
  { h2: 'Güncellemeler' },
  { p: 'Bu Gizlilik Politikası değiştirildiğinde, güncel versiyon bu sayfada yayımlanır ve "Son Güncelleme" tarihi revize edilir.' },
]

const gizlilikEN: Block[] = [
  { p: DRAFT_NOTE_EN },
  { h2: 'Introduction' },
  {
    p: `As ${UNVAN} ("Redwall", "we"), this Privacy Policy explains how we collect, process and protect your personal data when you use our website redwall.tr and our software products (YangınPro, MekanikPro). The Policy has been prepared in accordance with the KVKK No. 6698 and related secondary legislation.`,
  },
  { h2: 'Data We Collect' },
  { p: 'Directly identifying data: First name, last name, e-mail address, phone number.' },
  { p: 'Account and usage data: Software subscription, login history, usage statistics.' },
  { p: 'Communication data: Messages and additional information you share when contacting us.' },
  { p: 'Technical data: IP address, browser type, operating system, date and time of visit.' },
  { p: 'Cookie data: Session and language-preference cookies only (see Cookie Policy).' },
  { h2: 'Purposes of Use' },
  { p: 'Your personal data is used for: delivering and managing services and software subscriptions, handling customer support requests, software security and fraud prevention, fulfilling legal obligations, and responding to your communication requests.' },
  { h2: 'Cookies' },
  { p: 'Our website uses only technically necessary cookies. Third-party tracking, advertising or analytics cookies are not currently active. For detailed information on cookies, please see our Cookie Policy (/yasal/cerez-politikasi).' },
  { h2: 'Third-Party Sharing' },
  { p: 'Your personal data may be shared with technical infrastructure providers necessary for service delivery, payment/invoicing service providers, and public authorities where legally required. Your data is not sold or rented to third parties for commercial purposes.' },
  { h2: 'Data Security' },
  { p: 'Appropriate technical and administrative measures are taken to ensure the security of your personal data: Secure (HTTPS) communications, access control and authorisation mechanisms, regular backup and encryption policies.' },
  { h2: 'Your Rights' },
  { p: 'Under KVKK Article 11 you have the right to access, correct, delete and object to the processing of your personal data. For how to submit a request, please see our KVKK Notice (/yasal/kvkk-aydinlatma).' },
  { h2: 'Contact' },
  { p: `For questions about this Policy or your data: ${EMAIL}` },
  { p: `Address: ${ADRES}` },
  { h2: 'Updates' },
  { p: 'When this Privacy Policy is updated, the current version will be published on this page and the "Last Updated" date will be revised.' },
]

// 3 ── Çerez Politikası
const cerezTR: Block[] = [
  { p: DRAFT_NOTE_TR },
  { h2: 'Çerez Nedir?' },
  {
    p: 'Çerezler, ziyaret ettiğiniz web sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır. Tekrar ziyarette kullanıcı tercihlerini hatırlamak, oturum sürekliliğini sağlamak gibi işlevler için kullanılırlar.',
  },
  { h2: 'Sitemizde Kullanılan Çerezler' },
  { p: 'Sitemiz şu an yalnızca teknik olarak zorunlu çerezleri kullanmaktadır. İzleme, analitik veya reklam amaçlı çerez bulunmamaktadır.' },
  { h3: 'Zorunlu Çerezler' },
  { p: 'Oturum çerezi (session): Oturumunuzu açık tutmak ve güvenli geçişleri sağlamak için kullanılır. Tarayıcı kapatıldığında silinir.' },
  { p: 'Dil tercihi çerezi (locale): Tercih ettiğiniz dili (Türkçe/İngilizce) hatırlamak için kullanılır. Tarayıcı kapatıldığında silinir.' },
  { p: 'Çerez onay çerezi (cookie_consent): Çerez tercihinizi (kabul/ret) kaydetmek için kullanılır; yerel depolama (localStorage) ile tutulur.' },
  { h2: 'Onay Mekanizması' },
  { p: 'İlk ziyaretinizde bir çerez onay bandı (cookie banner) gösterilir. "Kabul Et" veya "Reddet" seçenekleriniz vardır. Tercihiz localStorage\'da saklanır ve aynı tarayıcıda bir daha gösterilmez. Yalnızca zorunlu çerezler kullanıldığından reddedilmesi durumunda işlevsellik değişmez; ileride analitik çerez eklenmesi hâlinde onay mekanizması güncellenecektir.' },
  { h2: 'Tarayıcıdan Çerez Yönetimi' },
  { p: 'Tarayıcı ayarlarından tüm çerezleri engelleyebilir veya silebilirsiniz. Bunun sitenin işleyişini kısmen etkileyebileceğini hatırlatırız. Popüler tarayıcılar için ayar yöntemi:' },
  { p: 'Google Chrome: Ayarlar → Gizlilik ve Güvenlik → Çerezler ve diğer site verileri.' },
  { p: 'Mozilla Firefox: Ayarlar → Gizlilik ve Güvenlik → Geçmiş.' },
  { p: 'Microsoft Edge: Ayarlar → Çerezler ve site izinleri.' },
  { p: 'Safari: Tercihler → Gizlilik → Çerezleri Yönet.' },
  { h2: 'İletişim' },
  { p: `Çerez politikamız hakkında sorularınız için: ${EMAIL}` },
]

const cerezEN: Block[] = [
  { p: DRAFT_NOTE_EN },
  { h2: 'What Are Cookies?' },
  {
    p: 'Cookies are small text files placed on your browser by websites you visit. They are used for functions such as remembering user preferences on return visits and maintaining session continuity.',
  },
  { h2: 'Cookies Used on Our Site' },
  { p: 'Our site currently uses only technically necessary cookies. There are no tracking, analytics, or advertising cookies.' },
  { h3: 'Necessary Cookies' },
  { p: 'Session cookie: Used to keep your session active and ensure secure navigation. Deleted when the browser is closed.' },
  { p: 'Language preference cookie (locale): Used to remember your preferred language (Turkish/English). Deleted when the browser is closed.' },
  { p: 'Cookie consent cookie (cookie_consent): Used to store your cookie preference (accept/reject) via localStorage.' },
  { h2: 'Consent Mechanism' },
  { p: 'A cookie consent banner is displayed on your first visit, offering "Accept" or "Reject" options. Your preference is stored in localStorage and the banner is not shown again in the same browser. Since only necessary cookies are used, rejecting does not affect functionality; should analytics cookies be added in future, the consent mechanism will be updated accordingly.' },
  { h2: 'Managing Cookies via Your Browser' },
  { p: 'You can block or delete all cookies from your browser settings; note that this may partially affect site functionality. Instructions for popular browsers:' },
  { p: 'Google Chrome: Settings → Privacy and Security → Cookies and other site data.' },
  { p: 'Mozilla Firefox: Settings → Privacy & Security → History.' },
  { p: 'Microsoft Edge: Settings → Cookies and site permissions.' },
  { p: 'Safari: Preferences → Privacy → Manage Cookies.' },
  { h2: 'Contact' },
  { p: `For questions about our cookie policy: ${EMAIL}` },
]

// 4 ── Kullanım Koşulları
const kullanim: Block[] = [
  { p: DRAFT_NOTE_TR },
  { h2: 'Kapsam ve Kabul' },
  {
    p: `Bu Kullanım Koşulları ("Koşullar"), ${UNVAN} ("Redwall") tarafından işletilen redwall.tr web sitesi ile YangınPro ve MekanikPro yazılım ürünlerinin kullanımını düzenlemektedir. Siteye erişerek veya yazılımları kullanarak bu Koşulları kabul etmiş sayılırsınız. Kabul etmiyorsanız lütfen siteyi ve ürünleri kullanmayınız.`,
  },
  { h2: 'Fikri Mülkiyet' },
  { p: 'Sitedeki tüm içerik (metinler, görseller, tasarım, kodlar) ile "Redwall", "YangınPro" ve "MekanikPro" marka ve logoları Redwall\'ın fikri mülkiyetidir ve Türk Marka Tescil Hukuku ile Fikir ve Sanat Eserleri Kanunu kapsamında korunmaktadır.' },
  { p: 'İçerikler; ticari amaçla kopyalanamaz, çoğaltılamaz, dağıtılamaz veya türev eserler oluşturulamaz. Kişisel ve ticari olmayan bilgi amaçlı kullanım, kaynak gösterilmesi koşuluyla serbesttir.' },
  { h2: 'Yazılım Lisansı ve Kullanım Hakları' },
  { p: 'YangınPro ve MekanikPro yazılımları; abonelik sözleşmesi kapsamında kullanıcıya münhasır olmayan, devredilemez, sınırlı bir lisans ile sunulmaktadır. Yazılımların tersine mühendisliği, kaynak kodu çıkarımı, izinsiz kopyalanması veya üçüncü taraflara alt-lisans verilmesi yasaktır.' },
  { h2: 'Sorumluluğun Sınırlandırılması' },
  { p: 'Redwall, web sitesi içeriklerinin doğruluğu veya tamlığı konusunda açık veya örtülü hiçbir garanti vermemektedir. Site; "olduğu gibi" ve "mevcut olduğu ölçüde" sunulmakta olup Redwall, sitenin kesintisiz veya hatasız çalışacağını taahhüt etmez.' },
  { p: 'Yasanın izin verdiği azami ölçüde, Redwall\'ın bu siteden veya yazılım kullanımından kaynaklanan dolaylı, arızi veya netice niteliğindeki zararlardan sorumluluğu kabul edilmez.' },
  { h2: 'Dış Bağlantılar' },
  { p: 'Sitede üçüncü taraf web sitelerine bağlantılar bulunabilir. Bu bağlantılar yalnızca kolaylık amacıyla sunulmakta olup Redwall, bağlantı verilen sitelerin içeriğinden, gizlilik uygulamalarından veya hizmetlerinden sorumlu değildir.' },
  { h2: 'Kullanım Koşullarında Değişiklik' },
  { p: 'Redwall, bu Koşulları önceden bildirim yapmaksızın değiştirme hakkını saklı tutar. Değişiklikler, sitede yayımlandığı andan itibaren geçerlidir. Siteyi kullanmaya devam etmeniz, güncel Koşulları kabul ettiğiniz anlamına gelir.' },
  { h2: 'Uygulanacak Hukuk ve Yetkili Mahkeme' },
  { p: 'Bu Koşullar, Türkiye Cumhuriyeti hukukuna tabidir.' },
  { p: 'Bu Koşullardan kaynaklanan uyuşmazlıklarda [DOLDURULACAK: yetkili mahkeme — Sakarya Mahkemeleri] yetkili ve görevli mahkemeler olarak belirlenmektedir.' },
  { h2: 'İletişim' },
  { p: `Bu Koşullar hakkında sorularınız için: ${EMAIL}` },
  { p: `Adres: ${ADRES}` },
]

const kullanımEN: Block[] = [
  { p: DRAFT_NOTE_EN },
  { h2: 'Scope and Acceptance' },
  {
    p: `These Terms of Use ("Terms") govern your use of the redwall.tr website and the YangınPro and MekanikPro software products operated by ${UNVAN} ("Redwall"). By accessing the site or using the software, you are deemed to have accepted these Terms. If you do not accept them, please do not use the site or products.`,
  },
  { h2: 'Intellectual Property' },
  { p: 'All content on the site (texts, images, design, code) as well as the "Redwall", "YangınPro" and "MekanikPro" trademarks and logos are the intellectual property of Redwall and are protected under Turkish Trademark Law and the Law on Intellectual and Artistic Works.' },
  { p: 'Content may not be copied, reproduced, distributed, or used to create derivative works for commercial purposes. Personal, non-commercial informational use is permitted provided the source is cited.' },
  { h2: 'Software Licence and Usage Rights' },
  { p: 'YangınPro and MekanikPro software are provided to the user under a non-exclusive, non-transferable, limited licence within the scope of a subscription agreement. Reverse engineering, source code extraction, unauthorised copying, or sub-licensing to third parties is prohibited.' },
  { h2: 'Limitation of Liability' },
  { p: 'Redwall makes no express or implied warranties regarding the accuracy or completeness of website content. The site is provided "as is" and "as available"; Redwall does not warrant that the site will operate uninterrupted or error-free.' },
  { p: 'To the maximum extent permitted by law, Redwall accepts no liability for indirect, incidental, or consequential damages arising from use of this site or the software.' },
  { h2: 'External Links' },
  { p: 'The site may contain links to third-party websites. These links are provided for convenience only; Redwall is not responsible for the content, privacy practices, or services of linked sites.' },
  { h2: 'Changes to Terms of Use' },
  { p: 'Redwall reserves the right to modify these Terms without prior notice. Changes take effect from the moment they are published on the site. Continued use of the site constitutes acceptance of the updated Terms.' },
  { h2: 'Governing Law and Jurisdiction' },
  { p: 'These Terms are governed by the laws of the Republic of Turkey.' },
  { p: '[TO BE FILLED: competent court — Sakarya Courts] shall have exclusive jurisdiction over disputes arising from these Terms.' },
  { h2: 'Contact' },
  { p: `For questions about these Terms: ${EMAIL}` },
  { p: `Address: ${ADRES}` },
]

// ── Page definitions ──────────────────────────────────────────────────────────

type LegalPage = {
  slug: string
  baslikTR: string
  baslikEN: string
  icerikTR: Block[]
  icerikEN: Block[]
}

const legalPages: LegalPage[] = [
  {
    slug: 'kvkk-aydinlatma',
    baslikTR: 'KVKK Aydınlatma Metni',
    baslikEN: 'Personal Data Protection Notice',
    icerikTR: kvkkTR,
    icerikEN: kvkkEN,
  },
  {
    slug: 'gizlilik-politikasi',
    baslikTR: 'Gizlilik Politikası',
    baslikEN: 'Privacy Policy',
    icerikTR: gizlilikTR,
    icerikEN: gizlilikEN,
  },
  {
    slug: 'cerez-politikasi',
    baslikTR: 'Çerez Politikası',
    baslikEN: 'Cookie Policy',
    icerikTR: cerezTR,
    icerikEN: cerezEN,
  },
  {
    slug: 'kullanim-kosullari',
    baslikTR: 'Kullanım Koşulları',
    baslikEN: 'Terms of Use',
    icerikTR: kullanim,
    icerikEN: kullanımEN,
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config })
  console.log('🌱  Yasal içerik seed başlıyor…')

  const today = new Date().toISOString()

  for (const page of legalPages) {
    const existing = await payload.find({
      collection: 'richPage',
      where: { slug: { equals: page.slug } },
      limit: 1,
      overrideAccess: true,
    })

    let docId: string | number

    if (existing.totalDocs === 0) {
      // Create with TR locale
      const doc = await payload.create({
        collection: 'richPage',
        locale: 'tr',
        data: {
          slug: page.slug,
          kategori: 'legal',
          baslik: page.baslikTR,
          icerik: lex(page.icerikTR),
          sonGuncelleme: today,
        },
        overrideAccess: true,
      })
      docId = doc.id
      console.log(`  ✓ richPage[${page.slug}] oluşturuldu (TR)`)
    } else {
      docId = existing.docs[0].id
      // Update TR locale (for idempotency — keeps content fresh)
      await payload.update({
        collection: 'richPage',
        id: docId,
        locale: 'tr',
        data: {
          baslik: page.baslikTR,
          icerik: lex(page.icerikTR),
          sonGuncelleme: today,
        },
        overrideAccess: true,
      })
      console.log(`  – richPage[${page.slug}] zaten var, TR güncellendi.`)
    }

    // Always update EN locale
    await payload.update({
      collection: 'richPage',
      id: docId,
      locale: 'en',
      data: {
        baslik: page.baslikEN,
        icerik: lex(page.icerikEN),
      },
      overrideAccess: true,
    })
    console.log(`  ✓ richPage[${page.slug}] EN locale yazıldı`)
  }

  console.log('\n✅  Yasal içerik seed tamamlandı.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Seed hatası:', err)
  process.exit(1)
})
