"use strict";

/* ---------- Çizim ---------- */
let lastTab = ui.tab;
function render() {
  autosave();
  const changed = lastTab !== ui.tab, y = changed ? 0 : window.scrollY;   // aynı sekmedeysen kaydırma konumunu koru
  lastTab = ui.tab;
  $("#datelabel").textContent = dateLabel(ui.date);
  if (ui.tab === "k") ui.tab = "t";                                     // eski "Kayıt" sekmesi artık İlerleme'nin içinde
  const navTab = ui.tab === "h" && ui.poolMode === "add" ? "p" : ui.tab;                         // hareket ekleme ekranı Program'a aittir
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === navTab));
  const app = $("#app");
  app.innerHTML = { b: viewToday, t: viewTrack, h: viewPool, p: viewPlan }[ui.tab]();
  if (changed) {                                   // sekme geçişi animasyonu
    app.classList.remove("enter"); void app.offsetWidth; app.classList.add("enter");
    setTimeout(() => app.classList.remove("enter"), 500);
  }
  window.scrollTo(0, y);
}

/* ---------- Olaylar ---------- */
document.addEventListener("click", e => {
  flushEntry();
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const a = b.dataset.act;
  if (a === "tab") { if (b.dataset.tab === "h" && b.closest("#nav")) { ui.poolMode = "browse"; ui.q = ""; ui.area = "all"; } ui.tab = b.dataset.tab; }
  else if (a === "month") { const m = parse(ui.month), nm = key(new Date(m.getFullYear(), m.getMonth() + +b.dataset.dir, 1)); if (nm > today) return; ui.month = nm; }
  else if (a === "pick") { const nd = b.dataset.date; if (nd > today) { toast("Gelecek tarihe kayıt girilemez"); return; } if (nd !== ui.date) leaveDraft(); ui.date = nd; ui.from = ui.tab === "t" ? "t" : null; ui.tab = "b"; closeSheet(); }
  else if (a === "dayinfo") return openDayInfo(b.dataset.date);
  else if (a === "measureday") { ui.mDate = b.dataset.date; ui.tab = "t"; closeSheet(); render(); $("#entry")?.scrollIntoView({ block: "start", behavior: "smooth" }); $("#weight")?.focus({ preventScroll: true }); return; }
  else if (a === "sharego") return shareGo();
  else if (a === "sharedok") acceptShared();
  else if (a === "bgstyle") { S.settings.bg = b.dataset.v; save(); applyLook(); renderProfile(); return; }
  else if (a === "edit") { ui.planDay = +b.dataset.day; ui.open["day" + ui.planDay] = true; ui.q = ""; ui.area = "all"; ui.poolMode = "add"; ui.tab = "h"; }
  else if (a === "areachip") ui.area = b.dataset.v;
  else if (a === "kindchip") { ui.kind = b.dataset.v; ui.area = "all"; }
  else if (a === "addto") return openAddTo(b.dataset.id);
  else if (a === "addday") { const p = S.plan[b.dataset.day], m = BY_ID.get(b.dataset.id); if (!p.ids.includes(m.id)) p.ids.push(m.id); save(); closeSheet(); toast(`${m.name} → ${DAYS[b.dataset.day]} gününe eklendi`); }
  else if (a === "daymenu") return openDayMenu(+b.dataset.day);
  else if (a === "clearday") { const p = S.plan[b.dataset.day]; p.ids = []; delete p.tpl; save(); closeSheet(); toast(`${DAYS[b.dataset.day]} boşaltıldı`); }
  else if (a === "viewmode") { S.settings.listMode = b.dataset.v === "list"; save(); }
  else if (a === "fgo") { ui.fi[ui.date] = +b.dataset.i; render(); document.querySelector(".fnav")?.scrollIntoView({ block: "start", behavior: "smooth" }); return; }
  else if (a === "finish") { edit(ui.date).done = true; celebrate("Antrenman tamamlandı! 💪"); }
  else if (a === "add") {
    const p = S.plan[ui.planDay];
    if (!p.ids.includes(b.dataset.id)) p.ids.push(b.dataset.id);
    save(); toast(`${BY_ID.get(b.dataset.id).name} → ${DAYS[ui.planDay]} gününe eklendi`);
  }
  else if (a === "remove") {
    const p = S.plan[b.dataset.day];
    p.ids = p.ids.filter(id => id !== b.dataset.id);
    save(); toast(`${BY_ID.get(b.dataset.id).name} programdan çıkarıldı`);
  }
  else if (a === "addextra") {
    const id = $("#extra")?.value; if (!id) return;
    const d = edit(ui.date); d.extra ||= []; if (!d.extra.includes(id)) d.extra.push(id);
    toast(`${BY_ID.get(id).name} ek yapılanlara eklendi`);
  }
  else if (a === "rmextra") { const d = edit(ui.date); d.extra = (d.extra || []).filter(x => x !== b.dataset.id); delete d.sets[b.dataset.id]; }
  else if (a === "addact") {
    const [n0, met] = ACTS[+$("#actType").value] || ACTS.at(-1), min = parseInt($("#actMin").value, 10);
    if (!(min > 0)) { toast("Süreyi dakika olarak gir"); return; }
    const d = edit(ui.date); (d.acts ||= []).push({ id: "a" + Date.now(), name: ($("#actName").value || "").trim() || n0, min, met });
    toast("Aktivite eklendi");
  }
  else if (a === "rmact") { const d = edit(ui.date); d.acts = (d.acts || []).filter(x => x.id !== b.dataset.id); }
  else if (a === "delmetric") { delete S.metrics[ui.mDate]; delete S.calories[ui.mDate]; delete S.nutrition[ui.mDate]; save(); toast("Bu günün kaydı silindi"); }
  else if (a === "mtoday") ui.mDate = today;
  else if (a === "hist") ui.histMore = !ui.histMore;
  else if (a === "csvsum") return exportCsvSummary();
  else if (a === "csvdet") return exportCsvDetail();
  else if (a === "info") return openInfo(b.dataset.id);
  else if (a === "savevideo") {
    const v = ytId($("#vidUrl").value);
    if (!v) { toast("Geçerli bir YouTube bağlantısı yapıştır"); return; }
    S.videos[b.dataset.id] = v; save(); toast("Video kaydedildi"); return openInfo(b.dataset.id);
  }
  else if (a === "delvideo") { delete S.videos[b.dataset.id]; save(); toast("Video kaldırıldı"); return openInfo(b.dataset.id); }
  else if (a === "export") return exportData();
  else if (a === "exportshare" || a === "backupnow") return exportData(true);
  else if (a === "sharepreset") return openShareSheet("p", b.dataset.id);
  else if (a === "shareweek") { closeProfile(); return openShareSheet("w"); }
  else if (a === "importcode") { const sh = parseShare($("#shcode").value); if (!sh) { toast("Geçerli bir paylaşım bağlantısı değil"); return; } closeProfile(); openShared(sh); return; }
  else if (a === "snooze") { const d = new Date(); d.setDate(d.getDate() + 3); S.settings.snooze = key(d); save(); toast("3 gün sonra tekrar hatırlatacağım"); }
  else if (a === "accent") { readForm(); S.settings.accent = b.dataset.v; save(); applyLook(); renderProfile(); return; }
  else if (a === "import") return $("#file").click();
  else if (a === "timer") return openTimer(TM.mode === "sw" ? "sw" : "rest");
  else if (a === "tmtab") return openTimer(b.dataset.tab);
  else if (a === "restset") { S.settings.rest = +b.dataset.sec; save(); return openTimer("rest"); }
  else if (a === "restgo") { startRest(restSec()); return openTimer("rest"); }
  else if (a === "tmstop") { stopTimer(); return openTimer(); }
  else if (a === "swopen") { stopTimer(); TM.id = b.dataset.id; TM.set = nextSet(b.dataset.id); return openTimer("sw"); }
  else if (a === "swgo") { startSw(); return openTimer("sw"); }
  else if (a === "swpause") { TM.frozen = Date.now() - TM.startAt; chip(); return openTimer("sw"); }
  else if (a === "swsave") { swSave(); closeSheet(); }
  else if (a === "fill") fillLast([b.dataset.id]);
  else if (a === "fillall") fillLast(programIds(working(ui.date), planOf(ui.date)));
  else if (a === "step") {
    let ls = ui.lastSet;
    if (!ls || ls.id !== b.dataset.id) ls = ui.lastSet = { id: b.dataset.id, i: nextSet(b.dataset.id) };   // odak yoksa ilk boş set
    const inp = document.querySelector(`input[data-act="set"][data-id="${ls.id}"][data-i="${ls.i}"]`); if (!inp) return;
    const nv = Math.max(0, (+inp.value || 0) + +b.dataset.d); inp.value = nv || ""; applySet(ls.id, ls.i, nv || ""); return;
  }
  else if (a === "openprofile") return openProfile(false);
  else if (a === "profclose") return closeProfile();
  else if (a === "profsave") { readForm(); commitProfile(); closeProfile(); toast("Profil kaydedildi"); }
  else if (a === "profnext") {
    readForm();
    if (ui.wiz < 3) { ui.wiz++; renderProfile(); $("#profile").scrollTop = 0; return; }
    const untouched = JSON.stringify(S.plan) === JSON.stringify(defaultPlan());
    commitProfile(); closeProfile();
    if (untouched) { S.plan = fittedPlan(); save(); }                   // başlangıç planını ekipmana göre kur
    ui.tab = "b"; ui.date = today;
    toast(untouched ? "Planın hazır: sadece ekipmanına uyan hareketler var" : "Profilin hazır");
  }
  else if (a === "profback") { readForm(); ui.wiz--; renderProfile(); $("#profile").scrollTop = 0; return; }
  else if (a === "profskip") { S.profile.skipped = true; save(); closeProfile(); }
  else if (a === "autocal") {
    readForm(); const c = calcTarget(ui.pf, weightOn(today));
    if (!c) { toast("Yaş, cinsiyet ve boy gerekir"); return; }
    ui.pf.cal = c.target; ui.pf.calManual = false; renderProfile(); return;
  }
  else if (a === "profweight") { readForm(); commitProfile(); closeProfile(); ui.tab = "t"; render(); window.scrollTo(0, 0); $("#weight")?.focus(); return; }
  else if (a === "opensheet") return openSheet();
  else if (a === "closesheet") { if (ui.altGo) { ui.altGo = false; if (ui.altPrev && ui.altPrev !== ui.date) { leaveDraft(); ui.date = ui.altPrev; } } return closeSheet(); }
  else if (a === "pickdate") { const nd = b.dataset.date; if (nd > today) { toast("Gelecek tarihe kayıt girilemez"); return; } if (nd !== ui.date) leaveDraft(); ui.date = nd; closeSheet(); }
  else if (a === "pmonth") {
    const m = parse(ui.pickMonth), nm = key(new Date(m.getFullYear(), m.getMonth() + +b.dataset.dir, 1));
    if (nm > today) return; ui.pickMonth = nm; return renderSheet();
  }
  else if (a === "tplpick") return openTplPicker(+b.dataset.day);
  else if (a === "tpltab") return openTplPicker(+b.dataset.day, b.dataset.tab, ui.tplDate);
  else if (a === "tplapply") { if (ui.tplDate) applyAlt(ui.tplDate, b.dataset.id); else applyTpl(+b.dataset.day, b.dataset.id); }
  else if (a === "shorttoggle") toggleShort();
  else if (a === "altmenu") { const nd = b.dataset.date; if (nd && nd !== ui.date) { ui.altPrev = ui.date; leaveDraft(); ui.date = nd; ui.altGo = true; } return openAltMenu(); }
  else if (a === "altday") { const wd = +b.dataset.wd, p = S.plan[wd]; setAlt(ui.date, { type: p.type, ids: [...p.ids], label: `${DAYS[wd]} planı` }); }
  else if (a === "altpick") return openTplPicker(parse(ui.date).getDay(), undefined, ui.date);
  else if (a === "altrest") setAlt(ui.date, { type: "r", ids: [], label: "Dinlenme günü" });
  else if (a === "altoff") setAlt(ui.date, null);
  else if (a === "altown") return openAltOwn();
  else if (a === "altact") return openAltAct();
  else if (a === "altactsave") saveAltAct();
  else if (a === "warmmenu") return openWarmMenu(b.dataset.kind);
  else if (a === "warmpick") setWarm(b.dataset.kind, b.dataset.scope, { pack: b.dataset.pack });
  else if (a === "warmown") return warmOwn(b.dataset.kind);
  else if (a === "ownarea") { ui.own.area = b.dataset.v; $("#ownareas").innerHTML = ownAreas(); $("#ownlist").innerHTML = ownList(); return; }
  else if (a === "ownapply") ownApply(b.dataset.key);
  else if (a === "daystat") { setDayStatus(b.dataset.date, b.dataset.st); keepScroll(() => openDayInfo(b.dataset.date)); }
  else if (a === "wkst") { setDayStatus(b.dataset.date, b.dataset.st); keepScroll(() => openWeekFill(ui.wkOff)); }
  else if (a === "weekfill") return openWeekFill(0);
  else if (a === "wkprev") return openWeekFill(ui.wkOff - 1);
  else if (a === "wknext") return openWeekFill(Math.min(0, ui.wkOff + 1));
  else if (a === "backtrack") { leaveDraft(); ui.date = today; ui.tab = "t"; ui.from = null; }
  else if (a === "tplsave") return openTplSave(+b.dataset.day);
  else if (a === "tplsavego") { if (!saveTpl(+b.dataset.day)) return; }
  else if (a === "tplupd") return openTplUpdate(+b.dataset.day);
  else if (a === "tplupdgo") updateTpl(+b.dataset.day);
  else if (a === "tpledit") return openTplEdit(b.dataset.id);
  else if (a === "tplrm") { const t = S.presets.find(x => x.id === b.dataset.id); if (t) { t.ids = t.ids.filter(i => i !== b.dataset.m); save(); openTplEdit(t.id); } return; }
  else if (a === "tpladd") { const t = S.presets.find(x => x.id === b.dataset.id), v = $("#tplAdd")?.value; if (t && v && !t.ids.includes(v)) { t.ids.push(v); save(); toast(`${BY_ID.get(v).name} şablona eklendi`); openTplEdit(t.id); } return; }
  else if (a === "tplrename") {
    const t = S.presets.find(x => x.id === b.dataset.id), n = ($("#tplName").value || "").trim().slice(0, 60);
    if (!t) return; if (!n) { toast("Ad boş olamaz"); return; }
    t.name = uniqueName(n, t.id); save(); toast("Ad kaydedildi"); openTplEdit(t.id); return;
  }
  else if (a === "tplcopy") {
    const t = tplById(b.dataset.id); if (!t) return;
    const c = { id: "c-" + Date.now(), name: uniqueName(`${t.name} (kopya)`), type: t.type, ids: [...t.ids] };
    S.presets.push(c); save(); toast("Şablon kopyalandı"); openTplEdit(c.id); return;
  }
  else if (a === "tpldel") {
    const t = S.presets.find(x => x.id === b.dataset.id); if (!t) return;
    if (!confirm(`"${t.name}" şablonu silinsin mi? Günlerdeki hareketler değişmez.`)) return;
    S.presets = S.presets.filter(x => x.id !== t.id); save(); closeSheet(); toast("Şablon silindi");
  }
  else if (a === "cleardays") {
    if (!confirm("Haftalık plandaki tüm günler boşaltılsın mı? Şablonların ve kayıtların silinmez.")) return;
    snapshotUndo("Günleri boşaltma öncesi"); S.plan = emptyPlan(); save(); toast("Günler temizlendi"); refreshProfile();
  }
  else if (a === "defaultplan") {
    if (!confirm("Haftalık plan, ekipmanına uyan başlangıç planıyla değiştirilsin mi? Şablonların ve kayıtların silinmez.")) return;
    snapshotUndo("Başlangıç planını kurmadan önce"); S.plan = fittedPlan(); save(); toast("Başlangıç planı kuruldu"); refreshProfile();
  }
  else if (a === "archive") return archiveRecords();
  else if (a === "undo") return undoRestore();
  else if (a === "tplgoal") { readForm(); ui.tg = b.dataset.goal; ui.open.tpl = true; renderProfile(); return; }
  else if (a === "tplget") { addBuiltinToMine(b.dataset.id); return; }
  else if (a === "hintoff") { S.settings.hintOff = true; save(); }
  else if (a === "install") { const ev = ui.installEv; ui.installEv = null; if (ev) ev.prompt(); }
  else if (a === "tipoff") { const d = new Date(); d.setDate(d.getDate() + 30); S.settings.tipUntil = key(d); save(); }
  else return;
  render();
});
document.addEventListener("change", e => {
  const t = e.target, a = t.dataset.act;
  if (t.id === "file" && t.files[0]) { importData(t.files[0]); t.value = ""; }
  else if (a === "done") { edit(ui.date).done = t.checked; refreshBar(); }
  else if (a === "check") { const c = edit(ui.date).checks; t.checked ? c[t.dataset.key] = 1 : delete c[t.dataset.key]; refreshBar(); }
  else if (a === "type") {                                 // tür değişince o türün hazır hareketleriyle dolar
    const p = S.plan[t.dataset.day]; p.type = t.value; p.ids = starterIds(t.value); delete p.tpl; save();
    toast(`${DAYS[t.dataset.day]}: ${TYPES[t.value]}${p.ids.length ? ` · ${p.ids.length} hareket eklendi` : ""}`); render();
  }
  else if (a === "planday") { ui.planDay = +t.value; render(); }
  else if (a === "mdate" && t.value && t.value <= today) { flushEntry(); ui.mDate = t.value; render(); }
  else if (a === "autorest") { S.settings.autoRest = t.checked; save(); }
  else if (a === "set") { if (autoRest() && +t.value > 0) startRest(restSec()); }
  else if (a === "theme") { S.settings.theme = t.value; save(); applyLook(); }
  else if (a === "fit") { ui.fit = t.checked; render(); }
  else if (t.dataset.own && ui.own) { const o = ui.own, i = o.sel.indexOf(t.dataset.own); if (t.checked && i < 0) o.sel.push(t.dataset.own); if (!t.checked && i >= 0) o.sel.splice(i, 1); ownCount(); }
  else if (a === "dqsteps" || a === "wksteps") dayWrite(t.dataset.date, d => { d.steps = +t.value || 0; });
  else if (a === "dqweight") { const k = t.dataset.date, v = parseFloat(t.value); if (v > 0) S.metrics[k] = { ...(S.metrics[k] || {}), weight: v }; else if (S.metrics[k]) { delete S.metrics[k].weight; if (!Object.keys(S.metrics[k]).length) delete S.metrics[k]; } save(); }
  else if (a === "area") { ui.area = t.value; render(); }
});
document.addEventListener("input", e => {
  const t = e.target, a = t.dataset.act;
  if (a === "steps") {
    const d = edit(ui.date); d.steps = +t.value || 0;
    const sr = $("#stepring"); if (sr) sr.innerHTML = stepRingHtml(d.steps);
    setBurn(d); refreshBar();
  } else if (a === "set") {
    applySet(t.dataset.id, +t.dataset.i, t.value);
  } else if (a === "load") {
    const d = edit(ui.date); d.load ||= {};
    if (t.value === "") delete d.load[t.dataset.id]; else d.load[t.dataset.id] = +t.value;
    refreshBar();
  } else if (a === "search") { ui.q = t.value; $("#list").innerHTML = poolList(); }
  else if (t.id === "ownq" && ui.own) { ui.own.q = t.value; $("#ownlist").innerHTML = ownList(); }
  else if (t.dataset.ent) entryTyped();
});

window.addEventListener("pagehide", flushEntry);
document.addEventListener("focusin", e => { const t = e.target; if (t.dataset && t.dataset.act === "set") ui.lastSet = { id: t.dataset.id, i: +t.dataset.i }; });
document.addEventListener("mousedown", e => { if (e.target.closest && e.target.closest(".stepbar")) e.preventDefault(); });   // +/- bastıkça klavye ve odak kalsın
document.addEventListener("keydown", e => {                // Enter: bir sonraki set kutusuna geç
  if (e.key !== "Enter" || !e.target.dataset || e.target.dataset.act !== "set") return;
  e.preventDefault(); const all = [...document.querySelectorAll('input[data-act="set"]')], i = all.indexOf(e.target);
  (all[i + 1] || e.target).focus();
});
document.addEventListener("toggle", e => { const f = e.target.dataset && e.target.dataset.fold; if (f) ui.open[f] = e.target.open; }, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); ui.installEv = e; if (ui.tab === "b" && !ui.pf) render(); });
initNative();
if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !isNative()) navigator.serviceWorker.register("sw.js").catch(() => {});
if (navigator.storage && navigator.storage.persist) {
  (navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false)).then(p => p || navigator.storage.persist())
    .then(p => { ui.persist = !!p; }).catch(() => { ui.persist = false; })
    .finally(() => { const el = $("#persistline"); if (el) el.textContent = persistText(); });
} else ui.persist = "na";
applyLook();
if (ui.pending) toast("Son değişikliklerin kaydedildi");
render();
window.addEventListener("hashchange", handleHash);
handleHash();
if (!prof().onboarded && !prof().skipped) openProfile(true);
