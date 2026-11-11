"use strict";

/* ---------- Program + yedek ---------- */
function builtinPresets() {
  const pick = ids => ids.filter(id => BY_ID.has(id));
  return [
    { id: "b-g-full", name: "Güç · Tam vücut", type: "g", ids: LIB.filter(m => m.inDefaultProgram && m.role !== "esneme").map(m => m.id) },
    { id: "b-g-lower", name: "Güç · Alt vücut", type: "g", ids: pick(["sq", "su", "hp", "rl", "single-leg-rdl", "cr", "seated-calf-raise", "hh", "sp"]) },
    { id: "b-g-upper", name: "Güç · Üst vücut", type: "g", ids: pick(["pu", "pk", "bf", "ch", "ar", "lr", "rd", "dc", "dp", "kr"]) },
    { id: "b-e-full", name: "Esneme · Tam vücut", type: "e", ids: LIB.filter(m => m.role === "esneme" && m.inDefaultProgram !== false).map(m => m.id) },
    { id: "b-e-lower", name: "Esneme · Alt vücut", type: "e", ids: pick(["stretch-half-kneeling-quad", "stretch-figure-four", "stretch-wall-straddle", "stretch-hamstring-towel", "stretch-deep-squat", "stretch-butterfly", "stretch-calf-wall", "stretch-standing-quad"]) },
    { id: "b-e-upper", name: "Esneme · Üst vücut ve bilek", type: "e", ids: pick(["stretch-wrist-lean", "stretch-prayer", "stretch-wrist-flexor", "stretch-wrist-extensor", "stretch-neck", "stretch-doorway", "stretch-cross-body-shoulder", "stretch-child-pose", "stretch-thread-needle", "stretch-overhead-side", "stretch-cat-cow"]) },
    ...tplExtraBuiltins()
  ];
}
const allPresets = () => [...builtinPresets(), ...S.presets.map(p => ({ ...p, custom: true }))];
/* ---- Şablonlar: seçme, kaydetme, güncelleme, düzenleme ---- */
const tplById = id => allPresets().find(p => p.id === id);
const sameIds = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const mvNames = ids => ids.map(id => BY_ID.get(id)?.name).filter(Boolean);
const brief = ids => { const n = mvNames(ids); return n.slice(0, 4).join(", ") + (n.length > 4 ? ` +${n.length - 4}` : ""); };
function uniqueName(name, exceptId) {
  const names = new Set(allPresets().filter(p => p.id !== exceptId).map(p => p.name));
  if (!names.has(name)) return name;
  let i = 2; while (names.has(`${name} (${i})`)) i++; return `${name} (${i})`;
}
function tplStatus(d) {                                    // günün bağlı olduğu şablon ve değişip değişmediği
  const p = S.plan[d], t = p.tpl && tplById(p.tpl);
  return t ? { t, changed: !sameIds(p.ids, t.ids) } : null;
}
const showSheet = html => { $("#sheetbody").innerHTML = `<div class="sheet-grip"></div>${html}`; $("#sheet").classList.add("open"); };
function openTplPicker(day, tab, forDate) {
  ui.tplDay = day; ui.tplDate = forDate || null; ui.tplTab = tab || ui.tplTab || (S.plan[day].type === "e" ? "e" : "g");
  const inTab = p => ui.tplTab === "m" ? p.custom : ui.tplTab === "r" ? !!p.goal : ui.tplTab === "a" ? !!p.author : !p.custom && !p.goal && !p.author && p.type === ui.tplTab;
  const list = allPresets().filter(inTab);
  if (ui.tplTab === "r") list.sort((a, b) => (b.goal === prof().goal) - (a.goal === prof().goal));
  const tabs = [["g", "Güç"], ["e", "Esneme"], ["r", "Önerilen"], ...(ahmetList().length ? [["a", "Ahmet"]] : []), ["m", "Benimkiler"]].map(([k, l]) => `<button class="btn ${ui.tplTab === k ? "pri" : ""}" data-act="tpltab" data-tab="${k}" data-day="${day}">${l}</button>`).join("");
  const cards = list.map(p => {
    const miss = p.ids.map(id => BY_ID.get(id)).filter(m => m && missing(m).length).length;
    return `<article class="card tplc"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div><b>${esc(p.name)}</b><small style="display:block">${TYPES[p.type]} · ${p.ids.length} hareket${p.goal ? " · " + GOAL_INFO[p.goal].label : ""}</small>${p.desc ? `<small style="display:block">${esc(p.desc)}</small>` : ""}${fromTag(p)}</div><button class="btn pri" data-act="tplapply" data-day="${day}" data-id="${p.id}">Uygula</button></div><small>${esc(brief(p.ids))}</small>${miss ? `<div><span class="bdg">⚠ ${miss} hareket için ekipman eksik</span></div>` : ""}</article>`;
  }).join("") || `<div class="empty">Henüz kendi şablonun yok. Bir günü hazırla, sonra günün ⋯ Diğer menüsünden şablon olarak kaydet.</div>`;
  showSheet(`<h3>Şablon seç · ${forDate ? (forDate === today ? "Bugün" : "Bu gün") : DAYS[day]}</h3><small>${forDate ? "Haftalık planın değişmez, şablon sadece bu güne uygulanır." : "Uyguladığın şablon o günün hareketlerinin yerine geçer."}</small><div class="row" style="margin:10px 0">${tabs}</div><div style="max-height:52vh;overflow:auto">${cards}</div><div class="hist-actions"><button class="btn" data-act="closesheet">Kapat</button></div>`);
}
function applyTpl(day, id) {
  const t = tplById(id); if (!t) return;
  if (S.plan[day].ids.length && !confirm(`${DAYS[day]} gününün hareketleri "${t.name}" şablonuyla değiştirilsin mi?`)) return;
  S.plan[day] = { type: t.type, ids: [...t.ids], tpl: t.id }; save(); closeSheet(); toast(`${t.name} → ${DAYS[day]} gününe uygulandı`);
}
function openTplSave(day) {
  const p = S.plan[day]; if (!p.ids.length) return;
  showSheet(`<h3>Günü şablon yap</h3><small>${DAYS[day]} gününün ${p.ids.length} hareketi şablon olarak kaydedilir, sonra istediğin güne uygulayabilirsin.</small>
    <div class="field"><label for="tplName">Şablon adı</label><input id="tplName" type="text" maxlength="60" value="${esc(uniqueName(`${TYPES[p.type]} · ${DAYS[day]}`))}"></div>
    <div class="card" style="margin:8px 0"><small>${esc(mvNames(p.ids).join(", "))}</small></div>
    <div class="hist-actions"><button class="btn pri" data-act="tplsavego" data-day="${day}">Kaydet</button><button class="btn" data-act="closesheet">Vazgeç</button></div>`);
}
function saveTpl(day) {
  const p = S.plan[day], name = ($("#tplName").value || "").trim().slice(0, 60);
  if (!name) { toast("Şablona bir ad ver"); return false; }
  const t = { id: "c-" + Date.now(), name: uniqueName(name), type: p.type, ids: [...p.ids] };
  S.presets.push(t); p.tpl = t.id; save(); closeSheet(); toast(`"${t.name}" şablonu kaydedildi`); return true;
}
function openTplUpdate(day) {
  const p = S.plan[day], st = tplStatus(day); if (!st || !st.t.custom) return;
  const add = p.ids.filter(id => !st.t.ids.includes(id)), del = st.t.ids.filter(id => !p.ids.includes(id));
  showSheet(`<h3>Şablonu güncelle</h3><small>"${esc(st.t.name)}" şablonu ${DAYS[day]} gününün hareketleriyle değişir.</small>
    ${add.length ? `<p>➕ Eklenecek: ${esc(mvNames(add).join(", "))}</p>` : ""}${del.length ? `<p>➖ Çıkacak: ${esc(mvNames(del).join(", "))}</p>` : ""}
    <div class="hist-actions"><button class="btn pri" data-act="tplupdgo" data-day="${day}">Güncelle</button><button class="btn" data-act="closesheet">Vazgeç</button></div>`);
}
function updateTpl(day) {
  const st = tplStatus(day), t = st && S.presets.find(x => x.id === st.t.id); if (!t) return;
  t.ids = [...S.plan[day].ids]; save(); closeSheet(); toast(`"${t.name}" şablonu güncellendi`);
}
function openTplEdit(id) {
  const t = S.presets.find(x => x.id === id); if (!t) return;
  const rows = t.ids.map(i => BY_ID.get(i)).filter(Boolean).map(m => `<div class="item"><span>${esc(m.name)} <small>${roleName(m.role)}</small></span><button class="btn" data-act="tplrm" data-id="${t.id}" data-m="${m.id}">Çıkar</button></div>`).join("") || `<small>Şablonda hareket yok.</small>`;
  const opts = LIB.filter(m => dayRole(t.type, m) && !t.ids.includes(m.id)).map(m => `<option value="${m.id}">${esc(m.area)} · ${esc(m.name)}</option>`).join("");
  showSheet(`<h3>Şablonu düzenle</h3>${fromTag(t)}<small>${TYPES[t.type]} şablonu · ${t.ids.length} hareket. Günlere önceden uygulanmış kopyalar kendiliğinden değişmez.</small>
    <div class="field"><label for="tplName">Ad</label><div class="row"><input id="tplName" type="text" maxlength="60" value="${esc(t.name)}" style="flex:1"><button class="btn pri" data-act="tplrename" data-id="${t.id}">Adı kaydet</button></div></div>
    <div class="card" style="margin:8px 0;max-height:32vh;overflow:auto">${rows}</div>
    <div class="field"><label>Hareket ekle</label><div class="row"><select id="tplAdd" style="flex:1">${opts}</select><button class="btn pri" data-act="tpladd" data-id="${t.id}">Ekle</button></div></div>
    <div class="hist-actions"><button class="btn" data-act="tplcopy" data-id="${t.id}">Kopyala</button><button class="btn" data-act="sharepreset" data-id="${t.id}">Paylaş</button><button class="btn danger" data-act="tpldel" data-id="${t.id}">Sil</button><button class="btn ghost" data-act="closesheet">Kapat</button></div>`);
}

function archiveRecords() {
  if (!Object.keys(S.days).length && !Object.keys(S.metrics).length && !Object.keys(S.calories).length && !Object.keys(S.nutrition).length) { toast("Arşivlenecek kayıt yok"); return; }
  if (!confirm("Geçmiş kayıtların (takvim, tablolar, grafikler) uygulamadan temizlenecek, CSV'de yer almaya devam edecek. Devam edilsin mi?")) return;
  for (const k in S.days) S.days[k].type ||= planOf(k).type;
  snapshotUndo("Arşivleme öncesi"); S.archive.push({ at: today, days: S.days, metrics: S.metrics, calories: S.calories, nutrition: S.nutrition });
  S.days = {}; S.metrics = {}; S.calories = {}; S.nutrition = {}; ui.draft = null;
  save(); toast("Kayıtlar arşivlendi, CSV'de duruyor"); render(); refreshProfile();
}
const fromTag = p => p.from ? `<span class="from">👤 ${esc(p.from)} paylaştı</span>` : "";
function openDayMenu(day) {
  const p = S.plan[day], st = tplStatus(day), item = (act, ic, t, sub, dis) => `<button class="mi" data-act="${act}" data-day="${day}" ${dis ? "disabled" : ""}><span class="mi-i">${ic}</span><span><b>${t}</b><small>${sub}</small></span></button>`;
  showSheet(`<h3>${DAYS[day]}</h3><small>${TYPES[p.type]} · ${p.ids.length} hareket${st ? ` · Şablon: ${esc(st.t.name)}` : ""}</small><div class="menu">
    ${item("tplpick", "📋", "Hazır program uygula", "Bu günün hareketlerini hazır bir listeyle değiştir")}
    ${item("tplsave", "💾", "Bu günü şablon olarak kaydet", "Sonra başka günlere tek dokunuşla uygula", !p.ids.length)}
    ${st && st.changed && st.t.custom ? item("tplupd", "🔄", `"${esc(st.t.name)}" şablonunu güncelle`, "Şablon bu günün yeni haliyle değişir") : ""}
    ${item("clearday", "🧹", "Günü boşalt", "Tüm hareketler bu günden çıkarılır", !p.ids.length)}</div>
    <div class="hist-actions"><button class="btn ghost" data-act="closesheet">Kapat</button></div>`);
}
function viewPlan() {
  const todayDow = new Date().getDay();
  const days = ORDER.map(d => {
    const p = S.plan[d], moves = p.ids.map(id => BY_ID.get(id)).filter(Boolean), st = tplStatus(d);
    const sub = p.type === "r" && !moves.length ? "Dinlenme" : `${TYPES[p.type]} · ${moves.length} hareket`;
    return `<details class="card fold dayrow t-${p.type}" data-fold="day${d}" ${ui.open["day" + d] ? "open" : ""}><summary><span class="dl"><b>${DAYS[d]}${d === todayDow ? ` <span class="today-b">bugün</span>` : ""}</b><small>${sub}${st ? ` · ${esc(st.t.name)}${st.changed ? " (değişti)" : ""}` : ""}</small></span></summary>
      <div class="day-top"><label class="inl">Gün türü <select data-act="type" data-day="${d}" aria-label="${DAYS[d]} türü">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === p.type ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <button class="btn ghost" data-act="daymenu" data-day="${d}" aria-label="${DAYS[d]} için diğer seçenekler">⋯ Diğer</button></div>
      ${moves.map((m, i) => `<div class="item"><span><span class="num">${i + 1}</span>${esc(m.name)} ${bdgHtml(m)}</span><button class="xbtn" data-act="remove" data-day="${d}" data-id="${m.id}" aria-label="${esc(m.name)} çıkar">✕</button></div>`).join("") || `<p class="mu">${p.type === "r" ? "Dinlenme günü. Antrenman yapmak istersen gün türünü değiştir." : "Bu günde henüz hareket yok."}</p>`}
      ${p.type === "r" ? "" : `<button class="btn pri wide" data-act="edit" data-day="${d}">+ Hareket ekle</button>`}</details>`;
  }).join("");
  const mine = S.presets.length ? `<section class="card"><h3>Şablonlarım</h3>${S.presets.map(p => `<div class="item"><span>${esc(p.name)} <small>${TYPES[p.type]} · ${p.ids.length} hareket</small>${fromTag(p)}</span><button class="btn ghost" data-act="tpledit" data-id="${p.id}">Düzenle</button></div>`).join("")}</section>` : "";
  return (needsBackup() ? backupBanner() : "") + backupCard() + `<div class="ptitle"><h2>Haftalık plan</h2><small>Bir güne dokun: hareketleri gör, ekle ya da çıkar.</small></div>${days}${mine}`;
}
async function exportData(share) {
  const prev = S.settings.lastBackup; S.settings.lastBackup = today;     // yedek dosyasının kendisi de güncel tarihi taşısın
  const json = JSON.stringify({ app: "Antrenman Programım", schemaVersion: 3, exportedAt: new Date().toISOString(), data: S }, null, 2), name = `antrenman-programim-yedek-${today}.json`;
  const nat = await saveOut(name, json);                    // Android uygulamasında yerel dosya paylaşımı
  if (nat === true) { save(); render(); return; }
  if (nat === "cancel") { S.settings.lastBackup = prev; return; }
  if (share && navigator.canShare) {
    const f = new File([json], name, { type: "application/json" });
    if (navigator.canShare({ files: [f] })) {
      try { await navigator.share({ files: [f], title: "Antrenman yedeği" }); save(); render(); return; }
      catch (e) { if (e.name === "AbortError") { S.settings.lastBackup = prev; return; } }
    }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000); save(); render();
}
const num = v => v === "" || v == null ? "" : String(Math.round(v * 10) / 10).replace(".", ",");   // Türkçe Excel için virgüllü ondalık
const csvSources = () => [...S.archive.map(a => ({ label: `Arşiv (${a.at})`, ...a })), { label: "Aktif", days: S.days, metrics: S.metrics, calories: S.calories }];
function downloadCsv(name, head, rows) {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [head, ...rows].map(r => r.map(q).join(";")).join("\r\n");
  if (isNative()) { saveOut(name, csv); return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportCsvSummary() {                              // günde tek satır
  const srcs = csvSources(), all = Object.assign({}, ...srcs.map(x => x.metrics)), rows = [];
  for (const sc of srcs) for (const k of new Set([...Object.keys(sc.days), ...Object.keys(sc.metrics), ...Object.keys(sc.calories)])) {
    const d = sc.days[k] || {}, m = sc.metrics[k] || {}, b = dayBurn(d, weightOn(k, all));
    rows.push([sc.label, k, DAYS[parse(k).getDay()], d.type ? TYPES[d.type] : "", d.done ? "Evet" : "Hayır", d.steps || 0, num(m.weight), num(m.waist), sc.calories[k] ?? "",
      Object.values(d.sets || {}).filter(v => v.some(x => +x > 0)).length, (d.acts || []).length, Math.round(dayVolume(d)), Math.round(b.training), Math.round(b.steps), Math.round(b.total)]);
  }
  rows.sort((x, y) => x[1].localeCompare(y[1]));
  downloadCsv(`antrenman-ozet-${today}.csv`, ["Kaynak", "Tarih", "Gün", "Program", "Yapıldı", "Adım", "Kilo (kg)", "Bel (cm)", "Alınan kalori (kcal)", "Hareket sayısı", "Ek aktivite sayısı", "Hacim (kg×tekrar)", "Yakılan antrenman (kcal)", "Yakılan adım (kcal)", "Yakılan toplam (kcal)"], rows);
}
function exportCsvDetail() {                               // hareket başına tek satır, setler ayrı sütunlarda
  const srcs = csvSources(), all = Object.assign({}, ...srcs.map(x => x.metrics)), rows = [];
  for (const sc of srcs) for (const k in sc.days) {
    const d = sc.days[k], kg = weightOn(k, all), ex = new Set(d.extra || []);
    for (const id in d.sets || {}) {
      const m = BY_ID.get(id), v = (d.sets[id] || []).map(Number); if (!v.some(x => x > 0)) continue;
      rows.push([sc.label, k, ex.has(id) ? "Ek" : "Program", m ? m.name : id, m ? m.area : "", m ? roleName(m.role) : "", v[0] || "", v[1] || "", v[2] || "", v[3] || "", v[4] || "", m ? m.unit : "", sum(v.filter(x => x > 0)), num(d.load?.[id]), d.load?.[id] && m?.unit === "tekrar" ? Math.round(sum(v.filter(x => x > 0)) * d.load[id]) : "", m ? Math.round(moveKcal(m, v, kg)) : ""]);
    }
    for (const a of d.acts || []) rows.push([sc.label, k, "Ek aktivite", a.name, "Aktivite", "", "", "", "", "dakika", a.min, "", "", Math.round(a.met * kg * a.min / 60)]);
  }
  rows.sort((x, y) => x[1].localeCompare(y[1]));
  downloadCsv(`antrenman-hareketler-${today}.csv`, ["Kaynak", "Tarih", "Tür", "Hareket", "Bölge", "Hareket türü", "1. set", "2. set", "3. set", "4. set", "5. set", "Birim", "Toplam", "Yük (kg)", "Hacim (kg×tekrar)", "Tahmini kalori (kcal)"], rows);
}
async function importData(file) {
  try {
    let x = JSON.parse(await file.text());
    if (x && x.data && typeof x.data === "object" && !x.days) x = x.data;      // indirilen yedek { app, data: S } biçiminde sarılı
    if (!x || !x.days || !x.plan) throw new Error("Geçerli yedek değil");
    if (!confirm("Mevcut kayıtların yedekle değiştirilecek. Devam edilsin mi?")) return;
    snapshotUndo("Yedekten yükleme öncesi"); S = cleanState(x); normalize(); ui.draft = null; save(); applyLook(); render(); refreshProfile(); toast("Yedek yüklendi");
  } catch (e) { alert("İçe aktarılamadı: " + e.message); }
}

const refreshProfile = () => { const p = $("#profile"); if (p && !p.hidden) renderProfile(); };
function undoRestore() {
  const u = readUndo(); if (!u) { toast("Geri alınacak kopya yok"); return; }
  if (!confirm(`Şu anki kayıtların, ${new Date(u.at).toLocaleDateString("tr-TR")} tarihli kopyayla (${u.reason}) değiştirilecek. Devam edilsin mi?`)) return;
  const cur = S; S = u.data; normalize(); ui.draft = null;
  try { localStorage.setItem(UNDO_KEY, JSON.stringify({ at: Date.now(), reason: "Geri alma öncesi", data: cur })); } catch {}
  save(); applyLook(); render(); refreshProfile(); toast("Geri alındı");
}
function persistText() {
  if (ui.persist === true) return "Kalıcı depolama: açık. Tarayıcı, alan azalsa bile verini silmemeye çalışır.";
  if (ui.persist === false) return "Kalıcı depolama: tarayıcı izin vermedi. Düzenli yedek almak en güvenli yol.";
  if (ui.persist === "na") return "Bu tarayıcı kalıcı depolama durumunu bildirmiyor. Düzenli yedek al.";
  return "Kalıcı depolama durumu kontrol ediliyor…";
}
const isMobileUA = () => /iPhone|iPad|Android/i.test(navigator.userAgent);
const isStandalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const tipNeeded = () => !isNative() && !isStandalone() && (!!ui.installEv || isMobileUA()) && !(S.settings.tipUntil && S.settings.tipUntil >= today);
const tipCard = () => ui.installEv
  ? `<section class="card tipbox"><div><b>Uygulamayı kur</b><small>Ana ekranına eklenir, internet olmadan da açılır ve kayıtların daha güvende durur.</small></div><button class="btn pri" data-act="install">Kur</button></section>`
  : `<section class="card tipbox"><div><b>Ana ekrana ekle</b><small>iPhone'da Safari'de alttaki Paylaş düğmesine, sonra "Ana Ekrana Ekle"ye dokun. Android'de Chrome'un ⋮ menüsünden "Ana ekrana ekle"yi seç. Böylece uygulama gibi açılır ve kayıtların daha güvende kalır.</small></div><button class="btn" data-act="tipoff">Tamam</button></section>`;
const hintNeeded = () => !S.settings.hintOff && !Object.values(S.days).some(x => x && x.done);
const hintCard = () => `<section class="card hintbox"><div><b>Nasıl kullanılır?</b><small>Hareketin altındaki kutulara tekrar sayını yaz, bitirince "Yapıldı"ya dokun. Her şey kendiliğinden kaydedilir.</small></div><button class="btn" data-act="hintoff">Anladım</button></section>`;
const backupCard = () => `<section class="card tipbox"><div><b>Verilerini koru</b><small>Kayıtların yalnızca bu cihazda duruyor. ${S.settings.lastBackup ? `Son yedek ${daysSince(S.settings.lastBackup)} gün önce.` : "Henüz yedek almadın."} Yedek dosyasını telefonuna ya da bilgisayarına kaydet.</small></div><button class="btn pri" data-act="export">Yedeği indir</button></section>`;
