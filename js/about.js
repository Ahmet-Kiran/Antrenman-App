"use strict";
/* ---------- Hakkında, gizlilik ve sağlık uyarısı (Profilim içinde) ---------- */
function fillVersion() {
  const el = $("#appver"); if (!el || !window.caches) return;
  caches.keys().then(ks => { const v = ks.map(k => /^antrenman-v(\d+)$/.exec(k)).filter(Boolean).map(m => +m[1]).sort((a, b) => b - a)[0]; if (v && $("#appver")) $("#appver").textContent = "Antrenman Programım · Sürüm " + v; }).catch(() => {});
}
const secAbout = () => { setTimeout(fillVersion, 0);
  return `<details class="card fold" data-fold="about" ${ui.open.about ? "open" : ""}><summary><h3>Hakkında ve gizlilik</h3></summary>
  <p><b id="appver">Antrenman Programım</b></p>
  <p><b>Verilerin sende kalır.</b> Kayıtların yalnızca bu cihazdaki tarayıcının hafızasında durur. Hesap, sunucu ya da izleme yoktur, kimse verini göremez. Bu yüzden cihaz değişirse ya da tarayıcı verisi silinirse kayıtlar kaybolur. Düzenli yedek al (Program sekmesi → Yedeği indir).</p>
  <p><b>Sağlık uyarısı.</b> Uygulamadaki egzersiz, kalori ve beslenme bilgileri genel bilgidir, tıbbi tavsiye yerine geçmez. Sağlık sorunun varsa, hamileysen ya da ilaç kullanıyorsan başlamadan önce doktoruna danış. Ağrı hissedersen dur.</p>
  <p><b>Güvenlik.</b> Yedek dosyası yüklerken yalnızca güvendiğin kaynaktan gelen dosyaları kullan. Uygulama, yüklenen verinin yalnızca bilinen alanlarını alır.</p></details>`; };
