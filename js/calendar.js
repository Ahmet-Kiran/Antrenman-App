"use strict";

/* ---------- Tarih etiketi, takvim, tarih seçici ---------- */
function dateLabel(k) {
  const d = parse(k), md = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(d);
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  if (k === today) return `Bugün · ${md}`;
  if (k === key(yd)) return `Dün · ${md}`;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "short", ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}) }).format(d);
}
const longDate = k => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long", ...(parse(k).getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}) }).format(parse(k));
function relDay(k) { const yd = new Date(); yd.setDate(yd.getDate() - 1); return k === today ? "Bugün" : k === key(yd) ? "Dün" : `${daysSince(k)} gün önce`; }
function calendar(monthKey, mode) {                  // mode: "track" (Takip) | "pick" (tarih seçici)
  const m = parse(monthKey), y = m.getFullYear(), mo = m.getMonth(), n = new Date(y, mo + 1, 0).getDate();
  const off = (new Date(y, mo, 1).getDay() + 6) % 7, pick = mode === "pick";
  let cells = "<i></i>".repeat(off);
  for (let i = 1; i <= n; i++) {
    const k = key(new Date(y, mo, i)), fut = k > today;
    const cls = ["cal", isDone(k) ? "on" : isPartial(k) ? "part" : "", k === today ? "today" : "", k === ui.date ? "sel" : "", fut ? "fut" : "", "t-" + typeOf(k)].join(" ");
    cells += `<button class="${cls}" data-act="${pick ? "pickdate" : "dayinfo"}" data-date="${k}" ${fut ? "disabled" : ""} aria-label="${esc(longDate(k))}">${i}</button>`;
  }
  const title = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(m);
  const noNext = key(new Date(y, mo + 1, 1)) > today;
  return `<div class="cal-head"><button class="btn" data-act="${pick ? "pmonth" : "month"}" data-dir="-1" aria-label="Önceki ay">‹</button>
    <strong style="text-transform:capitalize">${title}</strong>
    <button class="btn" data-act="${pick ? "pmonth" : "month"}" data-dir="1" aria-label="Sonraki ay" ${noNext ? "disabled" : ""}>›</button></div>
    <div class="cal-wd">${["Pt", "Sa", "Çr", "Pr", "Cu", "Ct", "Pz"].map(d => `<span>${d}</span>`).join("")}</div><div class="cal-grid">${cells}</div>`;
}
function renderSheet() {
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  $("#sheetbody").innerHTML = `<div class="sheet-grip"></div>
    <div class="row" style="justify-content:space-between"><h3>Tarih seç</h3>
    <div class="row"><button class="btn" data-act="pickdate" data-date="${key(yd)}">Dün</button><button class="btn pri" data-act="pickdate" data-date="${today}">Bugün</button></div></div>
    ${calendar(ui.pickMonth, "pick")}<small>Yeşil: antrenman yapılan gün · Gelecek tarihlere kayıt girilemez.</small>`;
}
function openSheet() { ui.pickMonth = ui.date.slice(0, 7) + "-01"; renderSheet(); $("#sheet").classList.add("open"); }
function ytId(v) {                                   // YouTube bağlantısından ya da düz 11 karakterlik kimlikten video kimliği çıkar
  v = (v || "").trim();
  const m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/) || v.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}
function openInfo(id) {
  const m = BY_ID.get(id); if (!m) return;
  const vid = S.videos[id] || m.video, own = !!S.videos[id];
  const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(m.name + " nasıl yapılır")}`;
  const gif = encodeURI(m.gif || `media/${id}.gif`);
  const alts = (missing(m).length ? (ALT_FOR[id] || []) : []).map(a => BY_ID.get(a)?.name).filter(Boolean);
  const bdHtml = (bdgHtml(m) ? `<div style="margin:6px 0">${bdgHtml(m)}</div>` : "") + (alts.length ? `<small>Alternatif: ${alts.map(esc).join(", ")}</small>` : "");
  const media = vid
    ? `<div class="media"><iframe src="https://www.youtube-nocookie.com/embed/${esc(vid)}?rel=0&playsinline=1" title="${esc(m.name)}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
    : `<div class="media"><video src="media/${encodeURI(id)}.mp4" autoplay muted loop playsinline controls onerror="var p=this.parentNode;this.remove();var i=new Image();i.src='${gif}';i.onload=function(){p.prepend(i)};i.onerror=function(){p.classList.add('none')}"></video><p class="mu none-msg">Bu hareket için henüz video eklenmedi. Aşağıdan YouTube bağlantısı ekleyebilirsin.</p></div>`;
  $("#sheetbody").innerHTML = `<div class="sheet-grip"></div><span class="tag">${areaRole(m)}</span><h3 style="margin:4px 0">${esc(m.name)}</h3><small>${esc(m.muscles)}</small>${bdHtml}${media}
    <p>${esc(m.instructions)}</p>${m.target ? `<small>Öneri: ${esc(m.target)} · Ölçü: ${m.unit}</small>` : ""}
    <div class="field"><label>${vid ? "Videoyu değiştir" : "Video ekle"}: YouTube'da ara, videonun bağlantısını kopyalayıp buraya yapıştır</label>
    <div class="row"><input id="vidUrl" type="url" placeholder="https://youtu.be/..." style="flex:1"><button class="btn pri" data-act="savevideo" data-id="${id}">Kaydet</button></div></div>
    <div class="hist-actions"><a class="btn pri" href="${yt}" target="_blank" rel="noopener noreferrer">YouTube'da ara</a>${own ? `<button class="btn" data-act="delvideo" data-id="${id}">Videomu kaldır</button>` : ""}<button class="btn" data-act="closesheet">Kapat</button></div>`;
  $("#sheet").classList.add("open");
}
function closeSheet() {
  $("#sheet").classList.remove("open");
  setTimeout(() => { if (!$("#sheet").classList.contains("open")) $("#sheetbody").innerHTML = ""; }, 320);   // açık kalan videonun sesi durur
}
