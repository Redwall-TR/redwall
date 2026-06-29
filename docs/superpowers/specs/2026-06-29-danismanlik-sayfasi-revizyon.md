# Danışmanlık Sayfası İçerik Revizyonu — Tasarım

**Tarih:** 2026-06-29 · **Durum:** Onaylandı (kullanıcı), uygulanacak

## Amaç
Danışmanlık sayfasını Redwall'ın gerçek **4 danışmanlık teklifi** etrafında yeniden kurgulamak: jenerik 6 kart → net 4 kart + uçtan uca süreç.

## Mimari (mevcut)
- Sayfa: `src/app/(site)/[locale]/danismanlik/page.tsx` → `<ServiceDetail isKolu="danismanlik">`.
- İçerik kaynağı (alan-bazında CMS-öncelikli, yoksa fallback): `baslik/ozet` → CMS `service` kaydı (seed.ts'ten); `chips/intro/altHizmetler/surec` → `DANISMANLIK_FALLBACK` (ServiceDetail.tsx), çünkü seed bunları CMS'e yazmıyor.

## Uygulama
1. **`ServiceDetail.tsx` → `DANISMANLIK_FALLBACK`**: chips + intro + altHizmetler (4) + surec (5) aşağıdaki içerikle değiştirilir (baslik/ozet de tutarlılık için güncellenir).
2. **`seed.ts`** danismanlik `baslik/ozet` güncellenir → dev'de `payload:seed` ile uygulanır; **prod'da** hedefli SQL ile (ana seed prod'da çalıştırılmaz — gerçek içeriği ezmemek için).
3. FeatureCard grid (`lg:grid-cols-3`) 4 kartı 3+1 gösterir — kabul edilebilir, değişmez.

## İçerik (TR + EN)

### Hero
- **baslik:** TR "Yangın Güvenliği Danışmanlığı" / EN "Fire Safety Consulting"
- **ozet:** TR "Kamu kurumlarından bina yönetimlerine, mal sahiplerinden müteahhitlere; mevzuata uygunluk, olumsuz itfaiye raporlarının olumluya çevrilmesi, doğru projelendirme ve uçtan uca süreç yönetiminde uzman desteği sunuyoruz." / EN "From public institutions to building managements, property owners to contractors — expert support on regulatory compliance, turning negative fire-department reports positive, sound project design, and end-to-end process management."
- **chips:** TR [Kamu kurumları, Bina yönetimleri & mal sahipleri, Müteahhitler, Anahtar teslim süreç] / EN [Public institutions, Building managements & owners, Contractors, Turnkey process]

### Giriş (lead + paragraf)
- **TR lead:** "Her kurumun ve yapının yangın güvenliği gereksinimi farklıdır; çoğu zaman asıl ihtiyaç, mevzuata tam uyum ile hukuki güvenceyi birlikte sağlamaktır."
- **TR paragraf:** "Yangın güvenliği mevzuatına hâkim uzman ekibimizle kurumunuzun, binanızın veya projenizin koşullarına özel danışmanlık sunarız. Tek seferlik bir uygunluk denetiminden olumsuz bir itfaiye raporunun olumluya çevrilmesine, sıfırdan olumlu rapora kadar tüm sürecin yönetimine değin; işi sizin adınıza, yazılı ve denetlenebilir çıktılarla yürütürüz."
- **EN lead:** "Every institution and building has different fire-safety needs; the real requirement is often achieving full regulatory compliance and legal assurance together."
- **EN paragraf:** "With our team's command of fire-safety legislation, we offer consulting tailored to the circumstances of your institution, building, or project. From a one-time compliance audit, to turning a negative fire-department report positive, to managing the entire process from zero to a positive report — we carry out the work on your behalf, with written and auditable outputs."

### 4 Kart (altHizmetler)
1. **icon: building** — TR "Kamu Kurumları Danışmanlığı" / EN "Public Institution Consulting"
   - TR: "İşyeri Açma ve Çalışma Ruhsatları Yönetmeliği'nin 5/h maddesi kapsamında itfaiye tarafından rapor düzenlenmesi gerekmeyen; ancak Binaların Yangından Korunması Hakkında Yönetmelik uyarınca gerekli tedbirlerin alınması zorunlu olan binalarda, kurum adına yerinde denetim gerçekleştiririz. Talep doğrultusunda düzenlediğimiz uygunluk raporuyla, kurumun ilgili mevzuat karşısındaki hukuki sorumluluk riskini asgariye indiririz."
   - EN: "For buildings that do not require a fire-department report under Article 5/h of the Workplace Opening and Operating Licenses Regulation, yet must implement measures under the Regulation on Fire Protection of Buildings, we conduct on-site inspections on the institution's behalf. With the compliance report we issue on request, we minimize the institution's legal-liability risk against the relevant legislation."
2. **icon: shield-check** — TR "İtfaiye Raporu Düzeltme (Olumsuz → Olumlu)" / EN "Fire-Department Report Remediation (Negative → Positive)"
   - TR: "Hakkında olumsuz itfaiye raporu düzenlenmiş binalarda, bina yönetimleri ve/veya mal sahipleri adına süreci yürütürüz. Raporda belirtilen eksiklikler doğrultusunda binayı detaylı biçimde analiz eder, yönetmeliğe uygun çözümleri önceliklendirir ve raporun olumluya çevrilmesi için izlenecek yol haritasını netleştiririz."
   - EN: "For buildings with a negative fire-department report, we manage the process on behalf of building managements and/or owners. In line with the deficiencies cited in the report, we analyze the building in detail, prioritize regulation-compliant solutions, and clarify the roadmap to turn the report positive."
3. **icon: ruler** — TR "Müteahhit & Proje Danışmanlığı" / EN "Contractor & Project Consulting"
   - TR: "İnşaat firmaları ve müteahhitler için proje aşamasında devreye gireriz. Yangın güvenliği sistemlerini yönetmeliğe tam uyumlu, maliyeti optimize eden ve kaynakları verimli kullanan bir yaklaşımla projelendirir; ileride doğabilecek revizyon ve maliyetleri önceden önleriz."
   - EN: "For construction firms and contractors, we engage at the design stage. We design fire-safety systems in full regulatory compliance with an approach that optimizes cost and uses resources efficiently, preventing future revisions and expenses in advance."
4. **icon: clipboard** — TR "Uçtan Uca Süreç Yönetimi (Anahtar Teslim)" / EN "End-to-End Process Management (Turnkey)"
   - TR: "Talebiniz hâlinde tüm süreci uçtan uca yönetiriz. Sıfırdan başlayıp olumlu rapor alınıncaya kadar gereken tüm iş ve işlemleri — keşif, projelendirme, başvuru ve kurum/itfaiye takibi dâhil — kurumunuz adına yürütür, tek muhatap olarak süreci sonuca taşırız."
   - EN: "On request, we manage the entire process end-to-end. From zero until a positive report is obtained, we carry out all required work and procedures — including survey, design, application, and institution/fire-department follow-up — on your behalf, taking the process to conclusion as your single point of contact."

### Süreç (5 adım)
1. TR "Keşif & Etüt" / EN "Survey & Assessment" — TR "Yapıyı veya projeyi yerinde inceler; mevcut durumu ve mevzuat gereksinimlerini eksiksiz tespit ederiz." / EN "We inspect the building or project on site, fully identifying the current status and regulatory requirements."
2. TR "Uygunluk & Çözüm Raporu" / EN "Compliance & Solution Report" — TR "Tespit edilen eksiklik ve riskleri raporlar, yönetmeliğe uygun çözümleri önceliklendiririz." / EN "We report identified deficiencies and risks, prioritizing regulation-compliant solutions."
3. TR "Projelendirme" / EN "Engineering Design" — TR "Gerekli yangın güvenliği sistemlerini mevzuata uygun ve maliyet-etkin biçimde projelendiririz." / EN "We design the required fire-safety systems in a compliant and cost-effective manner."
4. TR "Kurum/İtfaiye Başvurusu & Takip" / EN "Institution & Fire-Department Submission & Follow-up" — TR "Başvuru dosyasını hazırlar; kurum ve itfaiye nezdindeki süreçleri sizin adınıza titizlikle takip ederiz." / EN "We prepare the application file and meticulously follow up the processes before the institution and fire department on your behalf."
5. TR "Olumlu Rapor & Teslim" / EN "Positive Report & Handover" — TR "Süreci olumlu rapor/uygunluk belgesiyle sonuçlandırır, tüm çıktıları teslim ederiz." / EN "We conclude the process with a positive report/compliance document and deliver all outputs."

## Doğrulama
build/lint/test yeşil; dev'de /danismanlik 4 kart + yeni içerik + hero güncellenmiş; TR/EN. Deploy: main'e push → fallback canlıya gider; prod CMS baslik/ozet hedefli SQL ile güncellenir.
