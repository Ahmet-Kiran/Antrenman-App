"use strict";
/* ---------- Esnek kullanım: set sayısı, kısa antrenman, kısmen yapıldı, bugün farklı yaptım, boş günler ---------- */
const setCount = () => Math.min(5, Math.max(1, +prof().sets || 3));
const setsFor = d => d && d.short ? Math.min(setCount(), 2) : setCount();
const SHORT_N = 5;
function shortIds(ids) {                                  // kısa antrenman: önce ana hareketler, en çok 5 hareket, sıra korunur
  const ana = ids.filter(id => BY_ID.get(id)?.role === "ana"), pick = new Set([...ana, ...ids.filter(id => !ana.includes(id))].slice(0, SHORT_N));
  return ids.filter(id => pick.has(id));
}
function partialOf(d, k) {                                // gün bitmemiş ama planlı hareketlerin yarısı ya da fazlası girilmiş
  if (!d || d.done || d.partial === false) return null;               // partial: true = elle "kısmen", false = elle "yapmadım", boş = otomatik
  const ids = programIds(d, planOf(k)), n = ids.filter(id => ((d.sets || {})[id] || []).some(x => +x > 0)).length;
  return d.partial === true || (ids.length && n >= Math.ceil(ids.length / 2)) ? [n, ids.length] : null;
}
const isPartial = k => !!(S.days[k] && partialOf(S.days[k], k));

function heroOpts(d, k, type, ids) {
  const part = partialOf(d, k), kn = k === today ? "Bugün" : "Bu gün";
  return `<div class="hero-opts">${d.alt ? `<span class="pill">📌 ${esc(d.alt.label)}</span>` : ""}${part ? `<span class="pill">🌗 Kısmen yapıldı · ${part[0]}/${part[1]}</span>` : ""}`
    + `${type !== "r" || ids.length ? `<button class="btn" data-act="shorttoggle" aria-pressed="${!!d.short}">${d.short ? "⚡ Kısa antrenman açık" : "⚡ Kısa antrenman"}</button>` : ""}`
    + `<button class="btn" data-act="altmenu">🔄 ${kn} farklı yaptım</button></div>`;
}
function openAltMenu() {
  const k = ui.date, d = working(k), kn = k === today ? "Bugün" : "Bu gün";
  showSheet(`<h3>${kn} farklı yaptım</h3><small>Haftalık planına dokunmaz, sadece bu günü değiştirir.</small>
    <h4 style="margin:12px 0 6px">Haftanın bir gününün planı</h4>
    <div class="row">${[1, 2, 3, 4, 5, 6, 0].map(wd => { const p = S.plan[wd]; return `<button class="btn" data-act="altday" data-wd="${wd}">${DAYS[wd]} · ${TYPES[p.type]}${p.ids.length ? ` (${p.ids.length})` : ""}</button>`; }).join("")}</div>
    <h4 style="margin:12px 0 6px">Başka bir seçenek</h4>
    <div class="row"><button class="btn" data-act="altpick">📋 Şablonlardan seç</button><button class="btn" data-act="altown">✍️ Kendi hareketlerimi seçeyim</button><button class="btn" data-act="altact">🏃 Başka bir aktivite yaptım</button><button class="btn" data-act="altrest">🛌 Dinlenme günü yaptım</button></div>
    ${d.alt ? `<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="altoff">Planıma dön</button></div>` : ""}
    <div class="hist-actions"><button class="btn" data-act="closesheet">Kapat</button></div>`);
}
function setAlt(k, alt) {
  const d = edit(k);
  if (alt) { d.alt = alt; d.type = alt.type; } else { delete d.alt; d.type = S.plan[parse(k).getDay()].type; }
  delete ui.fi[k]; delete ui.cel[k + "m"]; refreshBar(); closeSheet();
  if (ui.altGo) { ui.altGo = false; ui.tab = "b"; ui.from = "t"; }
  toast(alt ? `${alt.label} bu güne uygulandı` : "Planına dönüldü");
}
function applyAlt(k, id) { const t = tplById(id); if (t) setAlt(k, { type: t.type, ids: [...t.ids], label: t.name }); }
function toggleShort() {
  const d = edit(ui.date); d.short = !d.short; if (!d.short) delete d.short;
  delete ui.fi[ui.date]; delete ui.cel[ui.date + "m"];
  toast(d.short ? `Kısa antrenman: en çok ${SHORT_N} hareket, ${setsFor(d)} set. Bitirince gün yapıldı sayılır.` : "Tam antrenmana dönüldü");
}
function logCaption(items, unit) {                        // kayıt girilmeyen günler "–" olarak kalır, ortalama sadece kayıtlı günlerden hesaplanır
  const got = items.filter(i => i[1] > 0); if (!got.length) return "";
  const avg = Math.round(got.reduce((a, i) => a + i[1], 0) / got.length * 10) / 10;
  return `<small style="display:block;margin-top:4px">${got.length}/${items.length} gün kayıt · kayıtlı günlerin ortalaması ${avg} ${unit}${got.length < items.length ? " · – işareti: kayıt girilmedi" : ""}</small>`;
}
