"use strict";
/* ---------- Isınma ve soğuma: paketler ve günlük liste ---------- */
const WARM_PACKS = [
  { key: "klasik", name: "Klasik ısınma", desc: "İlk listedeki gibi: kalp atışı, omuz, omurga, kalça.", ids: ["warm-jumping-jack", "warm-arm-circles", "stretch-cat-cow", "bird-dog", "scapular-pull-up", "warm-leg-swings", "warm-hip-circles", "stretch-prayer"] },
  { key: "genel", name: "Genel ısınma (5 dk)", desc: "Tüm vücudu ısıtan akıcı bir sıra.", ids: ["warm-jumping-jack", "warm-arm-circles", "warm-hip-circles", "warm-leg-swings", "warm-bodyweight-squat", "warm-inchworm", "stretch-cat-cow", "bird-dog"] },
  { key: "ust", name: "Üst vücut ısınması", desc: "Omuz, kürek kemiği ve sırt için. İtme ve çekme günlerine uygun.", ids: ["warm-arm-circles", "warm-scapular-pushup", "stretch-cat-cow", "warm-thoracic-rotation", "stretch-wrist-circles", "stretch-dead-hang"] },
  { key: "alt", name: "Alt vücut ısınması", desc: "Kalça, bacak ve ayak bileği için. Squat ve hamle günlerine uygun.", ids: ["warm-high-knees", "warm-leg-swings", "warm-hip-circles", "warm-ankle-rocks", "warm-worlds-greatest", "warm-bodyweight-squat", "glute-bridge"] },
  { key: "kisa", name: "Kısa ısınma (2 dk)", desc: "Vaktin azsa 4 hareketle hızlıca ısın.", ids: ["warm-jumping-jack", "warm-arm-circles", "warm-bodyweight-squat", "stretch-cat-cow"] }
];
const COOL_PACKS = [
  { key: "klasik", name: "Klasik soğuma", desc: "İlk listedeki gibi: yürüyüş ve nefes.", ids: ["cool-walk", "cool-breathing"] },
  { key: "rahat", name: "Rahatlatıcı soğuma (5 dk)", desc: "Yürüyüş, rahatlatıcı esnemeler ve nefes.", ids: ["cool-walk", "stretch-child-pose", "stretch-supine-twist", "stretch-hamstring-towel", "stretch-figure-four", "cool-breathing"] },
  { key: "ust", name: "Üst vücut soğuması", desc: "Göğüs, omuz, kol ve bilek esnemeleri.", ids: ["stretch-doorway", "stretch-cross-body-shoulder", "stretch-biceps-wall", "stretch-wrist-flexor", "stretch-neck", "cool-belly-breathing"] },
  { key: "alt", name: "Alt vücut soğuması", desc: "Ön ve arka bacak, kalça ve baldır esnemeleri.", ids: ["stretch-standing-quad", "stretch-hamstring-towel", "stretch-calf-wall", "stretch-figure-four", "stretch-child-pose", "cool-legs-up-wall"] }
];
const packsOf = kind => kind === "w" ? WARM_PACKS : COOL_PACKS;
function warmIds(k, kind) {                               // gün seçimi > günün planındaki seçim > klasik paket
  const d = (ui.draft && ui.draft.date === k) ? ui.draft.data : S.days[k], f = kind === "w" ? "warm" : "cool";
  const o = (d && d[f]) || S.plan[parse(k).getDay()][f], ids = o && (o.ids || (packsOf(kind).find(p => p.key === o.pack) || {}).ids);
  return (ids || packsOf(kind)[0].ids).filter(id => BY_ID.has(id));
}
function checklist2(title, kind, d) {
  const ids = warmIds(ui.date, kind), n = ids.filter(id => d.checks[kind + "-" + id]).length;
  return `<details class="card fold" data-fold="${kind}" ${ui.open[kind] ? "open" : ""}><summary><h3>${title}</h3><small id="cnt-${kind}">${n}/${ids.length}</small></summary>${ids.map(id => { const m = BY_ID.get(id), key = kind + "-" + id;
    return `<div class="ckrow"><label class="ck"><input type="checkbox" data-act="check" data-key="${key}" ${d.checks[key] ? "checked" : ""}><span>${esc(m.name)}${m.target ? ` <small>${esc(m.target)}</small>` : ""}</span></label><button class="ckinfo" data-act="info" data-id="${id}" aria-label="${esc(m.name)} nasıl yapılır">ⓘ</button></div>`; }).join("")}
    <div class="row" style="margin-top:8px"><button class="btn" data-act="warmmenu" data-kind="${kind}">Listeyi değiştir</button></div></details>`;
}
function openWarmMenu(kind) {
  const wd = parse(ui.date).getDay(), nm = id => (BY_ID.get(id) || {}).name;
  showSheet(`<h3>${kind === "w" ? "Isınma" : "Soğuma"} listesi</h3><small>Bir paket seç. "Sadece bugün" yalnızca bu günü, "${DAYS[wd]} planında hep" her ${DAYS[wd]} gününü değiştirir.</small>
    ${packsOf(kind).map(p => `<div class="card packrow"><b>${esc(p.name)}</b><small style="display:block">${esc(p.desc)}</small><small style="display:block">${p.ids.map(nm).filter(Boolean).map(esc).join(", ")}</small>
      <div class="row"><button class="btn pri" data-act="warmpick" data-kind="${kind}" data-pack="${p.key}" data-scope="day">Sadece bugün</button><button class="btn" data-act="warmpick" data-kind="${kind}" data-pack="${p.key}" data-scope="plan">${DAYS[wd]} planında hep</button></div></div>`).join("")}
    <div class="row" style="margin-top:10px"><button class="btn" data-act="warmown" data-kind="${kind}">✍️ Kendi listemi seçeyim</button></div>
    <div class="hist-actions"><button class="btn" data-act="closesheet">Kapat</button></div>`);
}
function setWarm(kind, scope, val) {
  const f = kind === "w" ? "warm" : "cool", wd = parse(ui.date).getDay();
  if (scope === "plan") { S.plan[wd][f] = val; save(); const d = edit(ui.date); delete d[f]; } else edit(ui.date)[f] = val;
  closeSheet(); refreshBar(); toast(scope === "plan" ? `${DAYS[wd]} planındaki liste değişti` : "Bugünün listesi değişti");
}
function warmOwn(kind) {
  const wd = parse(ui.date).getDay();
  openOwnPicker({ title: kind === "w" ? "Kendi ısınma listem" : "Kendi soğuma listem", hint: "Isınma, soğuma ve esneme hareketlerinden seç. Seçme sırası listenin sırası olur.",
    filter: m => ["isinma", "soguma", "esneme"].includes(m.role), save: false,
    apply: [{ key: "day", label: "Sadece bugün" }, { key: "plan", label: `${DAYS[wd]} planında hep` }], onApply: (ids, key) => setWarm(kind, key, { ids }) });
}
