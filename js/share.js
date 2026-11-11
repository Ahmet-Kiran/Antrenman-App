"use strict";

/* ---------- Paylaşma: şablon ve haftalık plan bağlantıları ---------- */
const b64e = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = x => JSON.parse(decodeURIComponent(escape(atob(x.replace(/-/g, "+").replace(/_/g, "/")))));
const shareUrl = (kind, obj) => `${location.origin}${location.pathname}#${kind}=${b64e(obj)}`;
async function shareLink(title, url) {
  if (isNative()) { toast("Bağlantıyla paylaşma yalnızca web sürümünde çalışır. Yedek dosyasıyla taşıyabilirsin."); return; }
  if (navigator.share) { try { await navigator.share({ title, text: title, url }); return; } catch (e) { if (e.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(url); toast("Bağlantı kopyalandı, mesajla gönderebilirsin"); } catch { prompt("Bağlantıyı kopyala:", url); }
}
function parseShare(str) {
  const m = (str || "").match(/[#?&]?([pw])=([A-Za-z0-9_-]+)/); if (!m) return null;
  try { return { kind: m[1], data: b64d(m[2]) }; } catch { return null; }
}
/* Gönderen: paylaşmadan önce adını sor, bağlantıya ekle */
function openShareSheet(kind, id) {
  const t = kind === "p" ? S.presets.find(x => x.id === id) : null; if (kind === "p" && !t) return;
  ui.shareReq = { kind, id };
  const what = t ? `"${esc(t.name)}" şablonu · ${t.ids.length} hareket` : `Haftalık plan · ${ORDER.map(d => SHORT[d] + " " + TYPES[S.plan[d].type][0]).join(" ")}`;
  showSheet(`<h3>Paylaş</h3><div class="card sharebox"><small>Paylaşılacak</small><b>${what}</b></div>
    <div class="field"><label for="shName">Arkadaşın bunu kimden geldiğini görsün: adın</label><input id="shName" type="text" maxlength="40" value="${esc(prof().name || "")}" placeholder="Örn. Elif"></div>
    <small>Adın bağlantının içine eklenir, başka hiçbir bilgin gönderilmez.</small>
    <div class="hist-actions"><button class="btn pri" data-act="sharego">Bağlantıyı paylaş</button><button class="btn ghost" data-act="closesheet">Vazgeç</button></div>`);
}
function shareGo() {
  const r = ui.shareReq; if (!r) return;
  const from = ($("#shName")?.value || "").trim().slice(0, 40);
  if (from && !prof().name) { S.profile.name = from; save(); }
  closeSheet();
  if (r.kind === "p") { const p = S.presets.find(x => x.id === r.id); if (!p) return; return shareLink(`${from ? from + " seninle bir antrenman şablonu paylaştı" : "Antrenman şablonu"}: ${p.name}`, shareUrl("p", { n: p.name, t: p.type, i: p.ids, ...(from ? { f: from } : {}) })); }
  const w = {}; for (const d in S.plan) w[d] = { t: S.plan[d].type, i: S.plan[d].ids };
  return shareLink(from ? `${from} seninle haftalık antrenman planını paylaştı` : "Haftalık antrenman planı", shareUrl("w", { w, ...(from ? { f: from } : {}) }));
}
/* Alıcı: kimden geldiğini ve içeriği gösteren pencere */
function openShared(sh) {
  if (!sh) { toast("Geçerli bir paylaşım bağlantısı değil"); return false; }
  const from = String(sh.data.f || "").slice(0, 40), who = from ? `<b>${esc(from)}</b>` : "Bir arkadaşın";
  let body;
  if (sh.kind === "p") {
    const ids = (sh.data.i || []).filter(id => BY_ID.has(id)), name = String(sh.data.n || "Paylaşılan şablon").slice(0, 60);
    if (!ids.length) { toast("Bu şablonda geçerli hareket yok"); return false; }
    ui.shared = { kind: "p", from, name, type: sh.data.t === "e" ? "e" : "g", ids };
    body = `<div class="card sharebox"><small>${TYPES[ui.shared.type]} şablonu · ${ids.length} hareket</small><b>${esc(name)}</b><small>${esc(brief(ids))}</small></div>
      <div class="hist-actions"><button class="btn pri" data-act="sharedok">Şablonlarıma ekle</button><button class="btn ghost" data-act="closesheet">Vazgeç</button></div>`;
  } else {
    const w = sh.data.w || {}, plan = {};
    for (let d = 0; d < 7; d++) { const x = w[d] || {}; plan[d] = { type: ["g", "e", "r"].includes(x.t) ? x.t : "r", ids: (x.i || []).filter(id => BY_ID.has(id)) }; }
    ui.shared = { kind: "w", from, plan };
    body = `<div class="card sharebox">${ORDER.map(d => `<div class="item"><span>${DAYS[d]}</span><small>${TYPES[plan[d].type]}${plan[d].ids.length ? ` · ${plan[d].ids.length} hareket` : ""}</small></div>`).join("")}</div>
      <small>Kayıtların ve şablonların silinmez, sadece haftalık plan değişir.</small>
      <div class="hist-actions"><button class="btn pri" data-act="sharedok">Planımı bununla değiştir</button><button class="btn ghost" data-act="closesheet">Vazgeç</button></div>`;
  }
  showSheet(`<div class="sharefrom"><span class="avatar" aria-hidden="true">${from ? esc(from[0].toLocaleUpperCase("tr-TR")) : "👤"}</span><div>${who} seninle ${sh.kind === "p" ? "bir şablon" : "haftalık planını"} paylaştı</div></div>${body}`);
  return true;
}
function acceptShared() {
  const x = ui.shared; if (!x) return; ui.shared = null; closeSheet();
  if (x.kind === "p") { S.presets.push({ id: "c-" + Date.now(), name: uniqueName(x.name), type: x.type, ids: x.ids, ...(x.from ? { from: x.from } : {}) }); save(); toast(`"${x.name}" şablonlarına eklendi`); return; }
  S.plan = x.plan; save(); toast(x.from ? `${x.from} adlı kişinin planı uygulandı` : "Haftalık plan güncellendi");
}
function handleHash() {
  if (!/^#[pw]=/.test(location.hash)) return;
  const sh = parseShare(location.hash); history.replaceState(null, "", location.pathname + location.search); render(); openShared(sh);
}
