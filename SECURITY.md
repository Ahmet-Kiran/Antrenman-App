# Güvenlik

Antrenman Programım tamamen tarayıcıda çalışır. Sunucusu, hesabı ve veritabanı yoktur; kayıtlar kullanıcının kendi cihazında (localStorage) durur.

## Bir açık bulursan
Lütfen açığı herkese açık bir "issue" olarak yazma. Bunun yerine bu deponun **Security** sekmesinden **Report a vulnerability** ile özel olarak bildir. Mümkünse nasıl yeniden üretileceğini kısaca yaz.

## Mevcut korumalar
- İçerik güvenlik politikası (CSP): yalnızca uygulamanın kendi betikleri çalışır, dışarıdan eklenen betik engellenir.
- İçe aktarılan yedek dosyaları `cleanState` ile temizlenir: yalnızca bilinen alanlar, doğru tiplerde ve sınırlar içinde alınır.
- Paylaşım bağlantıları (`#p=`, `#w=`) içe aktarılmadan önce doğrulanır: bilinmeyen hareketler atılır, metinler kaçışlanır.
- Testler (`npm test`), kötü niyetli yedek ve bağlantı denemelerini de içerir.

## Desteklenen sürüm
Yalnızca en güncel sürüm desteklenir.
