"use strict";

/* ---------- Bugün ---------- */
function checklist(title, prefix, items, d) {
  const n = items.filter((_, i) => d.checks[prefix + i]).length;
  return `<details class="card fold" data-fold="${prefix}" ${ui.open[prefix] ? "open" : ""}><summary><h3>${title}</h3><small id="cnt-${prefix}">${n}/${items.length}</small></summary>${items.map((t, i) =>
    `<label class="ck"><input type="checkbox" data-act="check" data-key="${prefix}${i}" ${d.checks[prefix + i] ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}</details>`;
}
function moveCard(m, d, extra = false) {
  const v = d.sets[m.id] || [], last = lastRecord(m.id, ui.date), done = v.some(x => +x > 0), hint = repHint(m), bd = bdgHtml(m);
  const sec = m.unit === "saniye", steps = sec ? [-10, -5, 5, 10] : [-5, -1, 1, 5], loadable = m.role !== "esneme" && !sec;
  const ll = last ? S.days[last[0]].load?.[m.id] : null, ld = d.load?.[m.id];
  return `<article class="card mv ${done ? "ok" : ""}" data-id="${m.id}" style="--c:${AREA_C[m.area] || "var(--ac)"}">
    <div class="mv-head"><button class="mv-name" data-act="info" data-id="${m.id}" aria-label="${esc(m.name)} nasıl yapılır"><b>${esc(m.name)}</b><small>${roleName(m.role)} · ${esc(m.muscles)}</small></button>
    <div class="row" style="flex:none;flex-wrap:nowrap"><span class="mv-unit">${m.unit}</span>${sec ? `<button class="btn" data-act="swopen" data-id="${m.id}" aria-label="${esc(m.name)} kronometre">⏱</button>` : ""}${extra ? `<button class="btn" data-act="rmextra" data-id="${m.id}">Kaldır</button>` : `<button class="btn" data-act="info" data-id="${m.id}" aria-label="${esc(m.name)} videosu">▶</button>`}</div></div>
    <div class="sets" style="grid-template-columns:repeat(${Math.max(setsFor(d), v.length)},1fr)">${Array.from({ length: Math.max(setsFor(d), v.length) }, (_, i) => i).map(i => `<input type="number" inputmode="numeric" enterkeyhint="next" min="0" data-act="set" data-id="${m.id}" data-i="${i}" value="${v[i] ?? ""}" placeholder="${i + 1}. set" aria-label="${esc(m.name)} ${i + 1}. set (${m.unit})">`).join("")}</div>
    <div class="mv-foot"><small>${last ? `Geçen sefer (${last[0].slice(8)}.${last[0].slice(5, 7)}): ${last[1].join("-")}${ll ? ` · ${ll} kg` : ""}` : "Henüz kayıt yok"}${m.target ? ` · ${esc(m.target)}` : ""}${hint ? ` · Hedefin: ${hint}` : ""}</small>${loadable ? `<label class="ld">Yük <input type="number" inputmode="decimal" step="0.5" min="0" data-act="load" data-id="${m.id}" value="${ld ?? ""}" placeholder="kg" aria-label="${esc(m.name)} yük (kg)"> kg</label>` : ""}</div>
    ${last && !done ? `<button class="btn" data-act="fill" data-id="${m.id}" style="min-height:32px;padding:2px 10px;margin-top:6px">↻ Doldur</button>` : ""}${bd ? `<div>${bd}</div>` : ""}
    <div class="stepbar">${steps.map(x => `<button class="btn" data-act="step" data-id="${m.id}" data-d="${x}" aria-label="${x > 0 ? "artır" : "azalt"} ${Math.abs(x)}">${x > 0 ? "+" : "−"}${Math.abs(x)}</button>`).join("")}</div></article>`;
}

/* ---------- Otomatik kayıt: her değişiklik hemen cihaza yazılır ---------- */
const working = k => (ui.draft && ui.draft.date === k) ? ui.draft.data : peek(k);
function edit(k) {
  if (!ui.draft || ui.draft.date !== k) ui.draft = { date: k, data: structuredClone(peek(k)) };
  ui.pending = true; return ui.draft.data;
}
function autosave() {                                    // çalışma kopyasını temizleyip kayda yazar
  if (!ui.pending || !ui.draft) return;
  ui.pending = false;
  const k = ui.draft.date, d = structuredClone(ui.draft.data);
  for (const id in d.sets) if (!d.sets[id].some(x => +x > 0)) delete d.sets[id];
  for (const id in d.load || {}) if (!d.sets[id]) delete d.load[id];
  const has = d.steps > 0 || d.done || d.partial || d.warm || d.cool || d.alt || d.short || (d.extra || []).length || (d.acts || []).length || Object.keys(d.sets).length || Object.keys(d.checks).length;
  if (has) { d.type = k >= today ? planOf(k).type : (d.type || planOf(k).type); S.days[k] = d; } else delete S.days[k];
  save();
  try { localStorage.removeItem("antrenman.draft"); } catch {}
  const s = $("#savedot"); if (s) { s.textContent = "✓ Kaydedildi"; s.classList.add("on"); clearTimeout(ui.sdT); ui.sdT = setTimeout(() => { s.classList.remove("on"); s.textContent = "Otomatik kaydedilir"; }, 1500); }
}
function leaveDraft() { autosave(); ui.draft = null; return true; }   // başka güne geçerken
const programIds = (d, p) => [...new Set([...(d.short ? shortIds(p.ids.filter(id => BY_ID.has(id))) : p.ids), ...Object.keys(d.sets)])].filter(id => !(d.extra || []).includes(id) && BY_ID.has(id));
function progressHtml(d) {
  const ids = programIds(d, planOf(ui.date)), done = ids.filter(id => (d.sets[id] || []).some(x => +x > 0)).length;
  return ids.length ? `<div class="ringrow">${ring(done / ids.length, `${done}/${ids.length}`, "hareket", done === ids.length ? "var(--ok)" : "var(--ac)")}<div><h3>Bugünün hareketleri</h3>${ids.some(id => lastRecord(id, ui.date)) ? `<button class="btn" data-act="fillall" style="margin-top:8px">↻ Geçen seferi doldur</button>` : ""}</div></div>` : "";
}
function updateLive() {                                  // yazdıkça ilerleme, yeşil işaret ve sayaçlar güncellenir
  const d = working(ui.date);
  document.querySelectorAll(".mv").forEach(c => c.classList.toggle("ok", (d.sets[c.dataset.id] || []).some(x => +x > 0)));
  const pr = $("#prog"); if (pr) pr.innerHTML = progressHtml(d);
  const ids = programIds(d, planOf(ui.date)), k = ui.date;
  checkAllDone();
  if (d.steps >= GOAL && !ui.cel[k + "s"]) { ui.cel[k + "s"] = 1; celebrate("Adım hedefi tamamlandı! 👟"); }
  for (const p of ["w", "c"]) { const c = $("#cnt-" + p); if (c) { const li = warmIds(ui.date, p); c.textContent = `${li.filter(id => d.checks[p + "-" + id]).length}/${li.length}`; } }
}
function checkAllDone() {                               // tüm hareketler bitince gün "yapıldı" olur
  const k = ui.date, d = working(k), ids = programIds(d, planOf(k));
  if (!ids.length || !ids.every(id => (d.sets[id] || []).some(x => +x > 0)) || ui.cel[k + "m"]) return;
  ui.cel[k + "m"] = 1;
  if (!d.done) { edit(k).done = true; const cb = $("#donecb"); if (cb) cb.checked = true; }
  celebrate("Tüm hareketler tamam! 🎉 Gün yapıldı olarak işaretlendi");
}
function refreshBar() { updateLive(); autosave(); }

/* ---------- Tahmini kalori yakımı (MET yöntemi) ---------- */
const MET = { "Bacak": 5.5, "Kalça ve arka bacak": 5, "Baldır": 3.5, "Göğüs": 5.5, "Omuz": 4, "Sırt ve alt sırt": 5, "Biceps ve ön kol": 3.5, "Triceps": 4, "Karın ve core": 4, "Esneme": 2.3, "Isınma": 3.5, "Soğuma": 2, "Kardiyo": 8 };
const ACTS = [["Yürüyüş", 3.5], ["Koşu", 9], ["Bisiklet", 7], ["Yüzme", 6], ["Futbol / basketbol", 7], ["Yoga / pilates", 3], ["Ağırlık antrenmanı", 5], ["Diğer", 4.5]];
const SEC_PER_REP = 3, REST_SEC = 40, DEFAULT_KG = 70;
function weightOn(k, metrics = S.metrics) {
  const all = Object.keys(metrics).filter(x => metrics[x].weight).sort();
  const before = all.filter(x => x <= k);
  const pick = before.length ? before.at(-1) : all[0];
  return pick ? metrics[pick].weight : DEFAULT_KG;
}
function moveKcal(m, vals, kg) {
  const v = (vals || []).map(Number).filter(x => x > 0); if (!v.length) return 0;
  const active = m.unit === "saniye" ? sum(v) : sum(v) * SEC_PER_REP;
  return (MET[m.area] || 4) * kg * (active + (m.role === "ana" || m.role === "yan" ? REST_SEC * v.length : 0)) / 3600;
}
function dayBurn(d, kg, k) {
  let moves = 0, est = false;
  for (const id in d.sets || {}) { const m = BY_ID.get(id); if (m) moves += moveKcal(m, d.sets[id], kg); }
  if (!moves && k && d.done && !(d.acts || []).length) {                  // "Yapıldı" işaretli ama set girilmemiş: plana göre (3 set) tahmin
    const n = setsFor(d);
    for (const id of programIds({ sets: {}, extra: [], short: d.short }, planOf(k))) { const m = BY_ID.get(id); if (m) { moves += moveKcal(m, Array(n).fill(m.unit === "saniye" ? 30 : 10), kg); est = true; } }
  }
  const acts = (d.acts || []).reduce((t, a) => t + a.met * kg * a.min / 60, 0);
  const steps = (d.steps || 0) * 0.0006 * kg;
  return { moves, acts, steps, est, training: moves + acts, total: moves + acts + steps };
}
function burnHtml(k, d) {
  const kg = weightOn(k), b = dayBurn(d, kg, k), has = Object.values(S.metrics).some(m => m.weight);
  return `<h3>Tahmini yakılan kalori <small>(kcal)</small></h3><div class="burn"><div><b>${Math.round(b.training)}</b><small>antrenman</small></div><div><b>${Math.round(b.steps)}</b><small>adım</small></div><div><b>${Math.round(b.total)}</b><small>toplam</small></div></div>
    <small>${kg} kg esas alındı${has ? "" : " (kilonu İlerleme sekmesinden girersen güncellenir)"}. Bu yalnızca yaklaşık bir tahmindir.${b.est ? " Hareket tekrarlarını girmediğin için antrenman kalorisi planındaki hareketlere göre (${setsFor(d)} set) hesaplandı." : ""}</small>`;
}

const setBurn = d => document.querySelectorAll(".burnblk").forEach(e => { e.innerHTML = burnHtml(ui.date, d); });

/* ---------- Ek yapılanlar ---------- */
function extrasSection(d) {
  const used = new Set([...planOf(ui.date).ids, ...(d.extra || [])]), kg = weightOn(ui.date);
  const opts = LIB.filter(m => !used.has(m.id) && m.role !== "isinma" && m.role !== "soguma").map(m => `<option value="${m.id}">${esc(m.area)} · ${esc(m.name)}</option>`).join("");
  const list = (d.extra || []).map(id => BY_ID.get(id)).filter(Boolean).map(m => moveCard(m, d, true)).join("");
  const acts = (d.acts || []).map(a => `<div class="item"><span>${esc(a.name)} <small>${a.min} dk · ≈ ${Math.round(a.met * kg * a.min / 60)} kcal</small></span><button class="btn" data-act="rmact" data-id="${a.id}">Kaldır</button></div>`).join("");
  return `${list || acts ? `<h3 class="sec">Ekstra yaptıkların</h3>` : ""}
    ${list}${acts ? `<section class="card">${acts}</section>` : ""}
    <details class="card fold" data-fold="x" ${ui.open.x ? "open" : ""}><summary><h3>+ Ekstra hareket ya da aktivite</h3></summary>
    <small>Programın dışında yaptıklarını ekle (yürüyüş, koşu, futbol…).</small>
    <div class="field"><label for="actType">Aktivite</label><select id="actType">${ACTS.map(([n], i) => `<option value="${i}">${n}</option>`).join("")}</select></div>
    <div class="grid2"><div class="field"><label for="actMin">Süre (dk)</label><input id="actMin" type="number" inputmode="numeric" min="1"></div>
    <div class="field"><label for="actName">Ad (isteğe bağlı)</label><input id="actName" type="text"></div></div>
    <button class="btn" data-act="addact">Aktiviteyi ekle</button>
    <div class="field" style="margin-top:14px"><label for="extra">Ya da listeden bir hareket</label><div class="row"><select id="extra" style="flex:1">${opts}</select><button class="btn" data-act="addextra">Ekle</button></div></div></details>`;
}

/* ---------- Tek tek modu: bir seferde tek hareket ---------- */
const listMode = () => !!S.settings.listMode;
const moveDone = (d, id) => (d.sets[id] || []).some(x => +x > 0);
function focusIndex(k, moves, d) {
  let i = ui.fi[k];
  if (i == null) { i = moves.findIndex(m => !moveDone(d, m.id)); if (i < 0) i = 0; }
  return Math.max(0, Math.min(moves.length - 1, i));
}
function focusHtml(moves, d) {
  const k = ui.date, n = moves.length, i = focusIndex(k, moves, d), doneN = moves.filter(m => moveDone(d, m.id)).length, m = moves[i];
  const next = moves.findIndex((x, j) => j > i && !moveDone(d, x.id));
  return `<section class="card fnav"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b>Hareket ${i + 1} / ${n}</b><small>${doneN} tamamlandı</small></div>
      <div class="fbar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${doneN}" aria-label="Tamamlanan hareketler"><i style="width:${Math.round(doneN / n * 100)}%"></i></div></section>
    <div class="focus">${moveCard(m, d)}</div>
    <div class="fctl"><button class="btn" data-act="fgo" data-i="${i - 1}" ${i ? "" : "disabled"}>← Önceki</button>${i < n - 1
      ? `<button class="btn pri" data-act="fgo" data-i="${i + 1}">Sonraki →</button>`
      : `<button class="btn pri" data-act="finish" ${d.done ? "disabled" : ""}>${d.done ? "Antrenman tamam ✓" : "Antrenmanı bitir ✓"}</button>`}</div>
    ${next > i + 1 ? `<button class="linkbtn" data-act="fgo" data-i="${next}">Sıradaki yapılmamış hareket: ${esc(moves[next].name)} →</button>` : ""}`;
}
const modeSwitch = () => `<div class="seg" role="group" aria-label="Görünüm"><button class="${listMode() ? "" : "on"}" data-act="viewmode" data-v="focus" aria-pressed="${!listMode()}">Tek tek</button><button class="${listMode() ? "on" : ""}" data-act="viewmode" data-v="list" aria-pressed="${listMode()}">Tüm liste</button></div>`;

function viewToday() {
  const k = ui.date, d = working(k), p = planOf(k), type = k < today ? (d.type || p.type) : p.type, ids = programIds(d, p), st = streaks();
  if (ids.length && ids.every(id => moveDone(d, id))) ui.cel[k + "m"] = 1;
  if (d.steps >= GOAL) ui.cel[k + "s"] = 1;
  const hero = `<section class="card hero t-${type}"><div><small>${DAYS[parse(k).getDay()]}</small><h2>${esc(d.alt && d.alt.act ? d.alt.label : TYPES[type])}</h2>${st.cur ? `<span class="pill">🔥 ${st.cur} gün seri</span>` : ""}</div>
    <div class="hero-r"><div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="timer">⏱ Sayaç</button><label><input id="donecb" type="checkbox" data-act="done" ${d.done ? "checked" : ""}> Yapıldı</label></div><small id="savedot" class="savedot">Otomatik kaydedilir</small></div>${heroOpts(d, k, type, ids)}</section>`;
  if (!LIB.length) return hero + `<div class="card">exercise-data.js bulunamadı.</div>`;
  const stepCard = `<section class="card"><div class="row" style="justify-content:space-between"><h3>Günlük adım</h3><small>${GOAL} hedef</small></div>
    <div class="stepwrap"><div id="stepring">${stepRingHtml(d.steps || 0)}</div><div class="field"><label for="steps">Adım sayısı</label><input id="steps" type="number" inputmode="numeric" min="0" data-act="steps" value="${d.steps || ""}" placeholder="0"></div></div></section>`;
  const prog = ids.length ? `<section class="card" id="prog">${progressHtml(d)}</section>` : "";
  const burn = cls => `<section class="card burnblk ${cls}">${burnHtml(k, d)}</section>`;
  const moves = ids.map(id => BY_ID.get(id));
  let main = type === "g" ? checklist2("Isınma", "w", d) : "";
  if (d.alt && d.alt.act && !moves.length) main += `<div class="card empty"><b>🏃</b>${esc(d.alt.label)} kaydedildi. Ayrıntı aşağıdaki "Ekstra yaptıkların" bölümünde.</div>`;
  else if (type === "r" && !moves.length) main += `<div class="card empty"><b>🛌</b>Dinlenme günü. Sadece adım hedefini tamamla; istersen aşağıdan ekstra aktivite ekleyebilirsin.</div>`;
  else if (!moves.length) main += `<div class="card empty"><b>📋</b>Bu güne hareket eklenmemiş.<div style="margin-top:10px"><button class="btn pri" data-act="edit" data-day="${parse(k).getDay()}">Program'dan hareket ekle</button></div></div>`;
  else main += modeSwitch() + (listMode() ? moves.map(m => moveCard(m, d)).join("") : focusHtml(moves, d));
  main += (type === "g" ? checklist2("Soğuma", "c", d) : "") + extrasSection(d) + burn("only-narrow");
  return dateBanner() + (needsBackup() ? backupBanner() : "") + (hintNeeded() ? hintCard() : tipNeeded() ? tipCard() : "") + `<div class="tg">${hero}<div class="side">${stepCard}${prog}${burn("only-wide")}</div><div class="main">${main}</div></div>`;
}
