"use strict";

/* ---------- Hareketler: genel kütüphane (sekme) + güne hareket ekleme (Program'dan) ---------- */
const fitsDay = (m, p) => p.type === "r" ? false : dayRole(p.type, m);
const adding = () => ui.poolMode === "add";
const kindOk = m => ui.kind === "all" || roleKind(m) === ui.kind;
function poolList() {
  const p = S.plan[ui.planDay], q = ui.q.trim().toLocaleLowerCase("tr-TR"), add = adding();
  if (add && p.type === "r") return `<div class="card empty"><b>🛌</b>${DAYS[ui.planDay]} dinlenme günü. Hareket eklemek için Program'da gün türünü Güç ya da Esneme yap.</div>`;
  const list = LIB.filter(m => (add ? fitsDay(m, p) : kindOk(m)) && (ui.area === "all" || m.area === ui.area)
    && (!fitOnly() || !missing(m).length) && (!q || `${m.name} ${m.area} ${m.muscles}`.toLocaleLowerCase("tr-TR").includes(q)));
  return `<small class="count">${list.length} hareket</small><div class="grid">` + list.map(m => {
    const inPlan = p.ids.includes(m.id), days = ORDER.filter(d => S.plan[d].ids.includes(m.id));
    const btn = add
      ? (inPlan ? `<button class="btn added" data-act="remove" data-day="${ui.planDay}" data-id="${m.id}" aria-label="${esc(m.name)} programdan çıkar">✓ Eklendi</button>`
                : `<button class="btn soft" data-act="add" data-id="${m.id}" aria-label="${esc(m.name)} ekle">+ Ekle</button>`)
      : `<div class="pc-f"><small>${days.length ? `📅 ${days.map(d => SHORT[d]).join(", ")}` : "Programında yok"}</small><button class="btn soft" data-act="addto" data-id="${m.id}" aria-label="${esc(m.name)} programa ekle">+ Programa ekle</button></div>`;
    return `<article class="card pc ${add && inPlan ? "in" : ""}" style="--c:${AREA_C[m.area] || "var(--ac)"}"><button class="mv-open" data-act="info" data-id="${m.id}" aria-label="${esc(m.name)} nasıl yapılır"><span class="tag">${areaRole(m)}</span><b>${esc(m.name)}</b><small>${esc(m.muscles)} · <span class="how">Nasıl yapılır?</span></small>${bdgHtml(m) ? `<div>${bdgHtml(m)}</div>` : ""}</button>${btn}</article>`;
  }).join("") + `</div>` + (list.length ? "" : `<div class="card empty"><b>🔍</b>Bu filtrelerle eşleşen hareket yok.</div>`);
}
function openAddTo(id) {                                   // kütüphaneden: hangi güne eklensin?
  const m = BY_ID.get(id); if (!m) return;
  const rows = ORDER.map(d => {
    const p = S.plan[d], has = p.ids.includes(id), ok = fitsDay(m, p);
    return `<button class="mi" data-act="addday" data-day="${d}" data-id="${id}" ${has || !ok ? "disabled" : ""}><span class="mi-i">${has ? "✓" : ok ? "＋" : "–"}</span><span><b>${DAYS[d]}</b><small>${TYPES[p.type]} · ${p.ids.length} hareket${has ? " · zaten ekli" : ok ? "" : ` · ${m.role === "esneme" ? "esneme" : "güç"} günü değil`}</small></span></button>`;
  }).join("");
  showSheet(`<span class="tag" style="--c:${AREA_C[m.area] || "var(--ac)"}">${esc(m.area)}</span><h3>${esc(m.name)}</h3><small>Hangi güne eklensin?</small><div class="menu">${rows}</div><div class="hist-actions"><button class="btn ghost" data-act="closesheet">Kapat</button></div>`);
}
function viewPool() {
  const add = adding(), p = S.plan[ui.planDay], areas = [...new Set(LIB.filter(m => add ? fitsDay(m, p) : kindOk(m)).map(m => m.area))];
  const chip = (act, cur, v, l) => `<button class="chipf ${cur === v ? "on" : ""}" data-act="${act}" data-v="${esc(v)}" aria-pressed="${cur === v}" ${act === "areachip" && v !== "all" ? `style="--c:${AREA_C[v] || "var(--ac)"}"` : ""}>${esc(l)}</button>`;
  const head = add
    ? `<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><button class="btn ghost" data-act="tab" data-tab="p">← Program'a dön</button>
        <select data-act="planday" aria-label="Hangi güne eklensin">${ORDER.map(d => `<option value="${d}" ${d == ui.planDay ? "selected" : ""}>${DAYS[d]}</option>`).join("")}</select></div>
       <h2 class="ph">${DAYS[ui.planDay]} gününe hareket ekle</h2><small>${TYPES[p.type]} günü · şu an ${p.ids.length} hareket</small>`
    : `<h2 class="ph">Hareket kütüphanesi</h2><small>${LIB.length} hareket · Birine dokun, nasıl yapıldığını gör.</small>
       <div class="chips">${chip("kindchip", ui.kind, "all", "Hepsi")}${chip("kindchip", ui.kind, "g", "💪 Güç")}${chip("kindchip", ui.kind, "k", "🏃 Kardiyo")}${chip("kindchip", ui.kind, "w", "🔥 Isınma")}${chip("kindchip", ui.kind, "c", "🌿 Soğuma")}${chip("kindchip", ui.kind, "e", "🧘 Esneme")}</div>`;
  return `<section class="card poolhead">${head}
    ${add && p.type === "r" ? "" : `<input type="search" class="search" data-act="search" value="${esc(ui.q)}" placeholder="🔍 Hareket ara" aria-label="Hareket ara">
    <div class="chips">${chip("areachip", ui.area, "all", "Tüm bölgeler")}${areas.map(a => chip("areachip", ui.area, a, a)).join("")}</div>
    <label class="opt" style="margin-top:8px"><input type="checkbox" data-act="fit" ${fitOnly() ? "checked" : ""}><span>Sadece ekipmanıma uyanlar</span></label>`}</section><div id="list">${poolList()}</div>`;
}
