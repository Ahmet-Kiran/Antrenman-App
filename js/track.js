"use strict";

/* ---------- Takip ---------- */
function records(id) {
  return Object.keys(S.days).sort().map(k => [k, (S.days[k].sets[id] || []).map(Number).filter(v => v > 0)]).filter(r => r[1].length);
}
const lastRecord = (id, before) => records(id).filter(r => r[0] < before).pop();
const fmtDate = k => `${k.slice(8)}.${k.slice(5, 7)}.${k.slice(0, 4)}`;
function historyCard() {
  const keys = [...new Set([...Object.keys(S.metrics), ...Object.keys(S.calories)])].sort().reverse();
  const shown = keys.slice(0, ui.histMore ? 15 : 8);
  const rows = shown.map(k => {
    const m = S.metrics[k] || {};
    return `<tr><td>${fmtDate(k)}</td><td>${m.weight ?? "–"}</td><td>${m.waist ?? "–"}</td><td>${S.calories[k] ?? "–"}</td></tr>`;
  }).join("");
  const more = keys.length > 8
    ? `<button class="btn" data-act="hist">${ui.histMore ? "Daha az göster" : `Daha fazla göster (${Math.min(15, keys.length)} kayda kadar)`}</button>` : "";
  return `<section class="card"><h3>Kilo, bel ve kalori kayıtları</h3>
    ${rows ? `<table><tr><th>Tarih</th><th>Kilo (kg)</th><th>Bel (cm)</th><th>Kalori</th></tr>${rows}</table>` : `<small>Henüz kayıt yok.</small>`}
    ${more ? `<div class="hist-actions">${more}</div>` : ""}
    <small style="display:block;margin-top:8px">Ekranda en fazla 15 kayıt görünür. Tüm kayıtlar için Profilim › Ayarlar'dan CSV indir.</small></section>`;
}

function viewTrack() {
  const m = parse(ui.month), nDays = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const monthDone = Array.from({ length: nDays }, (_, i) => key(new Date(m.getFullYear(), m.getMonth(), i + 1))).filter(isDone).length;
  const t = new Date(), mon = new Date(t); mon.setDate(t.getDate() - (t.getDay() + 6) % 7);
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return key(d); });
  const planned = week.filter(k => planOf(k).type !== "r").length, doneW = week.filter(isDone).length, partW = week.filter(isPartial).length, stepsW = week.filter(k => (S.days[k]?.steps || 0) >= GOAL).length;
  const weekKcal = Math.round(week.reduce((a, k) => a + dayBurn(peek(k), weightOn(k), k).total, 0)), vol = Math.round(week.reduce((a, k) => a + dayVolume(peek(k)), 0)), st = streaks();
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(t); d.setDate(t.getDate() - 6 + i); return [d, key(d)]; });
  const steps7 = last7.map(([d, k]) => [SHORT[d.getDay()], S.days[k]?.steps > 0 ? S.days[k].steps : null]), cal7 = last7.map(([d, k]) => [SHORT[d.getDay()], S.calories[k] ?? null]), prot7 = last7.map(([d, k]) => [SHORT[d.getDay()], nutOf(k).protein ?? null]), water7 = last7.map(([d, k]) => [SHORT[d.getDay()], nutOf(k).water ?? null]);
  const pts = f => Object.keys(S.metrics).sort().filter(k => S.metrics[k][f]).map(k => [parse(k).getTime(), S.metrics[k][f]]).slice(-12);
  const rows = LIB.map(x => {
    const r = records(x.id); if (!r.length) return "";
    const l = r.at(-1), p = r.at(-2), dl = p ? sum(l[1]) - sum(p[1]) : null, ld = S.days[l[0]].load?.[x.id];
    return `<tr><td>${esc(x.name)}</td><td>${l[1].join("-")}${ld ? ` · ${ld} kg` : ""}</td><td>${Math.max(...r.flatMap(z => z[1]))}</td><td class="${dl > 0 ? "up" : dl < 0 ? "dn" : ""}">${dl === null ? "–" : (dl > 0 ? "▲ +" : dl < 0 ? "▼ " : "= ") + dl}</td></tr>`;
  }).join("");
  const fresh = !Object.keys(S.days).length && !Object.keys(S.metrics).length && !Object.keys(S.calories).length;
  const cal = `<section class="card">${calendar(ui.month, "track")}<div class="cal-key"><span><i class="k-on"></i>Yapıldı</span><span><i class="k-p"></i>Kısmen</span><span><i class="k-g"></i>Güç</span><span><i class="k-e"></i>Esneme</span></div><div class="row" style="margin-top:8px"><button class="btn" data-act="weekfill">📝 Haftayı doldur</button></div><small style="display:block;margin-top:6px">${monthDone} gün yapıldı · Bir güne dokun, o günün özetini gör</small></section>`;
  if (fresh) return entryCard() + `<div class="card empty"><b>🌱</b>Henüz kayıt yok. İlk antrenmanını kaydettiğinde grafiklerin burada belirir.<div style="margin-top:10px"><button class="btn pri" data-act="tab" data-tab="b">Antrenmana başla</button></div></div>` + cal;
  return entryCard() + `<div class="tk">
    ${cal}
    <div><section class="card"><h3>Bu hafta</h3>
      <div class="statgrid"><div><b>${doneW}/${planned}</b><small>antrenman${partW ? ` · +${partW} kısmen` : ""}</small></div><div><b>${stepsW}/7</b><small>adım hedefi</small></div><div><b>${weekKcal}</b><small>kcal yakılan</small></div></div>
      <div class="statgrid"><div><b>🔥 ${st.cur}</b><small>güncel seri</small></div><div><b>${st.best}</b><small>en uzun seri</small></div><div><b>${vol}</b><small>hacim (kg×tekrar)</small></div></div></section>
    <section class="card"><h3>Son 5 hafta</h3>${heatmap()}<small style="display:block;margin-top:8px">Yeşil: yapıldı · Açık yeşil: kısmen · Kırmızımsı: planlı ama yapılmadı · Gri: dinlenme ya da kullanmaya başlamadan önce</small></section></div>
    <section class="card"><h3>Günlük adım</h3>${barChart(steps7, { goal: GOAL })}${logCaption(steps7, "adım")}</section>
    <section class="card"><h3>Alınan kalori</h3>${barChart(cal7, { goal: calTarget() })}${logCaption(cal7, "kcal")}</section>
    <section class="card"><h3>Protein (g)</h3>${barChart(prot7, { goal: proteinTarget() })}${logCaption(prot7, "g")}</section>
    <section class="card"><h3>Su (bardak)</h3>${barChart(water7, { goal: waterTarget() })}${logCaption(water7, "bardak")}</section>
    <section class="card"><h3>Kilo (kg)</h3>${lineChart(pts("weight"), { target: prof().targetWeight })}</section>
    <section class="card"><h3>Bel çevresi (cm)</h3>${lineChart(pts("waist"), { color: "#2899d2" })}</section>
    <div class="wide">${historyCard()}</div>
    <section class="card wide"><h3>Hareket ilerlemesi</h3>${rows ? `<div class="sc"><table><tr><th>Hareket</th><th>Son (set · yük)</th><th>En iyi set</th><th>Değişim</th></tr>${rows}</table></div>` : `<div class="empty"><b>🏋️</b>Set girdikçe ilerlemen burada görünür.</div>`}</section></div>`;
}
