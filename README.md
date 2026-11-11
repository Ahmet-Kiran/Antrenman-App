# Antrenman Programım

Evde ve ekipmanla antrenman takibi için kurulum gerektirmeyen bir web uygulaması (PWA). **Hesap yok, sunucu yok, izleme yok:** kayıtların yalnızca kendi cihazında kalır. Telefona ya da bilgisayara uygulama gibi kurulur, internetsiz de çalışır.

> **Canlı uygulama:** *(yayınladıktan sonra adresi buraya yaz, örn. `https://KULLANICI-ADIN.github.io/DEPO-ADIN/`)*

## Neler var?
- **Haftalık plan** ve güne dokununca hareketleri görme, ekleme, çıkarma
- **148 hareket:** güç, kardiyo, ısınma, soğuma ve esneme; ekipman ve dikkat (diz, bel, omuz, bilek) filtreleri; hareket başına açıklama
- **Şablonlar:** kendi şablonların, amaca göre (yağ yakımı, kas, güç, genel form) hazır öneriler, kendi programını hazırlarken tüyolar
- **Isınma ve soğuma paketleri:** günlük ya da planda sürekli değiştirilebilir
- **Esnek kullanım:** "Kısmen yaptım", "Kısa antrenman", "Bugün farklı yaptım" (kendi hareketlerin ya da başka bir aktivite), "Haftayı doldur"
- **İlerleme:** kilo, bel, kalori, protein, su, adım; grafikler, takvim, ısı haritası, seri
- **Tahmini kalori ve protein hedefi**, set sayısı ayarı
- **Yedek:** tek dosyayla yedekleme ve geri yükleme, "geri al" kopyası, CSV dışa aktarma
- Açık/koyu tema, çevrimdışı çalışma

## Kurulum (kullanıcılar için)
- **iPhone:** Safari'de aç → Paylaş → **Ana Ekrana Ekle**
- **Android:** Chrome'da aç → ⋮ menüsü → **Uygulamayı yükle**
- **Bilgisayar:** Chrome ya da Edge'de adres çubuğundaki **Yükle** simgesi

## Gizlilik ve yedek
Kayıtlar tarayıcının hafızasında (localStorage) tutulur ve **cihazından dışarı çıkmaz**. Bu yüzden cihaz değiştirirsen ya da tarayıcı verisini silersen kayıtlar kaybolur. Düzenli yedek al: **Program → Yedeği indir**. Yedeği geri yüklemek için **Profilim → Ayarlar**. Yedek dosyaları kilo ve ölçü gibi kişisel bilgi içerir, başkalarıyla paylaşırken dikkat et.

Dışarıya yalnızca iki durumda bağlantı olur: bir harekete YouTube videosu bağlarsan (gizlilik dostu `youtube-nocookie.com` gömmesi) ve "nasıl yapılır" araması için açılan YouTube bağlantısı.

## Sağlık uyarısı
Uygulamadaki egzersiz, kalori ve beslenme bilgileri **genel bilgidir, tıbbi tavsiye yerine geçmez**. Sağlık sorunun varsa, hamileysen ya da ilaç kullanıyorsan başlamadan önce doktoruna danış. Ağrı hissedersen dur. Kalori ve protein hedefleri yaklaşık tahmindir.

## Geliştirme
Derleme adımı yok, saf HTML + CSS + JS.

```bash
# Yerel sunucu (index.html'e çift tıklamak çevrimdışı modu çalıştırmaz)
python -m http.server 8000      # ya da VS Code "Live Server"
# Testler (gerçek tarayıcıda masaüstü ve telefon boyutu)
npm install
npx playwright install chromium
npm test
```

Klasörler: `js/` uygulama kodu (her dosyanın başında ne yaptığı yazar), `exercise-data.js` temel hareketler, `exercise-extra.js` ek hareketler (ısınma, soğuma, kardiyo, bölgesel), `exercise-tags.js` ekipman ve dikkat etiketleri, `tests/e2e.js` uçtan uca testler.

**Sürüm çıkarırken kural:** `sw.js` içindeki `antrenman-vNN` sürümünü **artır**. Artırmazsan kullanıcılar eski önbellekteki sürümde kalabilir. Yeni bir `js` dosyası eklersen hem `index.html` hem `sw.js` içindeki `FILES` listesine ekle.

**Veri kuralları:** Hareket `id` değerlerini ve `antrenman.v2` anahtarını değiştirme (kayıtlar buna bağlı). Yeni alan eklersen `js/safe.js` içindeki temizleyiciye de ekle, yoksa yedekten yüklemede kaybolur (testler bunu yakalar).

## Güvenlik
İçerik güvenlik politikası (CSP), içe aktarılan verinin temizlenmesi ve kötü niyetli yedek/bağlantı testleri var. Açık bulursan bkz. [SECURITY.md](SECURITY.md).

## Katkı
Hata bildirimleri ve öneriler için "Issues"u kullanabilirsin. Değişiklik önerirken `npm test`in geçtiğinden emin ol.

## Lisans
[MIT](LICENSE) © 2026 Ahmet-Kiran
