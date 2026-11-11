"use strict";

/* ---------- Profilim ---------- */
const TAGS = window.EXERCISE_TAGS || {}, ALT_FOR = window.EXERCISE_ALT || {};
const EQ = { bar: "Barfiks barı", dumbbell: "Dambıl", chair: "Sağlam sandalye", table: "Sağlam masa", bag: "Sırt çantası", treadmill: "Yürüme bandı" };
const CAUTION = { bel: "Bel", diz: "Diz", omuz: "Omuz", bilek: "Bilek" };
const GOALS = { lose: "Kilo vermek", muscle: "Kas kazanmak", strength: "Güçlenmek", general: "Genel kondisyon" };
const REPS = { lose: "12–15 tekrar", muscle: "8–12 tekrar", strength: "5–8 tekrar (zorlaştırılmış)", general: "10–15 tekrar" };
const prof = () => S.profile;
const hasWeight = () => Object.values(S.metrics).some(m => m.weight);
const fitOnly = () => ui.fit ?? !!prof().onboarded;
function calcTarget(p, kg) {                               // Mifflin-St Jeor + hafif aktivite katsayısı
  if (!(p.age > 0 && p.height > 0 && (p.sex === "k" || p.sex === "e"))) return null;
  const bmr = 10 * kg + 6.25 * p.height - 5 * p.age + (p.sex === "e" ? 5 : -161);
  const gDays = Object.values(S.plan).filter(x => x.type === "g").length, st = p.steps || 6000;
  const tdee = bmr * (1.2 + 0.04 * gDays + (st >= 8000 ? 0.05 : st >= 5000 ? 0.02 : 0));
  const adj = { lose: 0.85, muscle: 1.1, strength: 1.05, general: 1 }[p.goal] ?? 1;
  const raw = Math.round(tdee * adj / 10) * 10, floor = p.sex === "e" ? 1500 : 1200;      // genel güvenli alt sınır
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.max(raw, floor), floored: raw < floor };
}
const calTarget = () => { const p = prof(); if (p.calManual && p.cal > 0) return p.cal; const c = calcTarget(p, weightOn(today)); return c ? c.target : null; };
function missing(m) {                                      // eksik ekipman etiketleri
  const t = TAGS[m.id]; if (!t || !prof().onboarded) return [];
  return t.equip.filter(r => !r.split("|").some(k => (prof().equip || {})[k])).map(r => r.split("|").map(k => EQ[k]).join(" / "));
}
function fitIds(ids) {                                    // eksik ekipmanlı hareketi alternatifiyle değiştir, yoksa çıkar
  const ok = id => BY_ID.has(id) && !missing(BY_ID.get(id)).length, out = [];
  for (const id of ids) { const pick = ok(id) ? id : (ALT_FOR[id] || []).find(ok); if (pick && !out.includes(pick)) out.push(pick); }
  return out;
}
const starterIds = type => fitIds(Object.values(defaultPlan()).find(x => x.type === type)?.ids || []);
function fittedPlan() { const p = defaultPlan(); for (const d in p) p[d].ids = fitIds(p[d].ids); return p; }
const cautions = m => { const t = TAGS[m.id], mine = prof().cautions || []; return t ? t.risk.filter(r => mine.includes(r)) : []; };
const badges = m => [...missing(m).map(x => `Eksik: ${x}`), ...cautions(m).map(c => `⚠ ${CAUTION[c]}`)];
const repHint = m => (m.role !== "esneme" && m.unit === "tekrar" && REPS[prof().goal]) ? REPS[prof().goal] : "";
const bdgHtml = m => badges(m).map(b => `<span class="bdg">${esc(b)}</span>`).join("");

const opt = (attr, key, label, on) => `<label class="opt"><input type="checkbox" ${attr}="${key}" ${on ? "checked" : ""}><span>${label}</span></label>`;
const secPersonal = p => `<section class="card"><h3>Kişisel bilgiler</h3>
  <div class="field"><label>Ad (isteğe bağlı)</label><input id="pf-name" type="text" value="${esc(p.name || "")}"></div>
  <div class="grid2"><div class="field"><label>Yaş</label><input id="pf-age" type="number" inputmode="numeric" value="${p.age || ""}"></div>
  <div class="field"><label>Cinsiyet</label><select id="pf-sex"><option value="">Seç</option><option value="k" ${p.sex === "k" ? "selected" : ""}>Kadın</option><option value="e" ${p.sex === "e" ? "selected" : ""}>Erkek</option></select></div></div>
  <div class="grid2"><div class="field"><label>Boy (cm)</label><input id="pf-height" type="number" inputmode="numeric" value="${p.height || ""}"></div>
  <div class="field"><label>Kilo</label><div class="row"><b>${hasWeight() ? weightOn(today) + " kg" : "Girilmedi"}</b><button class="btn" data-act="profweight">Kilo ekle</button></div></div></div>
  <small>Boş bırakabilirsin. Yaş, cinsiyet ve boy yalnızca günlük kalori hedefini hesaplamak için kullanılır.</small></section>`;
const secGoal = p => { const kg = weightOn(today), tw = p.targetWeight; return `<section class="card"><h3>Hedef</h3>
  <div class="field"><label>Ana hedefin</label><select id="pf-goal"><option value="">Seç</option>${Object.entries(GOALS).map(([k, v]) => `<option value="${k}" ${p.goal === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
  <div class="field"><label>Hedef kilo (kg, isteğe bağlı)</label><input id="pf-tw" type="number" step="0.1" inputmode="decimal" value="${tw || ""}"></div>
  ${tw && hasWeight() ? `<small>Şu an ${kg} kg · ${Math.abs(Math.round((kg - tw) * 10) / 10)} kg ${kg > tw ? "vermen" : kg < tw ? "alman" : "gerekmiyor, hedeftesin"}${kg === tw ? "" : " gerekiyor"}.</small>` : ""}</section>`; };
const secEquip = p => `<section class="card"><h3>Ekipmanım</h3><small>Başlangıç planın sadece elindeki ekipmanla yapılabilen hareketlerden kurulur.</small>
  <div class="grid2" style="margin-top:8px">${Object.entries(EQ).map(([k, v]) => opt("data-eq", k, v, (p.equip || {})[k])).join("")}</div>
  <div class="field"><label>Dambıl ağırlığı (kg, isteğe bağlı)</label><input id="pf-db" type="number" step="0.5" inputmode="decimal" value="${p.dumbbellKg || ""}"></div></section>`;
const secCaution = p => `<section class="card"><h3>Dikkat notları <small>(isteğe bağlı)</small></h3>
  <small>Seçtiğin bölgeyi yükleyen hareketlerde küçük bir uyarı rozeti görünür. Tıbbi tavsiye değildir, ağrı varsa bir uzmana danış.</small>
  <div class="grid2" style="margin:8px 0">${Object.entries(CAUTION).map(([k, v]) => opt("data-ct", k, v, (p.cautions || []).includes(k))).join("")}</div>
  <div class="field"><label>Notum</label><textarea id="pf-note" rows="2">${esc(p.note || "")}</textarea></div></section>`;
const secTargets = p => {
  const c = calcTarget(p, weightOn(today)), shown = p.calManual ? p.cal : (c ? c.target : ""), fl = p.sex === "e" ? 1500 : 1200, warn = (c && c.floored ? `<small style="display:block">Hesaplanan değer genel güvenli alt sınırın (${fl} kcal) altında kaldığı için alt sınıra yükseltildi.</small>` : "") + (shown && shown < fl ? `<small style="display:block">Girdiğin hedef genel alt sınırın (${fl} kcal) altında. Uzman desteği olmadan çok düşük kalori önerilmez.</small>` : "");
  return `<section class="card"><h3>Günlük hedefler</h3>
  <div class="field"><label for="pf-sets">Hareket başına set sayısı</label><select id="pf-sets">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${(+p.sets || 3) === n ? "selected" : ""}>${n} set</option>`).join("")}</select></div>
  <div class="field"><label>Adım hedefi</label><input id="pf-steps" type="number" inputmode="numeric" value="${p.steps || 6000}"></div>
  <div class="field"><label>Kalori hedefi (kcal)</label><input id="pf-cal" type="number" inputmode="numeric" value="${shown || ""}" placeholder="Yaş, cinsiyet ve boyu girince hesaplanır"></div>
  ${c ? `<small>Otomatik tahmin: <b>${c.target}</b> kcal (bazal ${c.bmr}, günlük harcama ≈ ${c.tdee}${hasWeight() ? "" : "; kilo girilmediği için 70 kg varsayıldı"}). ${p.calManual ? "Şu an elle girdiğin değer kullanılıyor." : ""}</small>
  <div class="hist-actions"><button class="btn" data-act="autocal">Otomatik hesapla</button></div>` : `<small>Otomatik hesap için yaş, cinsiyet ve boy gerekir.</small>`}${warn}</section>`;
};
const secData = () => `<details class="card fold" data-fold="set" ${ui.open.set ? "open" : ""}><summary><h3>Ayarlar: yedek, paylaşım, sıfırlama</h3></summary>
  <h3 class="sec">Yedek</h3><p class="mu">Kayıtların bu cihazda tutulur. Telefon değiştirirken ya da güvende olmak için yedek al.</p>
  <p class="mu" id="persistline">${persistText()}</p>
  <div class="row"><button class="btn pri" data-act="export">Yedeği indir</button><button class="btn" data-act="exportshare">Yedeği paylaş</button><button class="btn" data-act="import">Yedekten geri yükle</button></div>
  <div class="row" style="margin-top:8px"><button class="btn" data-act="csvsum">CSV · Günlük özet</button><button class="btn" data-act="csvdet">CSV · Hareket detayı</button></div>
  <h3 class="sec">Paylaş</h3><p class="mu">Haftalık planını bağlantıyla arkadaşına gönder. Bir şablonu paylaşmak için Program'da şablonu aç.</p>
  <div class="row"><button class="btn" data-act="shareweek">Haftalık planı paylaş</button></div>
  <div class="field"><label for="shcode">Aldığın bağlantıyı ya da kodu yapıştır</label><div class="row"><input id="shcode" type="text" placeholder="…#p=…" style="flex:1"><button class="btn" data-act="importcode">Ekle</button></div></div>
  <h3 class="sec">Sıfırlama</h3>
  <div class="row"><button class="btn" data-act="defaultplan">Başlangıç planını yeniden kur</button><button class="btn" data-act="cleardays">Tüm günleri boşalt</button></div>
  <p class="mu" style="margin-top:14px">Kayıtları arşivle: geçmiş kayıtlar uygulamadan kalkar, CSV'de durmaya devam eder.</p>
  <button class="btn danger" data-act="archive">Kayıtları arşivle</button>
  <h3 class="sec">Geri al</h3>${(u => `<p class="mu">${u ? `Son işlemden önce alınan kopya var: ${esc(u.reason)} (${new Date(u.at).toLocaleDateString("tr-TR")}). Kopya 30 gün saklanır.` : "Geri alınacak kopya yok. Yedekten yükleme, arşivleme ve plan sıfırlama öncesinde otomatik alınır."}</p><button class="btn" data-act="undo" ${u ? "" : "disabled"}>Son işlemi geri al</button>`)(readUndo())}</details>`;
const WIZ = [["Hedefin", [secGoal]], ["Ekipmanın", [secEquip, secCaution]], ["Kişisel bilgiler (isteğe bağlı)", [secPersonal]], ["Günlük hedefler", [secTargets]]];
function renderProfile() {
  const p = ui.pf, w = ui.wiz;
  const body = (w >= 0 ? WIZ[w][1] : [secPersonal, secGoal, secEquip, secCaution, secTargets, secNutrition, secTemplates, secLook, secData, secAbout]).map(f => f(p)).join("");
  const top = w >= 0
    ? `<div class="ptop"><div><small>Kısa kurulum · adım ${w + 1}/4 · istediğin kadarını doldur, bilgiler bu cihazdan çıkmaz</small><h2>${WIZ[w][0]}</h2></div><button class="btn" data-act="profskip">Atla</button></div>`
    : `<div class="ptop"><h2>Profilim</h2><button class="btn" data-act="profclose" aria-label="Kapat">✕</button></div>`;
  const bar = w >= 0
    ? `<button class="btn" data-act="profback" ${w ? "" : "disabled"}>Geri</button><button class="btn pri" data-act="profnext">${w === 3 ? "Bitir" : "İleri"}</button>`
    : `<button class="btn" data-act="profclose">Kapat</button><button class="btn pri" data-act="profsave">Kaydet</button>`;
  $("#profile").innerHTML = `<div class="profile-in">${top}${body}</div><div class="pbar"><div class="in">${bar}</div></div>`;
}
function openProfile(wizard) {
  ui.pf = structuredClone(prof()); ui.pf.equip ||= {}; ui.pf.cautions ||= []; ui.wiz = wizard ? 0 : -1;
  renderProfile(); $("#profile").hidden = false; $("#profile").scrollTop = 0;
}
function closeProfile() { $("#profile").hidden = true; ui.pf = null; ui.wiz = -1; }
function readForm() {                                      // ekrandaki alanları taslağa al
  const p = ui.pf, val = id => { const e = document.getElementById(id); return e ? e.value.trim() : null; };
  for (const [k, id] of [["name", "pf-name"], ["sex", "pf-sex"], ["goal", "pf-goal"], ["note", "pf-note"]]) { const x = val(id); if (x !== null) p[k] = x; }
  for (const [k, id] of [["age", "pf-age"], ["height", "pf-height"], ["targetWeight", "pf-tw"], ["steps", "pf-steps"], ["sets", "pf-sets"], ["cal", "pf-cal"], ["dumbbellKg", "pf-db"]]) { const x = val(id); if (x !== null) p[k] = +x || undefined; }
  if (document.querySelector("[data-eq]")) { p.equip = {}; document.querySelectorAll("[data-eq]").forEach(e => { if (e.checked) p.equip[e.dataset.eq] = true; }); }
  if (document.querySelector("[data-ct]")) p.cautions = [...document.querySelectorAll("[data-ct]")].filter(e => e.checked).map(e => e.dataset.ct);
}
function commitProfile() {
  const p = ui.pf, c = calcTarget(p, weightOn(today));
  p.calManual = !!(p.cal > 0 && (!c || p.cal !== c.target));
  if (!p.calManual) delete p.cal;
  delete p.skipped; p.onboarded = true;
  S.profile = { ...p }; GOAL = S.profile.steps || 6000; save();
}
function balanceHtml() {
  const t = calTarget(), c = S.calories[ui.mDate];
  if (!t) return `<small style="display:block;margin-top:10px">Günlük kalori hedefini görmek için profilini doldur.</small><button class="linkbtn" data-act="openprofile">Profilimi doldur →</button>`;
  const diff = c ? c - t : null;
  return `<div class="ringrow" style="margin-top:12px">${ring(c ? c / t : 0, c ?? "–", `/ ${t} kcal`, c && c > t * 1.1 ? "#e03131" : "var(--ok)")}<div><b>${diff === null ? "Henüz giriş yok" : `${diff > 0 ? "+" : ""}${diff} kcal fark`}</b><small style="display:block">Hedef ${t} kcal</small></div></div>`;
}
