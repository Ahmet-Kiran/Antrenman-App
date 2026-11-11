"use strict";
/* ---------- Android uygulaması (APK) uyumu: dosya kaydetme ve geri tuşu ---------- */
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
async function saveOut(name, text) {                         // APK'da dosyayı önbelleğe yazıp Android paylaşım menüsünü açar (Drive, Dosyalar, WhatsApp...)
  if (!isNative()) return false;
  const P = window.Capacitor.Plugins || {};
  if (!P.Filesystem || !P.Share) return false;
  try {
    const w = await P.Filesystem.writeFile({ path: name, data: text, directory: "CACHE", encoding: "utf8" });
    await P.Share.share({ title: name, url: w.uri, dialogTitle: "Dosyayı kaydet ya da gönder" });
    return true;
  } catch (e) { if (/cancel/i.test(String(e && e.message || e))) return "cancel"; toast("Dosya kaydedilemedi, tekrar dene"); return "fail"; }
}
function onBackButton() {                                    // Android geri tuşu: önce açık panel, sonra Antrenman sekmesi, en son çıkış
  const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if ($("#sheet").classList.contains("open")) return closeSheet();
  if (!$("#profile").hidden) return closeProfile();
  if (ui.date !== today) { leaveDraft(); ui.date = today; ui.tab = "b"; return render(); }
  if (ui.tab !== "b") { ui.tab = "b"; return render(); }
  if (A && A.exitApp) A.exitApp();
}
function initNative() {
  if (!isNative()) return;
  const A = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (A && A.addListener) A.addListener("backButton", onBackButton);
}
