"use strict";

/* ---------- Sabitler ---------- */
let GOAL = 6000;
const KEY = "antrenman.v2";
const DAYS = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const ORDER = [1,2,3,4,5,6,0];                       // hafta Pazartesi'den başlar
const TYPES = { g: "Güç", e: "Esneme", r: "Dinlenme" };
const WARMUP = ["Jumping jack, 60 sn","Omuz ve kol daireleri, 15 ileri 15 geri","Cat-Cow, 10 tekrar","Bird Dog, her taraf 10 tekrar","Barda asılma ve scapular pull","Bacak savurma / adım açma","Kalça daireleri","Prayer stretch"];
const COOLDOWN = ["3–4 dk rahat yürüyüş","10–15 nefes: 4 al, 4 tut, 4 ver, 4 bekle"];
const LIB = window.EXERCISE_LIBRARY || [];
const BY_ID = new Map(LIB.map(m => [m.id, m]));

/* ---------- Yardımcılar ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const sum = a => a.reduce((s, v) => s + v, 0);
const roleName = r => ({ ana: "Ana hareket", yan: "Yardımcı hareket", kardiyo: "Kardiyo", isinma: "Isınma", soguma: "Soğuma" }[r] || "Esneme");
const areaRole = m => esc(m.area) + (roleName(m.role) !== m.area ? " · " + roleName(m.role) : "");
const dayRole = (type, m) => type === "e" ? m.role === "esneme" : (m.role === "ana" || m.role === "yan" || m.role === "kardiyo");   // günün hareket listesine girebilenler
const roleKind = m => ({ esneme: "e", isinma: "w", soguma: "c", kardiyo: "k" }[m.role] || "g");

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Veri (localStorage) ---------- */
function defaultPlan() {
  const strength = LIB.filter(m => m.inDefaultProgram && m.role !== "esneme").map(m => m.id);
  const stretch = LIB.filter(m => m.role === "esneme" && m.inDefaultProgram !== false).map(m => m.id);
  const types = { 0: "r", 1: "g", 2: "e", 3: "g", 4: "e", 5: "g", 6: "e" };
  const plan = {};
  for (const d in types) plan[d] = { type: types[d], ids: types[d] === "g" ? [...strength] : types[d] === "e" ? [...stretch] : [] };
  return plan;
}
const emptyPlan = () => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, { type: "r", ids: [] }]));
function load() {
  try { const x = JSON.parse(localStorage.getItem(KEY)); if (x && x.days && x.plan) return x; } catch {}
  return { plan: defaultPlan(), days: {} };
}
let S = load();
normalize();
function normalize() {
  S.plan ||= defaultPlan(); S.videos ||= {}; S.days ||= {}; S.metrics ||= {}; S.calories ||= {}; S.nutrition ||= {}; S.presets ||= []; S.archive ||= []; S.profile ||= {}; S.settings ||= {}; S.v ||= 3; GOAL = S.profile.steps || 6000;
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
// Tek geri alma kopyası: yedekten yükleme, arşivleme, plan sıfırlama öncesinde alınır, 30 gün durur.
const UNDO_KEY = KEY + ".undo";
function snapshotUndo(reason) { try { localStorage.setItem(UNDO_KEY, JSON.stringify({ at: Date.now(), reason, data: S })); } catch {} }
function readUndo() { try { const u = JSON.parse(localStorage.getItem(UNDO_KEY)); return u && u.data && u.data.days && Date.now() - u.at < 30 * 864e5 ? u : null; } catch { return null; } }
// day(k): yazma için (kayıt yoksa oluşturur). peek(k): okuma için (kayıt oluşturmaz).
const EMPTY = { steps: 0, sets: {}, checks: {}, done: false };
const day = k => { const d = (S.days[k] ||= { steps: 0, sets: {}, checks: {}, done: false }); if (k >= today) d.type = planOf(k).type; else d.type ||= planOf(k).type; return d; };
const peek = k => S.days[k] || EMPTY;
const typeOf = k => (k < today && S.days[k]?.type) || planOf(k).type;
const isDone = k => !!S.days[k]?.done;
const planOf = k => { const d = (ui.draft && ui.draft.date === k) ? ui.draft.data : S.days[k]; return (d && d.alt) || S.plan[parse(k).getDay()]; };

/* ---------- Arayüz durumu ---------- */
const today = key(new Date());
const ui = { tab: "b", date: today, month: today.slice(0, 7) + "-01", area: "all", role: "all", q: "", planDay: new Date().getDay(), mDate: today, cDate: today, histMore: false, pickMonth: today.slice(0, 7) + "-01", open: {}, cel: {}, fi: {}, poolMode: "browse", kind: "all" };
try {                                                    // kapanan sayfadan kalan taslağı geri yükle
  const dr = JSON.parse(localStorage.getItem("antrenman.draft"));
  if (dr && dr.dirty && dr.data && dr.date <= today) { ui.draft = { date: dr.date, data: dr.data }; ui.pending = true; ui.date = dr.date; ui.month = ui.pickMonth = dr.date.slice(0, 7) + "-01"; }
} catch {}
