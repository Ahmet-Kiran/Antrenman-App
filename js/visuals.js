"use strict";

/* ---------- Görsel yardımcılar: halka, grafikler, seri, kutlama, tema ---------- */
const AREA_C = { "Bacak": "#6366f1", "Kalça ve arka bacak": "#d6336c", "Baldır": "#0ca678", "Göğüs": "#e8590c", "Omuz": "#f59f00", "Sırt ve alt sırt": "#1c7ed6", "Biceps ve ön kol": "#7048e8", "Triceps": "#e64980", "Karın ve core": "#12b886", "Esneme": "#3bc9db", "Isınma": "#f08c00", "Soğuma": "#4dabf7", "Kardiyo": "#fa5252" };
const ACC = { violet: "#5146eb", blue: "#2563eb", teal: "#0c8599", green: "#0f9d6b", orange: "#e8590c", red: "#e03131", pink: "#d6336c", slate: "#475569" };
const ACC_N = { violet: "Mor", blue: "Mavi", teal: "Turkuaz", green: "Yeşil", orange: "Turuncu", red: "Kırmızı", pink: "Pembe", slate: "Antrasit" };
function applyLook() {
  const r = document.documentElement, st = S.settings;
  if (st.theme === "light" || st.theme === "dark") r.dataset.theme = st.theme; else delete r.dataset.theme;
  if (st.accent && st.accent !== "violet") r.dataset.accent = st.accent; else delete r.dataset.accent;
  if (st.bg === "plain") r.dataset.bg = "plain"; else delete r.dataset.bg;
  const mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.content = ACC[st.accent] || ACC.violet;
}
function ring(pct, big, small, color = "var(--ac)") {
  const r = 46, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct || 0));
  return `<div class="ring"><svg viewBox="0 0 110 110" role="img" aria-label="${esc(big)} ${esc(small)}"><circle cx="55" cy="55" r="${r}" class="rg-bg"/><circle cx="55" cy="55" r="${r}" class="rg-fg" style="stroke:${color};stroke-dasharray:${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 55 55)"/></svg><div class="rg-tx"><b>${big}</b><small>${small}</small></div></div>`;
}
const stepRingHtml = n => ring(n / GOAL, (n || 0).toLocaleString("tr-TR"), n >= GOAL ? "hedef tamam" : `${(GOAL - (n || 0)).toLocaleString("tr-TR")} kaldı`, n >= GOAL ? "var(--ok)" : "var(--ac)");
function lineChart(pts, { color = "var(--ac)", target } = {}) {
  if (pts.length < 2) return `<div class="empty"><b>📈</b>Grafik için en az 2 ölçüm gerekir.</div>`;
  const W = 320, H = 140, L = 34, R = 10, T = 12, B = 22;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]).concat(target ? [target] : []);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) - 0.5, y1 = Math.max(...ys) + 0.5;
  const X = x => L + (x1 === x0 ? 0 : (x - x0) / (x1 - x0)) * (W - L - R), Y = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
  const dots = pts.map(p => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3" fill="${color}"/>`).join("");
  const tg = target ? `<line x1="${L}" x2="${W - R}" y1="${Y(target).toFixed(1)}" y2="${Y(target).toFixed(1)}" class="ch-tg"/><text x="${W - R}" y="${(Y(target) - 4).toFixed(1)}" class="ch-t" text-anchor="end">hedef ${target}</text>` : "";
  const fmt = t => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Çizgi grafik"><text x="${L - 4}" y="${T + 8}" class="ch-t" text-anchor="end">${y1.toFixed(1)}</text><text x="${L - 4}" y="${H - B}" class="ch-t" text-anchor="end">${y0.toFixed(1)}</text>${tg}<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}<text x="${L}" y="${H - 6}" class="ch-t">${fmt(x0)}</text><text x="${W - R}" y="${H - 6}" class="ch-t" text-anchor="end">${fmt(x1)}</text></svg>`;
}
function barChart(items, { goal } = {}) {                  // items: [etiket, değer]
  if (!items.some(i => i[1])) return `<div class="empty"><b>📊</b>Henüz veri yok.</div>`;
  const W = 320, H = 140, L = 6, R = 6, T = 16, B = 26, n = items.length, bw = (W - L - R) / n;
  const mx = Math.max(goal || 0, ...items.map(i => i[1] || 0), 1), Y = v => T + (1 - v / mx) * (H - T - B);
  const short = v => v >= 1000 ? (v / 1000).toFixed(1).replace(".0", "") + "k" : v;
  const bars = items.map(([lab, v], i) => {
    const x = L + i * bw + bw * 0.18, w = bw * 0.64, y = Y(v || 0), cx = (x + w / 2).toFixed(1);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(H - B - y).toFixed(1)}" rx="3" fill="${goal && v >= goal ? "var(--ok)" : "var(--ac)"}" opacity="${v ? 1 : 0.15}"/><text x="${cx}" y="${H - 9}" class="ch-t" text-anchor="middle">${lab}</text>${v ? `<text x="${cx}" y="${(y - 3).toFixed(1)}" class="ch-t" text-anchor="middle">${short(v)}</text>` : ""}`;
  }).join("");
  const g = goal ? `<line x1="${L}" x2="${W - R}" y1="${Y(goal).toFixed(1)}" y2="${Y(goal).toFixed(1)}" class="ch-tg"/>` : "";
  const gaps = items.map(([, v], i) => v == null ? `<text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${H - B - 5}" class="ch-t" text-anchor="middle" opacity=".55">–</text>` : "").join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Çubuk grafik">${g}${bars}${gaps}</svg>`;
}
function heatmap() {                                       // son 5 hafta
  const firstK = Object.keys(S.days).sort()[0];             // kullanmaya başlamadan önceki günler kırmızı görünmesin
  const t = new Date(), mon = new Date(t); mon.setDate(t.getDate() - (t.getDay() + 6) % 7 - 28);
  let h = `<div class="hm-wd">${["Pt", "Sa", "Çr", "Pr", "Cu", "Ct", "Pz"].map(d => `<span>${d}</span>`).join("")}</div><div class="hm">`;
  for (let i = 0; i < 35; i++) {
    const d = new Date(mon); d.setDate(mon.getDate() + i); const k = key(d);
    const c = k > today ? "f" : isDone(k) ? "d" : isPartial(k) ? "p" : (!firstK || k < firstK) ? "f" : typeOf(k) === "r" ? "r" : "m";
    h += `<button class="hm-c ${c}" data-act="dayinfo" data-date="${k}" ${k > today ? "disabled" : ""} aria-label="${esc(longDate(k))}"></button>`;
  }
  return h + "</div>";
}
function streaks() {                                       // dinlenme günleri ve bugün (henüz yapılmadıysa) seriyi bozmaz
  const keys = Object.keys(S.days).sort(); let run = 0, best = 0;
  if (!keys.length) return { cur: 0, best: 0 };
  for (const d = parse(keys[0]), end = parse(today); d <= end; d.setDate(d.getDate() + 1)) {
    const k = key(d);
    if (isDone(k) || isPartial(k)) { run++; best = Math.max(best, run); } else if (typeOf(k) !== "r" && k < today) run = 0;
  }
  return { cur: run, best };
}
function celebrate(msg) {
  toast(msg);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.createElement("div"); box.className = "confetti";
  box.innerHTML = Array.from({ length: 30 }, (_, i) => `<i style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.5).toFixed(2)}s;background:${["#f59f00", "#51cf66", "#339af0", "#f06595", "#845ef7"][i % 5]}"></i>`).join("");
  document.body.appendChild(box); setTimeout(() => box.remove(), 2400);
}
function dayVolume(d) {                                    // kg × tekrar
  let v = 0;
  for (const id in d.load || {}) { const m = BY_ID.get(id); if (m && m.unit === "tekrar") v += sum((d.sets[id] || []).map(Number).filter(x => x > 0)) * d.load[id]; }
  return v;
}
const daysSince = k => Math.floor((parse(today) - parse(k)) / 864e5);
function needsBackup() {
  const st = S.settings; if (Object.keys(S.days).length < 3 || (st.snooze && st.snooze >= today)) return false;
  return !st.lastBackup || daysSince(st.lastBackup) >= 7;
}
const backupBanner = () => `<section class="card banner"><div><b>Yedek zamanı</b><small>${S.settings.lastBackup ? `Son yedek ${daysSince(S.settings.lastBackup)} gün önce.` : "Henüz yedek almadın."} Kayıtların bu cihazda duruyor; cihaz değişirse ya da tarayıcı verisi silinirse kaybolur.</small></div><div class="row"><button class="btn pri" data-act="backupnow">Yedeği al</button><button class="btn" data-act="snooze">3 gün sonra hatırlat</button></div></section>`;
const secLook = () => `<section class="card"><h3>Görünüm</h3>
  <div class="field"><label>Tema</label><select data-act="theme">${[["auto", "Otomatik (telefon ayarı)"], ["light", "Açık"], ["dark", "Koyu"]].map(([v, l]) => `<option value="${v}" ${(S.settings.theme || "auto") === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
  <div class="field"><label>Vurgu rengi</label><div class="row">${Object.entries(ACC).map(([k, c]) => `<button class="swatch ${(S.settings.accent || "violet") === k ? "on" : ""}" style="background:${c}" data-act="accent" data-v="${k}" aria-label="${ACC_N[k]}" title="${ACC_N[k]}"></button>`).join("")}</div></div>
  <div class="field"><label>Arka plan</label><div class="row">${[["soft", "Renkli"], ["plain", "Sade"]].map(([v, l]) => `<button class="btn ${(S.settings.bg || "soft") === v ? "pri" : ""}" data-act="bgstyle" data-v="${v}">${l}</button>`).join("")}</div></div></section>`;
