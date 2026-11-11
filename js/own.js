"use strict";
/* ---------- Kendi seçimini yapma: hareket seçici ve "başka aktivite" ---------- */
function ownList() {
  const o = ui.own, q = o.q.trim().toLocaleLowerCase("tr-TR");
  return LIB.filter(m => o.cfg.filter(m) && (o.area === "all" || m.area === o.area) && (!q || `${m.name} ${m.area} ${m.muscles}`.toLocaleLowerCase("tr-TR").includes(q)))
    .map(m => `<label class="ck ownrow"><input type="checkbox" data-own="${m.id}" ${o.sel.includes(m.id) ? "checked" : ""}><span>${esc(m.name)} <small>${esc(m.area)}${m.target ? " · " + esc(m.target) : ""}</small></span></label>`).join("") || `<small>Eşleşen hareket yok.</small>`;
}
const ownAreas = () => { const o = ui.own, areas = [...new Set(LIB.filter(o.cfg.filter).map(m => m.area))];
  return `<button class="chipf ${o.area === "all" ? "on" : ""}" data-act="ownarea" data-v="all">Tümü</button>${areas.map(a => `<button class="chipf ${o.area === a ? "on" : ""}" data-act="ownarea" data-v="${esc(a)}">${esc(a)}</button>`).join("")}`; };
function ownCount() { const n = ui.own.sel.length; document.querySelectorAll("[data-ownapply]").forEach(b => { b.disabled = !n; }); const c = $("#ownn"); if (c) c.textContent = n ? `${n} hareket seçildi` : "Hareket seç"; }
function openOwnPicker(cfg) {
  ui.own = { cfg, sel: [], q: "", area: "all" };
  showSheet(`<h3>${esc(cfg.title)}</h3>${cfg.hint ? `<small>${esc(cfg.hint)}</small>` : ""}
    <div class="own-top"><input id="ownq" type="search" class="search" placeholder="🔍 Hareket ara" aria-label="Hareket ara"><b id="ownn">Hareket seç</b>
      <div class="row">${cfg.apply.map(a => `<button class="btn pri" data-act="ownapply" data-key="${a.key}" data-ownapply disabled>${esc(a.label)}</button>`).join("")}</div></div>
    <div class="chips" id="ownareas">${ownAreas()}</div><div id="ownlist">${ownList()}</div>
    ${cfg.save ? `<label class="opt" style="margin-top:10px"><input type="checkbox" id="ownsave"><span>Şablon olarak da kaydet</span></label><input id="ownname" type="text" placeholder="Şablon adı (isteğe bağlı)">` : ""}
    <div class="hist-actions"><button class="btn" data-act="closesheet">Kapat</button></div>`);
}
function ownApply(key) {
  const o = ui.own; if (!o || !o.sel.length) return;
  const sv = $("#ownsave") && $("#ownsave").checked, name = ($("#ownname") && $("#ownname").value || "").trim();
  if (sv) { const type = o.sel.every(id => BY_ID.get(id)?.role === "esneme") ? "e" : "g"; let nm = name || `Kendi seçimim · ${longDate(ui.date)}`, i = 2; while (S.presets.some(p => p.name === nm)) nm = `${name || "Kendi seçimim"} (${i++})`; S.presets.push({ id: "c-" + Date.now(), name: nm, type, ids: [...o.sel] }); save(); }
  o.cfg.onApply([...o.sel], key);
}
function openAltOwn() {
  openOwnPicker({ title: "Kendi hareketlerimi seçeyim", hint: "Bugün yaptığın hareketleri seç; seçtiğin sırayla listelenir.", save: true,
    filter: m => ["ana", "yan", "kardiyo", "esneme"].includes(m.role), apply: [{ key: "go", label: "Bu güne uygula" }],
    onApply: ids => setAlt(ui.date, { type: ids.every(id => BY_ID.get(id)?.role === "esneme") ? "e" : "g", ids, label: "Kendi seçimim" }) });
}
function openAltAct() {
  const kn = ui.date === today ? "Bugün" : "Bu gün";
  showSheet(`<h3>${kn} başka bir aktivite yaptım</h3><small>Süreden kalori hesaplanır, gün "yapıldı" sayılır.</small>
    <div class="field"><label for="altActType">Aktivite</label><select id="altActType">${ACTS.map(([n], i) => `<option value="${i}">${n}</option>`).join("")}</select></div>
    <div class="grid2"><div class="field"><label for="altActMin">Süre (dk)</label><input id="altActMin" type="number" inputmode="numeric" min="1"></div>
    <div class="field"><label for="altActName">Ad (isteğe bağlı)</label><input id="altActName" type="text" placeholder="örn. halı saha"></div></div>
    <div class="row" style="margin-top:10px"><button class="btn pri" data-act="altactsave">Kaydet</button><button class="btn" data-act="closesheet">Kapat</button></div>`);
}
function saveAltAct() {
  const i = +$("#altActType").value, [n0, met] = ACTS[i] || ACTS.at(-1), min = parseInt($("#altActMin").value, 10);
  if (!(min > 0)) { toast("Süreyi dakika olarak gir"); return; }
  const k = ui.date, name = ($("#altActName").value || "").trim() || n0, d = edit(k);
  (d.acts ||= []).push({ id: "a" + Date.now(), name, min, met });
  d.alt = { type: "g", ids: [], label: `${name} ${min} dk`, act: true }; d.type = "g"; d.done = true;
  delete ui.fi[k]; delete ui.cel[k + "m"]; refreshBar(); closeSheet(); toast("Aktivite kaydedildi, gün yapıldı sayıldı");
  if (ui.altGo) { ui.altGo = false; ui.tab = "b"; ui.from = "t"; }
}
