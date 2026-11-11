"use strict";

/* ---------- Hızlı giriş: set yazma, geçen seferi doldurma ---------- */
function applySet(id, i, raw) {
  const d = edit(ui.date), s = d.sets[id] ||= [];
  s[i] = raw === "" ? "" : +raw;
  setBurn(d); refreshBar();
}
function fillLast(ids) {                                   // sadece boş hareketlere, geçen seferki değerleri yaz
  const d = edit(ui.date); let n = 0;
  for (const id of ids) {
    const l = lastRecord(id, ui.date);
    if (!l || (d.sets[id] || []).some(x => +x > 0)) continue;
    d.sets[id] = l[1].slice(0, setsFor(d)); n++;
    const ll = S.days[l[0]].load?.[id]; if (ll) (d.load ||= {})[id] = ll;
  }
  if (n) { toast(`${n} hareket geçen seferkiyle dolduruldu`); checkAllDone(); } else toast("Doldurulacak geçen sefer kaydı yok");
}

/* ---------- Sayaçlar: dinlenme (geri sayım) + kronometre ---------- */
const TM = { mode: null, end: 0, startAt: 0, frozen: null, id: null, set: 0 };
let tmTick = 0, audio = null, tmTab = "rest";
const fmtT = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const restSec = () => S.settings.rest || 60;
const autoRest = () => S.settings.autoRest !== false;      // varsayılan: açık
const swMs = () => TM.frozen !== null ? TM.frozen : Date.now() - TM.startAt;
const nextSet = id => { const d = working(ui.date), v = d.sets[id] || [], n = Math.max(setsFor(d), v.length); for (let i = 0; i < n; i++) if (!(+v[i] > 0)) return i; return n - 1; };
function beep() {
  try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.connect(g); g.connect(audio.destination); o.frequency.value = 880; g.gain.value = 0.2; o.start(); o.stop(audio.currentTime + 0.3); } catch {}
}
function kick() {                                          // dokunuşla başladığı için ses izni de alınır
  try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume && audio.resume(); } catch {}
  clearInterval(tmTick); tmTick = setInterval(tick, 250); tick();
}
function startRest(sec) { TM.mode = "rest"; TM.end = Date.now() + sec * 1000; kick(); }
function startSw() { TM.mode = "sw"; TM.startAt = Date.now(); TM.frozen = null; kick(); }
function stopTimer() { TM.mode = null; TM.frozen = null; clearInterval(tmTick); tmTick = 0; chip(); }
function chip() {
  const c = $("#chip"); if (!c) return;
  c.hidden = !TM.mode;
  if (TM.mode === "rest") c.textContent = "⏱ " + fmtT(Math.max(0, Math.ceil((TM.end - Date.now()) / 1000)));
  else if (TM.mode === "sw") c.textContent = "⏱ " + fmtT(Math.floor(swMs() / 1000)) + (TM.frozen !== null ? " ■" : "");
}
function tick() {
  const dsp = $("#tmdisp");
  if (TM.mode === "rest") {
    const left = Math.ceil((TM.end - Date.now()) / 1000);
    if (left <= 0) { beep(); navigator.vibrate && navigator.vibrate([200, 100, 200]); stopTimer(); toast("Dinlenme bitti, sıradaki sete!"); if (dsp && $("#sheet").classList.contains("open")) openTimer(); return; }
    if (dsp) dsp.textContent = fmtT(left);
  } else if (TM.mode === "sw" && dsp && TM.frozen === null) dsp.textContent = fmtT(Math.floor(swMs() / 1000));
  chip();
}
function timerHtml() {
  const sw = tmTab === "sw", m = BY_ID.get(TM.id), running = TM.mode === "sw" && TM.frozen === null, stopped = TM.mode === "sw" && TM.frozen !== null;
  const tabs = `<div class="row" style="margin:10px 0"><button class="btn ${sw ? "" : "pri"}" data-act="tmtab" data-tab="rest">Dinlenme</button><button class="btn ${sw ? "pri" : ""}" data-act="tmtab" data-tab="sw">Kronometre</button></div>`;
  const body = !sw
    ? `<div class="tmdisp" id="tmdisp">${fmtT(TM.mode === "rest" ? Math.max(0, Math.ceil((TM.end - Date.now()) / 1000)) : restSec())}</div>
       <div class="row">${[30, 45, 60, 90, 120].map(x => `<button class="btn ${restSec() === x ? "pri" : ""}" data-act="restset" data-sec="${x}">${x} sn</button>`).join("")}</div>
       <div class="hist-actions"><button class="btn pri" data-act="restgo">${TM.mode === "rest" ? "Yeniden başlat" : "Başlat"}</button>${TM.mode === "rest" ? `<button class="btn" data-act="tmstop">Durdur</button>` : ""}</div>
       <label class="opt" style="margin-top:12px"><input type="checkbox" data-act="autorest" ${autoRest() ? "checked" : ""}><span>Set girince dinlenme sayacını otomatik başlat</span></label>`
    : `<small>${m ? `${esc(m.name)} · ${TM.set + 1}. set` : "Süreli bir hareketin yanındaki ⏱ düğmesiyle bir sete bağlayabilirsin."}</small>
       <div class="tmdisp" id="tmdisp">${fmtT(Math.floor((TM.mode === "sw" ? swMs() : 0) / 1000))}</div>
       <div class="hist-actions">${running ? `<button class="btn pri" data-act="swpause">Durdur</button>` : `<button class="btn pri" data-act="swgo">${stopped ? "Yeniden başlat" : "Başlat"}</button>`}${stopped && m ? `<button class="btn pri" data-act="swsave">Süreyi sete yaz</button>` : ""}${TM.mode === "sw" ? `<button class="btn" data-act="tmstop">Sıfırla</button>` : ""}</div>`;
  return `<div class="sheet-grip"></div><h3>Sayaç</h3>${tabs}${body}<div class="hist-actions"><button class="btn" data-act="closesheet">Kapat</button></div>`;
}
function openTimer(tab) { if (tab) tmTab = tab; $("#sheetbody").innerHTML = timerHtml(); $("#sheet").classList.add("open"); }
function swSave() {
  if (!BY_ID.get(TM.id) || TM.frozen === null) return;
  applySet(TM.id, TM.set, Math.max(1, Math.round(TM.frozen / 1000)));
  toast(`${TM.set + 1}. sete ${Math.max(1, Math.round(TM.frozen / 1000))} sn yazıldı`); stopTimer();
}
