"use strict";
/* ---------- Gün kartı (takvimden), geçmiş gün şeridi ve "Haftayı doldur" ---------- */
function dayWrite(k, fn) {                                // k günü için kaydı değiştir: taslak varsa taslağı, yoksa doğrudan kaydı
  if (ui.draft && ui.draft.date === k) { fn(edit(k)); autosave(); return; }
  const d = structuredClone(peek(k)); fn(d); d.sets ||= {}; d.checks ||= {};
  const has = d.steps > 0 || d.done || d.partial || d.alt || d.short || d.warm || d.cool || (d.extra || []).length || (d.acts || []).length || Object.keys(d.sets).length || Object.keys(d.checks).length;
  if (has) { d.type = d.alt ? d.alt.type : k >= today ? planOf(k).type : (d.type || planOf(k).type); S.days[k] = d; } else delete S.days[k];
  save();
}
function dayState(k) { const d = peek(k); return d.done ? "done" : isPartial(k) ? "partial" : d.partial === false ? "none" : null; }
function setDayStatus(k, st) {
  if (k > today) { toast("Gelecek tarihe kayıt girilemez"); return; }
  dayWrite(k, d => { d.done = st === "done"; if (st === "partial") d.partial = true; else if (st === "none") d.partial = false; else delete d.partial; });
}
const statSeg = (k, cur, cmd) => `<div class="seg" role="group" aria-label="Gün durumu">${[["done", "✓ Yaptım"], ["partial", "🌗 Kısmen"], ["none", "✗ Yapmadım"]].map(([v, l]) => `<button class="${cur === v ? "on" : ""}" data-act="${cmd}" data-date="${k}" data-st="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div>`;
function openDayInfo(k) {
  const d = peek(k), t = typeOf(k), m = S.metrics[k] || {}, cal = S.calories[k], p = planOf(k), cur = dayState(k);
  const mv = Object.keys(d.sets || {}).filter(id => d.sets[id].some(x => +x > 0)).map(id => BY_ID.get(id)?.name).filter(Boolean), acts = (d.acts || []).map(a => `${a.name} ${a.min} dk`);
  const stat = (v, l) => `<div><b>${v}</b><small>${l}</small></div>`, fut = k > today;
  showSheet(`<div class="dayinfo t-${t}"><span class="tag">${relDay(k)}</span><h3>📅 ${esc(longDate(k))}</h3>
    <small>${d.alt ? esc(d.alt.label) : `Planlanan: ${TYPES[p.type]}${p.ids.length ? ` · ${p.ids.length} hareket` : ""}`}</small></div>
    ${fut ? "" : `<div class="field" style="margin-top:10px"><label>Bu gün nasıl geçti?</label>${statSeg(k, cur, "daystat")}</div>`}
    <div class="burn">${stat(mv.length, "hareket")}${stat((d.steps || 0).toLocaleString("tr-TR"), "adım")}${stat(m.weight ? m.weight + " kg" : "–", "kilo")}</div>
    <p class="mu">${mv.length || acts.length ? esc([...mv.slice(0, 5), ...acts].join(", ")) + (mv.length > 5 ? ` +${mv.length - 5}` : "") : "Bu gün için henüz hareket kaydı yok."}${cal ? ` · Kalori: ${cal} kcal` : ""}</p>
    ${fut ? "" : `<div class="grid2"><div class="field"><label for="dq-steps">Adım</label><input id="dq-steps" type="number" inputmode="numeric" min="0" data-act="dqsteps" data-date="${k}" value="${d.steps || ""}" placeholder="0"></div>
      <div class="field"><label for="dq-weight">Kilo (kg)</label><input id="dq-weight" type="number" step="0.1" inputmode="decimal" min="0" data-act="dqweight" data-date="${k}" value="${m.weight ?? ""}"></div></div>
    <div class="dayacts"><button class="btn pri" data-act="pick" data-date="${k}">${mv.length ? "Hareketleri düzenle" : "Hareketleri gir"}</button><button class="btn" data-act="altmenu" data-date="${k}">🔄 Farklı yaptım</button>
    <button class="btn" data-act="measureday" data-date="${k}">Ölçüm ve beslenme</button></div>`}
    <div class="hist-actions"><button class="btn ghost" data-act="closesheet">Kapat</button></div>`);
}
function dateBanner() {                                   // geçmiş bir gün açıkken görünür
  if (ui.date === today) return "";
  const k = ui.date;
  return `<section class="card datebanner"><div><b>📅 ${esc(longDate(k))} düzenleniyor</b><small>${relDay(k)} · geçmiş kayıt</small></div><div class="row">${ui.from === "t" ? `<button class="btn" data-act="backtrack">‹ İlerleme</button>` : ""}<button class="btn pri" data-act="pickdate" data-date="${today}">Bugüne dön</button></div></section>`;
}
/* ---- Haftayı doldur ---- */
function weekDays(off) { const m = new Date(); m.setDate(m.getDate() - ((m.getDay() + 6) % 7) + off * 7); return [0, 1, 2, 3, 4, 5, 6].map(i => { const x = new Date(m); x.setDate(m.getDate() + i); return key(x); }); }
function openWeekFill(off = 0) {
  ui.wkOff = off; const ks = weekDays(off), a = parse(ks[0]), b = parse(ks[6]), fmt = x => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(x);
  showSheet(`<h3>Haftayı doldur</h3><small>Hangi gün ne yaptığını tek dokunuşla işaretle. Ayrıntı için günün kartını aç.</small>
    <div class="row" style="justify-content:space-between;margin:10px 0"><button class="btn" data-act="wkprev" aria-label="Önceki hafta">‹</button><b>${off === 0 ? "Bu hafta" : fmt(a) + " – " + fmt(b)}</b><button class="btn" data-act="wknext" ${off >= 0 ? "disabled" : ""} aria-label="Sonraki hafta">›</button></div>
    ${ks.map(k => { const t = typeOf(k), fut = k > today, d = peek(k), lbl = new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric", month: "short" }).format(parse(k));
      return `<div class="wkrow ${fut ? "fut" : ""}"><div class="wkh"><b>${esc(lbl)}</b><small>${TYPES[t]}${d.alt ? " · " + esc(d.alt.label) : ""}</small></div>
        ${fut ? `<small>Henüz gelmedi</small>` : `${statSeg(k, dayState(k), "wkst")}<input class="wkstep" type="number" inputmode="numeric" min="0" data-act="wksteps" data-date="${k}" value="${d.steps || ""}" placeholder="adım" aria-label="${esc(lbl)} adım">`}</div>`; }).join("")}
    <div class="hist-actions"><button class="btn" data-act="closesheet">Kapat</button></div>`);
}
function keepScroll(fn) { const sb = $("#sheetbody"), top = sb ? sb.scrollTop : 0; fn(); const s2 = $("#sheetbody"); if (s2) s2.scrollTop = top; }
