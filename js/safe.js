"use strict";
/* ---------- Veri temizleme: içe aktarılan (yedek) verinin yalnızca bilinen, tipi doğru alanlarını alır ----------
   Kötü niyetli ya da bozuk bir yedek dosyası sayfaya kod sokamasın ve uygulamayı çökertemesin diye kullanılır. */
const SAFE_TOKEN = /^[A-Za-z0-9_-]{1,64}$/;
const sNum = (v, lo, hi) => { if (v === null || v === "" || typeof v === "boolean" || typeof v === "object") return null; const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
const sStr = (v, n = 80) => typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, n) : "";
const sDate = k => typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k) && !Number.isNaN(new Date(k + "T00:00:00").getTime());
const sToken = v => typeof v === "string" && SAFE_TOKEN.test(v) ? v : null;
const sEnum = (v, list) => list.includes(v) ? v : null;
const sIds = a => Array.isArray(a) ? [...new Set(a.slice(0, 300).filter(id => typeof id === "string" && BY_ID.has(id)))] : [];
const sObj = o => o && typeof o === "object" && !Array.isArray(o) ? o : {};
const sType = v => sEnum(v, ["g", "e", "r"]);
const sPick = o => { const r = {}; for (const k in o) if (o[k] !== null && o[k] !== undefined) r[k] = o[k]; return r; };   // boş alanları at
const sDict = (o, keyOk, fn, max = 4000) => { const r = {}; let n = 0; for (const k of Object.keys(sObj(o))) { if (!keyOk(k) || n >= max) continue; const v = fn(o[k], k); if (v !== null && v !== undefined) { r[k] = v; n++; } } return r; };

function sWarm(o) { o = sObj(o); const ids = sIds(o.ids), pack = sToken(o.pack); return ids.length ? { ids } : pack ? { pack } : null; }
function sAlt(o) { o = sObj(o); const t = sType(o.type); if (!t) return null; return sPick({ type: t, ids: sIds(o.ids), label: sStr(o.label, 60) || "Farklı", act: o.act === true ? true : undefined }); }
function sSets(o) { return sDict(o, id => BY_ID.has(id), a => Array.isArray(a) ? a.slice(0, 10).map(x => { const n = sNum(x, 0, 100000); return n === null ? "" : n; }) : null, 400); }
function sDay(d) {
  d = sObj(d);
  return sPick({
    steps: sNum(d.steps, 0, 500000) ?? 0, sets: sSets(d.sets),
    checks: sDict(d.checks, k => /^[wc]-[A-Za-z0-9_-]{1,64}$/.test(k) || /^[wc]\d{1,2}$/.test(k), v => v === true ? true : null, 200),
    done: d.done === true, partial: typeof d.partial === "boolean" ? d.partial : undefined, short: d.short === true ? true : undefined,
    type: sType(d.type) || undefined, extra: Array.isArray(d.extra) ? sIds(d.extra) : undefined,
    load: sDict(d.load, id => BY_ID.has(id), v => sNum(v, 0, 1000), 400),
    acts: Array.isArray(d.acts) ? d.acts.slice(0, 30).map(a => { a = sObj(a); const min = sNum(a.min, 0, 1440), met = sNum(a.met, 0, 30); return min === null || met === null ? null : { id: sToken(a.id) || "a0", name: sStr(a.name, 40) || "Aktivite", min, met }; }).filter(Boolean) : undefined,
    alt: sAlt(d.alt), warm: sWarm(d.warm), cool: sWarm(d.cool)
  });
}
const sDays = o => sDict(o, sDate, sDay);
const sMetrics = o => sDict(o, sDate, m => { m = sObj(m); const r = sPick({ weight: sNum(m.weight, 20, 500), waist: sNum(m.waist, 20, 300) }); return Object.keys(r).length ? r : null; });
const sCal = o => sDict(o, sDate, v => sNum(v, 0, 20000));
const sNut = o => sDict(o, sDate, m => { m = sObj(m); const r = sPick({ protein: sNum(m.protein, 0, 1000), water: sNum(m.water, 0, 100) }); return Object.keys(r).length ? r : null; });
function sProfile(p) {
  p = sObj(p);
  const eq = sDict(p.equip, k => /^[a-z]{2,15}$/.test(k), v => typeof v === "boolean" ? v : null, 20);
  return sPick({
    name: sStr(p.name, 40) || undefined, age: sNum(p.age, 5, 120) ?? undefined, sex: sEnum(p.sex, ["k", "e"]) || undefined, height: sNum(p.height, 80, 250) ?? undefined,
    goal: sEnum(p.goal, ["lose", "muscle", "strength", "general"]) || undefined, targetWeight: sNum(p.targetWeight, 20, 500) ?? undefined, equip: eq,
    dumbbellKg: sNum(p.dumbbellKg, 0, 100) ?? undefined, cautions: Array.isArray(p.cautions) ? [...new Set(p.cautions.filter(c => ["bel", "diz", "omuz", "bilek"].includes(c)))] : undefined,
    note: sStr(p.note, 300) || undefined, steps: sNum(p.steps, 0, 100000) ?? undefined, cal: sNum(p.cal, 0, 20000) ?? undefined, sets: sNum(p.sets, 1, 5) ?? undefined,
    calManual: typeof p.calManual === "boolean" ? p.calManual : undefined, onboarded: typeof p.onboarded === "boolean" ? p.onboarded : undefined, skipped: typeof p.skipped === "boolean" ? p.skipped : undefined
  });
}
function sSettings(s) {
  s = sObj(s);
  return sPick({ theme: sToken(s.theme) || undefined, accent: sToken(s.accent) || undefined, bg: sToken(s.bg) || undefined, listMode: sToken(s.listMode) || undefined, autoRest: typeof s.autoRest === "boolean" ? s.autoRest : undefined,
    rest: sNum(s.rest, 5, 600) ?? undefined, hintOff: typeof s.hintOff === "boolean" ? s.hintOff : undefined, lastBackup: sDate(s.lastBackup) ? s.lastBackup : undefined, snooze: sDate(s.snooze) ? s.snooze : undefined, tipUntil: sDate(s.tipUntil) ? s.tipUntil : undefined });
}
function sPlan(p) {
  p = sObj(p); const r = {};
  for (let d = 0; d < 7; d++) { const x = sObj(p[d]), t = sType(x.type) || "r"; r[d] = sPick({ type: t, ids: sIds(x.ids), tpl: sToken(x.tpl) || undefined, warm: sWarm(x.warm) || undefined, cool: sWarm(x.cool) || undefined }); }
  return r;
}
function sPresets(a) {
  return (Array.isArray(a) ? a : []).slice(0, 200).map(p => { p = sObj(p); const ids = sIds(p.ids); return ids.length ? sPick({ id: sToken(p.id) || "c-" + Math.random().toString(36).slice(2, 10), name: sStr(p.name, 60) || "Şablon", type: sEnum(p.type, ["g", "e"]) || "g", ids, src: sToken(p.src) || undefined, from: sStr(p.from, 40) || undefined }) : null; }).filter(Boolean);
}
function sArchive(a) {
  return (Array.isArray(a) ? a : []).slice(0, 50).map(x => { x = sObj(x); return { at: sDate(x.at) ? x.at : "", days: sDays(x.days), metrics: sMetrics(x.metrics), calories: sCal(x.calories), nutrition: sNut(x.nutrition) }; });
}
function cleanState(x) {
  x = sObj(x);
  return { v: 3, plan: sPlan(x.plan), days: sDays(x.days), metrics: sMetrics(x.metrics), calories: sCal(x.calories), nutrition: sNut(x.nutrition), presets: sPresets(x.presets), archive: sArchive(x.archive),
    videos: sDict(x.videos, id => BY_ID.has(id), v => typeof v === "string" && /^[\w-]{11}$/.test(v) ? v : null, 400), profile: sProfile(x.profile), settings: sSettings(x.settings) };
}
