# Öztunç Motor — Motosiklet Satış ve Servis Sitesi

Öztunç Motor (Cedidiye Mah., Mimar Sinan Cad. No:75, 81020 Düzce) için motosiklet kataloğu, servis randevu sistemi ve yönetim paneli.

**Teknoloji:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 7 · Zod · Vitest

---

## İçindekiler

1. [Özellikler](#özellikler)
2. [Kurulum (geliştirme)](#kurulum-geliştirme)
3. [Ortam değişkenleri](#ortam-değişkenleri)
4. [Veritabanı ve migration](#veritabanı-ve-migration)
5. [İlk yöneticiyi oluşturma](#i̇lk-yöneticiyi-oluşturma)
6. [Testler ve kalite kontrolleri](#testler-ve-kalite-kontrolleri)
7. [Üretime alma](#üretime-alma)
8. [Yayın öncesi eksik işletme bilgileri](#yayın-öncesi-eksik-işletme-bilgileri)
9. [Mimari notlar](#mimari-notlar)

---

## Özellikler

**Site**
- Ana sayfa: koyu giriş bölümü (panelden değişen hero görseli, kesilmeden `object-contain`), boş olmayan kategoriler, öne çıkan modeller, koyu servis bölümü, işletme tanıtımı, konum ve iletişim (harita ziyaretçi tıklayınca yüklenir).
- `/motosikletler`: marka, kategori, güç aktarımı (benzinli/elektrikli), motor hacmi, fiyat aralığı ve stok filtreleri; model arama; fiyat sıralaması. Filtreler URL parametrelerinde tutulur; mobilde panel içinde açılır. Sonuç sayısı, aktif filtreler, “Filtreleri Temizle” ve boş durum vardır.
- `/motosikletler/[slug]`: galeri ve önizlemeler, fiyat/stok, renkler, yalnızca girilmiş teknik özellikler, açıklama, ürüne bağlı bilgi talebi formu, (numara girilmişse) modele özel WhatsApp bağlantısı, ilgili modeller.
- `/karsilastir`: en fazla 3 modelin girilmiş özelliklerini yan yana karşılaştırma (mobilde de kullanılabilir).
- `/servis` ve `/servis-randevusu`: 3 adımlı randevu formu (motosiklet ve işlem → tarih ve saat → iletişim ve özet). Adımlar arasında veriler korunur, hatalar ilgili alanın yanında gösterilir. Başarı mesajı ve referans numarası yalnızca kayıt veritabanına yazıldıktan sonra gösterilir.
- `/hakkimizda`, `/iletisim`, `/kvkk`, `/gizlilik`, `/cerez-politikasi`, `sitemap.xml`, `robots.txt`, varsayılan Open Graph görseli (`/og`), işletme ve ürün yapılandırılmış verisi.
- Mobilde sabit “Modeller / Servis Randevusu / (telefon girilmişse) Ara” çubuğu; içerik bu yükseklik kadar boşlukla yerleşir.

**Yönetim paneli (`/admin`)**
- Motosiklet ekleme/düzenleme/silme/yayımlama, öne çıkarma, fotoğraf yükleme–sıralama–açıklama, renkler, teknik ve ek özellikler, ürün SEO’su.
- Marka (doğrulanmış yetkili satıcı/servis işaretleri dahil), kategori ve servis hizmeti yönetimi.
- Randevu listesi (arama, tarih ve durum filtreleri), haftalık takvim, durum değiştirme, zaman değiştirme, iç notlar.
- Ürün bilgi talepleri; çalışma günleri/saatleri, molalar, tatiller, slot süresi ve kapasitesi.
- İletişim bilgileri, logo, hero, servis ve işletme fotoğrafları, sayfa metinleri, SEO, politika metinleri, bildirim kuyruğu, kullanıcılar ve roller.
- Genel bakış ekranında **yayın öncesi kontrol listesi**.

**Roller**

| Rol | İçerik/katalog | Randevu, talep, müşteri bilgisi | Çalışma saatleri | İletişim/görseller, bildirimler | Kullanıcılar |
|---|---|---|---|---|---|
| Yönetici (`ADMIN`) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Servis/Satış personeli (`STAFF`) | ✓ | ✓ | ✓ | — | — |
| İçerik editörü (`EDITOR`) | ✓ | — | — | — | — |

Her sayfa ve her sunucu işlemi yetkiyi **sunucuda, veritabanındaki oturumla** yeniden denetler; `src/proxy.ts` yalnızca çerezi olmayanları girişe yönlendiren ön kontroldür.

---

## Kurulum (geliştirme)

Gereksinimler: **Node.js 20.9+** (24 ile test edildi), **Docker** (veya erişilebilir bir PostgreSQL 14+).

```bash
# 1) Bağımlılıklar (postinstall Prisma istemcisini üretir)
npm install

# 2) Ortam değişkenleri
cp .env.example .env
#    APP_SECRET'ı değiştirin:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3) PostgreSQL (5440 portunda; test veritabanı oztunc_test de otomatik oluşturulur)
docker compose up -d

# 4) Migration ve seed (SEED_MODE=demo ise açıkça işaretli demo içerik eklenir)
npx prisma migrate dev
npm run db:seed

# 5) İlk yönetici
npm run admin:create -- --email yonetici@ornek.com --name "Ad Soyad"

# 6) Geliştirme sunucusu
npm run dev     # http://localhost:3000  ·  panel: http://localhost:3000/admin
```

> **Windows notu:** Bu projede `dev` ve `build` komutları `--webpack` ile çalışır. Geliştirme makinesinde Windows Application Control, Next.js’in yerel SWC ikilisini engellediği için Turbopack kullanılamıyor; webpack + WASM SWC ile her ortamda aynı şekilde derlenir.

### Demo veri

`SEED_MODE=demo` ve `NODE_ENV` ≠ `production` iken seed; kurgusal **“(Demo)”** markalar, örnek modeller, üretilmiş ve köşesinde **“DEMO GÖRSEL”** yazan çizimler, örnek çalışma saatleri ekler. Tüm bu kayıtlar `isDemo=true` olarak işaretlenir:

- Geliştirmede sitenin üstünde sarı bir “demo veri” uyarısı ve kartlarda **DEMO** etiketi görünür.
- Üretimde (`NODE_ENV=production`) demo ürün, marka, kategori, hizmet ve görseller **hiç gösterilmez**; ürün yapılandırılmış verisi ve sitemap’e de girmez.
- Panelde **Motosikletler → “Demo içeriği sil”** ile tek tıkla temizlenir.

Seed’in temel kısmı her ortamda çalışır ve yalnızca eksik kayıtları ekler: site ayarları, **kapalı** online randevu, kapalı haftalık saatler, doldurulması gereken politika şablonları ve **yayımlanmamış** servis hizmeti taslakları.

---

## Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL bağlantısı. |
| `TEST_DATABASE_URL` | testler | Testlerin kullandığı **ayrı** veritabanı. Testler bu veritabanındaki tabloları boşaltır. `DATABASE_URL` ile aynı olamaz. |
| `APP_SECRET` | ✓ | En az 32 karakter. Form belirteci imzası ve IP özetleri. Üretimde eksikse uygulama hata verir. |
| `SITE_URL` | yayında | Ör. `https://www.oztuncmotor.com`. **Boşken** canonical, mutlak Open Graph adresleri, sitemap URL’leri ve işletme URL’si yayımlanmaz. |
| `STORAGE_DRIVER` | ✓ | `local` (kalıcı diskli sunucu/VPS) veya `s3` (S3 uyumlu depolama). |
| `UPLOAD_DIR` | local | Yerel görsel klasörü (varsayılan `./storage/uploads`). Kalıcı ve yedeklenen bir diskte olmalı. |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | s3 | AWS S3, Cloudflare R2, MinIO vb. `S3_PUBLIC_URL` bucket’ın herkese açık temel adresidir (build sırasında `next/image` izinlerine eklenir). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | bildirim | `SMTP_HOST` boşsa e-posta gönderilmez; bildirimler kuyrukta bekler. |
| `CRON_SECRET` | bildirim | `POST /api/cron/notifications` uç noktası için Bearer anahtarı. |
| `SEED_MODE` | — | `demo` yalnızca geliştirmede demo veri ekler. |
| `SHOW_DEMO_CONTENT` | — | Yalnızca hazırlık (staging) ortamında demo kayıtları “DEMO” etiketiyle göstermek için `true`. Canlı sitede açmayın. |
| `APP_URL` | — | `npm run notifications:retry` betiğinin çağıracağı adres. |

---

## Veritabanı ve migration

```bash
npx prisma migrate dev --name aciklama   # geliştirmede şema değişikliği → yeni migration
npm run db:deploy                        # üretimde bekleyen migration'ları uygular (prisma migrate deploy)
npm run db:seed                          # temel kayıtlar (+ geliştirmede demo)
npx prisma studio                        # veritabanını incelemek için
```

Şema: `prisma/schema.prisma` · Migration’lar: `prisma/migrations/` · Prisma yapılandırması: `prisma.config.ts` · Üretilen istemci: `src/generated/prisma` (git’e eklenmez, `npm install`/`build` sırasında üretilir).

---

## İlk yöneticiyi oluşturma

```bash
npm run admin:create -- --email yonetici@ornek.com --name "Ad Soyad"
```

Parola komut satırına yazılmaz; terminalde gizli olarak sorulur (otomasyonda `ADMIN_PASSWORD` ortam değişkeniyle verilebilir). En az 10 karakter. Aynı komut mevcut bir hesabın parolasını sıfırlar, rolünü `ADMIN` yapar ve açık oturumlarını kapatır. Diğer kullanıcılar panelde **Kullanıcılar** sayfasından eklenir.

Parolalar bcrypt (maliyet 12) ile saklanır. Oturum belirteci yalnızca `httpOnly`, `SameSite=Lax` (üretimde `Secure`) çerezde durur; veritabanında SHA-256 özeti tutulur. Giriş denemeleri IP ve e-posta başına sınırlıdır.

---

## Testler ve kalite kontrolleri

```bash
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm test             # Vitest — TEST_DATABASE_URL gerekir (docker compose ile oluşur)
npm run build        # production derlemesi
npm run test:e2e     # çalışan sunucuda tarayıcı akışları (Chrome gerekir; CHROME_PATH ile yol verilebilir)
```

`npm test` kapsamı:

- **Randevu kapasitesi:** bekleyen talepler kapasiteye dahil, dolu slot reddi, iptalin kapasiteyi serbest bırakması, iptalden geri alma ve zaman değişikliğinde kapasite kontrolü, geçmiş saat/kapalı gün/tatil/yayımlanmamış hizmet reddi.
- **Eşzamanlı talepler:** aynı slota aynı anda gelen 12 talepten tam olarak kapasite kadarının kabulü; iptal + yeni talep yarışı. (Slot kilidi kaldırıldığında bu testin başarısız olduğu doğrulanmıştır.)
- **Başarısız kayıt ve bildirim:** SMTP hatasında randevunun korunması, hata kaydı, geri çekilmeli yeniden deneme, azami denemede `FAILED`, çift gönderim önleme; veritabanı hatasında 500 ve referans verilmemesi; dolu slotta ne randevu ne bildirim oluşması.
- **Yönetici yetkilendirmesi:** rol tablosu, bcrypt, süresi dolmuş/pasif oturumlar, editörün müşteri verisine ve randevu durumuna erişememesi, personelin kullanıcı oluşturamaması, oturumsuz sunucu işlemlerinin veri değiştirmemesi, yükleme ucunun 401 ve içerik tabanlı tür kontrolü.
- **API ve spam:** alan hataları, bal küpü alanı, çok hızlı gönderim, sahte belirteç, IP başına hız sınırı; bilgi talebinin ürün kimliğiyle kaydı.
- Saat dilimi (Europe/Istanbul), slot üretimi, telefon/plaka doğrulaması, katalog URL parametreleri ve teknik özellik gösterimi.

`npm run test:e2e` (sunucu çalışırken): randevu sihirbazı (adım hataları, veri korunması, KVKK zorunluluğu, önceden seçilmemiş pazarlama izni, başarı mesajı + referans), ürün bilgi talebi, filtrelerin URL’ye yazılması, boş durum, karşılaştırma sınırı ve 320 / 375 / 768 / 1440 px’te yatay taşma kontrolü.

---

## Üretime alma

1. Ortam değişkenlerini girin (`NODE_ENV=production`, güçlü `APP_SECRET`, `SITE_URL`, depolama, SMTP, `CRON_SECRET`).
2. `npm ci && npm run db:deploy && SEED_MODE=base npm run db:seed && npm run build && npm start`
3. İlk yöneticiyi oluşturun ve paneldeki **yayın öncesi kontrol listesini** tamamlayın.
4. **Görsel depolama kalıcı olmalı:** sunucusuz platformlarda (Vercel vb.) dosya sistemi kalıcı değildir; `STORAGE_DRIVER=s3` kullanın (Vercel’de `local` sürücü bilinçli olarak hata verir). VPS’te `local` kullanılacaksa `UPLOAD_DIR` kalıcı ve yedeklenen bir diskte olmalı.
5. **Bildirim yeniden denemesi** için zamanlanmış görev kurun (ör. 5 dakikada bir):
   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://ALAN-ADI/api/cron/notifications
   ```
6. Ters vekil (nginx vb.) arkasında `X-Forwarded-For` ve `X-Forwarded-Host` başlıklarını iletin (hız sınırı ve sunucu işlemi köken kontrolü için).

---

## Yayın öncesi eksik işletme bilgileri

Aşağıdakiler henüz verilmedi. Site bunlar girilmeden **çalışmayan bağlantı veya doğrulanmamış iddia göstermez**; hepsi panelden girilir:

| Bilgi | Panelde | Girilmezse sitede |
|---|---|---|
| Telefon | İletişim ve görseller | “Ara” düğmeleri ve telefon bağlantıları gizli |
| WhatsApp numarası | İletişim ve görseller | WhatsApp bağlantıları gizli |
| E-posta (görünür) | İletişim ve görseller | E-posta bağlantısı gizli |
| Bildirim e-postası + SMTP | İletişim ve görseller / ortam değişkenleri | Bildirimler kuyrukta bekler |
| Çalışma saatleri | Çalışma saatleri | Saatler gösterilmez; “sitede göster” işaretlenince görünür |
| Online randevu | Çalışma saatleri → “Online randevu açık” | Randevu sayfası “şu anda kapalı” der ve iletişim bilgilerini gösterir |
| Gerçekte verilen servis hizmetleri | Servis hizmetleri (taslak olarak hazır) | Hizmet listesi gösterilmez, randevu kapalı kalır |
| Satılan markalar ve ürünler | Markalar / Motosikletler | Katalog boş durum gösterir |
| Yetkili satıcı/servis olunan markalar | Markalar → “doğrulandı” işaretleri | Hiçbir yetki iddiası yazılmaz |
| Logo | İletişim ve görseller | “ÖZTUNÇ MOTOR” yazı logosu kullanılır |
| Hero, servis ve işletme fotoğrafları | İletişim ve görseller | İlgili görsel alanları olmadan düzen korunur |
| Alan adı | `SITE_URL` | Canonical, sitemap URL’leri ve mutlak OG adresleri yayımlanmaz |
| Politika metinlerindeki `[[…]]` alanları (ticari unvan, KVKK başvuru adresi, hizmet sağlayıcılar, saklama süresi, tarih) | Politika metinleri | Sitede sarı vurgulu ve “taslak” uyarılı görünür |
| Koordinatlar (isteğe bağlı) | İletişim ve görseller | Yapılandırılmış veride konum yer almaz |

Kuruluş yılı, müşteri sayısı, ödül veya Google puanı hiçbir yerde kullanılmamıştır; tanıtım metni düzenlenirken de doğrulanmamış bu tür bilgiler eklenmemelidir. Politika metinlerinin yayından önce hukuki olarak kontrol edilmesi önerilir.

---

## Mimari notlar

- **Kapasite ve eşzamanlılık:** Randevu oluşturma, durum değiştirme ve zaman değiştirme; slot başına PostgreSQL `pg_advisory_xact_lock` alınan bir transaction içinde iptal edilmemiş randevuları sayar. Aynı slota gelen eşzamanlı istekler sıraya girer, farklı slotlar birbirini beklemez. Slot geçerliliği (geçmiş saat, kapalı gün, tatil, mola, ileri tarih sınırı) her zaman sunucuda yeniden doğrulanır.
- **Saat dilimi:** Takvim günleri ve saatler Europe/Istanbul yerel değerleri olarak saklanır (`slotDate`, `slotTime`), anlık zaman UTC (`slotStart`). Dönüşümler `src/lib/time.ts` içinde `Intl` ile yapılır.
- **Bildirimler (outbox):** Bildirim kaydı randevu/talep ile aynı transaction’da yazılır; e-posta yanıt sonrasında (`after`) ve cron ile gönderilir. Hata mesajı, deneme sayısı ve bir sonraki deneme zamanı saklanır; panelden tek tek yeniden denenebilir. WhatsApp bağlantıları yalnızca sohbet açar; otomatik WhatsApp bildirimi yoktur ve gönderilmiş gibi gösterilmez (eklenmesi ayrı bir WhatsApp Business API entegrasyonu gerektirir).
- **Formlar:** Zod ile sunucu doğrulaması; IP özeti başına veritabanı tabanlı hız sınırı (çoklu sunucuda tutarlı); bal küpü alanı; HMAC imzalı form belirteciyle asgari doldurma süresi. KVKK aydınlatma onayı ile pazarlama izni ayrı alanlardır; pazarlama izni önceden seçili değildir. Ürün, randevu ve talepler yalnızca veritabanında tutulur (tarayıcıda yalnızca karşılaştırma seçimi saklanır).
- **Görseller:** Yüklemede boyut (10 MB), bildirilen tür ve gerçek içerik (sharp) kontrol edilir; EXIF yönü düzeltilir, büyütülmeden en fazla 2560 px’e indirilip WebP’ye çevrilir. Ürün görselleri `object-contain`, atmosfer fotoğrafları `object-cover`; gösterim genişliği görselin kendi genişliğiyle sınırlandırılarak düşük çözünürlüklü görsel büyütülmez.
- **Önbellek:** İçerik panelden değiştiği için herkese açık sayfalar her istekte güncel veriyle oluşturulur; paneldeki değişiklikler sitede hemen görünür.
- **Erişilebilirlik:** “İçeriğe geç” bağlantısı, görünür odak halkası, etiketli form alanları ve alan yanında `aria-describedby` hata mesajları, klavyeyle kullanılabilen menü/filtre paneli (Escape ile kapanır), `prefers-reduced-motion` desteği.

### Klasör yapısı

```
prisma/              şema, migration'lar, seed, demo çizim üreticisi, politika şablonları
scripts/             admin:create, bildirim yeniden deneme, e2e ve ekran görüntüsü araçları
src/app/(site)/      herkese açık sayfalar
src/app/admin/       giriş, panel sayfaları ve sunucu işlemleri (actions/)
src/app/api/         randevu, bilgi talebi, uygunluk, yükleme, cron uç noktaları
src/components/      site, katalog, form ve panel bileşenleri
src/lib/             ortak (istemci+sunucu) yardımcılar: zaman, slotlar, doğrulama, katalog, SEO, yetkiler
src/server/          yalnızca sunucu: auth, randevular, bildirimler, depolama, güvenlik, sorgular
tests/               Vitest testleri
```
