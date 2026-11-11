"use strict";

/* ---------- Ölçüm girişi (İlerleme sekmesinin en üstünde) ---------- */
function entryCard() {
  const k = ui.mDate, m = S.metrics[k] || {}, c = S.calories[k], nu = nutOf(k), has = !!(S.metrics[k] || c || S.nutrition[k]);
  const prevK = Object.keys(S.metrics).filter(x => x < k && S.metrics[x].weight).sort().at(-1), lastW = prevK ? S.metrics[prevK].weight : null;
  const inp = (id, label, val, extra) => `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-ent="1" type="number" min="0" ${extra} value="${val ?? ""}"></div>`;
  return `<section class="card entry" id="entry"><div class="entry-h"><h3>Ölçüm ve beslenme</h3><span id="entrysave" class="savedchip" aria-live="polite"></span></div>
    <div class="edate"><span>Gün</span><input type="date" data-act="mdate" value="${k}" max="${today}" aria-label="Kayıt tarihi">${k !== today ? `<button class="linkbtn" data-act="mtoday">Bugüne dön</button>` : ""}</div>
    <div class="egroup"><b>Vücut</b><div class="grid2">${inp("weight", "Kilo (kg)", m.weight, `step="0.1" inputmode="decimal" placeholder="${lastW ?? ""}"`)}${inp("waist", "Bel (cm)", m.waist, `step="0.1" inputmode="decimal"`)}</div></div>
    <div class="egroup"><b>Beslenme</b><div class="grid3">${inp("cal", "Kalori", c, `inputmode="numeric" placeholder="kcal"`)}${inp("protein", "Protein (g)", nu.protein, `inputmode="numeric"`)}${inp("water", "Su (bardak)", nu.water, `step="0.5" inputmode="decimal" placeholder="200 ml"`)}</div></div>
    <div id="entrysum">${entrySummary(k)}</div>
    <div class="entry-f"><small>Yazdıkça kendiliğinden kaydedilir.</small><button class="linkbtn" id="entrydel" data-act="delmetric" ${has ? "" : "hidden"}>Bu günü sil</button></div></section>`;
}
function entrySummary(k) {
  const m = S.metrics[k] || {}, c = S.calories[k], nu = nutOf(k), t = calTarget(), pt = proteinTarget(), wt = waterTarget();
  const prevK = Object.keys(S.metrics).filter(x => x < k && S.metrics[x].weight).sort().at(-1), lastW = prevK ? S.metrics[prevK].weight : null;
  const delta = m.weight && lastW ? Math.round((m.weight - lastW) * 10) / 10 : null;
  const chip = (icon, v, goal, unit, over) => `<span class="nchip${over ? " over" : ""}"><i style="width:${goal ? Math.min(100, (v || 0) / goal * 100) : 0}%"></i><span>${icon} ${v ?? "–"}${goal ? ` / ${goal}` : ""} ${unit}</span></span>`;
  const low = c > 0 && c < calFloor(prof()) ? `<small style="display:block">Girdiğin kalori genel alt sınırın (${calFloor(prof())} kcal) altında. Bunu alışkanlık yapma; endişen varsa bir diyetisyenle konuş.</small>` : "";
  return `<div class="nchips">${chip("🔥", c, t, "kcal", c && t && c > t * 1.1)}${chip("🥩", nu.protein, pt, "g")}${chip("💧", nu.water, wt, "bardak")}</div>
    <small style="display:block">${delta !== null ? `<b class="${delta < 0 ? "up" : delta > 0 ? "dn" : ""}">${delta > 0 ? "+" : ""}${delta} kg</b> önceki ölçüme göre · ` : lastW ? `Son kilon ${lastW} kg · ` : ""}Hedefler yaklaşık tahmindir.${t ? "" : ` <button class="linkbtn" data-act="openprofile">Kalori hedefi için profilini doldur →</button>`}</small>${low}`;
}
/* Otomatik kaydet: yazmayı bırakınca (0,7 sn) ya da başka yere dokununca kaydeder; boş bırakılan alan o gün için silinir. */
let entryTimer = null, entryFade = null;
function entryStatus(txt) { const el = $("#entrysave"); if (!el) return; el.textContent = txt; clearTimeout(entryFade); if (txt.startsWith("✓")) entryFade = setTimeout(() => { el.textContent = ""; }, 2500); }
function entryTyped() { entryStatus("Kaydediliyor…"); clearTimeout(entryTimer); entryTimer = setTimeout(saveEntry, 700); }
function flushEntry() { if (entryTimer) saveEntry(); }
function saveEntry() {
  clearTimeout(entryTimer); entryTimer = null;
  if (!$("#weight")) return;                                                  // kart ekranda değil
  const k = ui.mDate, num = (id, int) => { const v = $("#" + id).value.trim(), x = int ? parseInt(v, 10) : parseFloat(v); return x > 0 ? x : null; };
  const w = num("weight"), wa = num("waist"), cal = num("cal", 1), pr = num("protein", 1), wt = num("water");
  const keep = (o, drop) => { const r = { ...(o || {}) }; drop.forEach(x => delete r[x]); return r; };
  const met = { ...keep(S.metrics[k], ["weight", "waist"]), ...(w ? { weight: w } : {}), ...(wa ? { waist: wa } : {}) };
  Object.keys(met).length ? S.metrics[k] = met : delete S.metrics[k];
  cal ? S.calories[k] = cal : delete S.calories[k];
  const nut = { ...keep(S.nutrition[k], ["protein", "water"]), ...(pr ? { protein: pr } : {}), ...(wt ? { water: wt } : {}) };
  Object.keys(nut).length ? S.nutrition[k] = nut : delete S.nutrition[k];
  save();
  const sum = $("#entrysum"); if (sum) sum.innerHTML = entrySummary(k);
  const del = $("#entrydel"); if (del) del.hidden = !(S.metrics[k] || S.calories[k] || S.nutrition[k]);
  entryStatus("✓ Kaydedildi");
  setTimeout(() => { const a = document.activeElement; if (ui.tab === "t" && !(a && a.closest && a.closest("#entry"))) render(); }, 900);   // grafikler güncellensin
}
