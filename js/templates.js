"use strict";
/* ---------- Önerilen şablonlar (amaca göre), Ahmet'in programı ve tüyolar ---------- */
const GOAL_INFO = {
  lose:     { label: "Yağ yakımı",   reps: "12–15 tekrar", rest: "30–45 sn", why: "Kısa dinlenmeli, büyük kas gruplarını çalıştıran akıcı antrenmanlar kalbi çalıştırır ve daha çok enerji harcatır." },
  muscle:   { label: "Kas kazanımı", reps: "8–12 tekrar",  rest: "60–90 sn", why: "Kasları bölgelere ayırıp her bölgeye yeterince set vermek gelişimi destekler. Son tekrarlar zorlayıcı olmalı." },
  strength: { label: "Güç",          reps: "5–8 tekrar",   rest: "90–120 sn", why: "Az tekrar, zor varyasyon ve uzun dinlenme. Hareket kolaylaşınca daha zor bir versiyona geç." },
  general:  { label: "Genel form",   reps: "10–15 tekrar", rest: "45–60 sn", why: "Tüm vücudu dengeli çalıştıran, sade ve sürdürülebilir bir başlangıç." }
};
const GOAL_TPL = [
  { id: "b-lose-1", goal: "lose", name: "Yağ yakımı · Tam vücut devre", desc: "Bacak, itme, çekme ve core bir arada. Hareketler arası dinlenmeyi kısa tut.", ids: ["sq", "pu", "rl", "hp", "bf", "pk", "mountain-climbers", "bicycle-crunch"] },
  { id: "b-lose-2", goal: "lose", name: "Yağ yakımı · Alt vücut ve core", desc: "En büyük kas grupları bacak ve kalçadır; en çok enerji burada harcanır.", ids: ["sq", "su", "rl", "hp", "cr", "wall-sit", "dead-bug", "plank"] },
  { id: "b-lose-3", goal: "lose", name: "Yağ yakımı · Üst vücut ve core", desc: "İtme ve çekme hareketlerini core ile birleştiren hızlı bir gün.", ids: ["pu", "pk", "dp", "ar", "lr", "bf", "mountain-climbers", "bird-dog"] },
  { id: "b-muscle-1", goal: "muscle", name: "Kas · İtme günü", desc: "Göğüs, omuz ve triceps. Her harekette 3 set yap, son tekrarlar zorlasın.", ids: ["pu", "decline-push-up", "pk", "shoulder-press", "lr", "dp", "overhead-triceps-extension", "plank"] },
  { id: "b-muscle-2", goal: "muscle", name: "Kas · Çekme günü", desc: "Sırt ve biceps. Çekme hareketleri duruşa da iyi gelir.", ids: ["bf", "ch", "ar", "bent-over-row", "rd", "dc", "hammer-curl", "sm"] },
  { id: "b-muscle-3", goal: "muscle", name: "Kas · Bacak ve kalça günü", desc: "Bacak ve kalça için ağırlıklı ve tek bacak hareketleri.", ids: ["sq", "split-squat", "hp", "rl", "single-leg-rdl", "cr", "side-lunge", "hh"] },
  { id: "b-strength-1", goal: "strength", name: "Güç · Alt vücut (zor varyasyonlar)", desc: "Tek bacak hareketleri vücut ağırlığını bile zorlaştırır. Tekrarları yavaş ve kontrollü yap.", ids: ["split-squat", "single-leg-rdl", "single-leg-glute-bridge", "hp", "cr", "wall-sit", "hh", "plank"] },
  { id: "b-strength-2", goal: "strength", name: "Güç · Üst vücut (zor varyasyonlar)", desc: "Zor itme ve çekme hareketleri. Tekrar sayısı düşük, form önemli.", ids: ["decline-push-up", "pk", "negative-pull-up", "bf", "dp", "diamond-push-up", "chin-up-hold", "hh"] },
  { id: "b-strength-3", goal: "strength", name: "Güç · Tam vücut (ana hareketler)", desc: "Sadece temel hareketler: az hareket, tam dinlenme, her sette iyi form.", ids: ["sq", "hp", "pu", "bf", "pk", "single-leg-rdl", "kr", "hh"] },
  { id: "b-general-1", goal: "general", name: "Genel · Tam vücut (başlangıç)", desc: "Yeni başlayanlar için sade ve güvenli bir gün. Önce formu öğren.", ids: ["sq", "incline-push-up", "glute-bridge", "bent-over-row", "bird-dog", "dead-bug", "plank", "calf-raise"] },
  { id: "b-general-2", goal: "general", name: "Genel · Hareketlilik ve core", desc: "Kalça, omuz ve gövdeyi hareketli ve dengeli tutan bir gün.", ids: ["sq", "side-lunge", "glute-bridge", "prone-t-raise", "sm", "bird-dog", "dead-bug", "sp"] },
  { id: "b-general-3", goal: "general", name: "Genel · Üst vücut (hafif)", desc: "Üst vücut için daha hafif bir gün. Omuz ve sırt dengesini korur.", ids: ["incline-push-up", "pu", "ar", "lr", "rd", "dc", "dp", "plank"] }
];
// Ahmet'in programı js/ahmet.js içinde; yalnızca Profilim adı "Ahmet" ile başlıyorsa görünür.
const ahmetList = () => typeof ahmetTemplates === "function" && /^\s*ahmet(\b|')/i.test(prof().name || "") ? ahmetTemplates() : [];
const tplExtraBuiltins = () => [
  ...GOAL_TPL.map(t => ({ ...t, type: "g" })),
  ...ahmetList()
].map(t => ({ ...t, ids: t.ids.filter(id => BY_ID.has(id)) }));

const tplEquipNeeds = ids => [...new Set(ids.flatMap(id => ((TAGS[id] || {}).equip || []).map(r => r.split("|").map(k => EQ[k]).join(" / "))))];
const tplMinutes = (ids, goal) => { const rest = { lose: 40, muscle: 75, strength: 105, general: 50 }[goal] || 60; return Math.round(ids.length * 3 * (30 + rest) / 60 / 5) * 5; };

function tplInfoCard(t) {
  const info = GOAL_INFO[t.goal], needs = tplEquipNeeds(t.ids), n = t.ids.length;
  const line = info ? `${n} hareket · 3 set × ${info.reps} · set arası ${info.rest} · yaklaşık ${tplMinutes(t.ids, t.goal)} dk` : `${n} hareket`;
  return `<article class="card tplc"><b>${esc(t.name)}</b><small style="display:block">${esc(t.desc)}</small><small style="display:block">${esc(line)}</small>
    <small style="display:block">${esc(mvNames(t.ids).join(", "))}</small>
    ${needs.length ? `<div><span class="bdg">Gereken ekipman: ${esc(needs.join(", "))}</span></div>` : `<div><span class="bdg">Ekipman gerekmez</span></div>`}
    <div class="row"><button class="btn pri" data-act="tplget" data-id="${t.id}">Şablonlarıma ekle</button></div></article>`;
}
const TIPS = [
  ["Haftayı kur", "Başlangıçta haftada 3 güç günü yeterli. Aralara esneme ya da dinlenme günü koy; aynı kas grubunu art arda iki gün çok yorma."],
  ["Hareketleri seç", "Bir antrenmanda 6–10 hareket yeterli. Büyük kas gruplarından (bacak, kalça) başla, sonra itme, çekme ve core ekle. İtme kadar çekme de koy ki vücut dengeli kalsın."],
  ["Set, tekrar, dinlenme", "Yağ yakımı ve genel form için 12–15 tekrar, kas için 8–12, güç için 5–8 tekrar. Set arası dinlenme sırayla yaklaşık 30–60, 60–90 ve 90–120 sn. Her harekette 2–3 set ile başla."],
  ["Zorluk ayarı", "Son 1–2 tekrar zorlayıcı ama formu bozmayacak düzeyde olsun. İnişi 2–3 sn yavaş yapmak hareketi zorlaştırır."],
  ["İlerleme", "Önce tekrar sayısını artır. Aralığın üstüne çıkınca hareketi zorlaştır (yük, tek bacak, yavaş tempo). Her şeyi aynı anda değiştirme, 3–4 haftada bir küçük değişiklik yeter."],
  ["Isınma ve soğuma", "Antrenmandan önce 5 dk hafif hareket ve eklem çevirmeleri, sonra yavaş yürüyüş ve nefes egzersizi ile bitir."],
  ["Kayıt tut", "Aynı hareketleri birkaç hafta sürdür ve değerlerini karşılaştır. Uygulamadaki \"Geçen seferi doldur\" bu işi kolaylaştırır."],
  ["Dinlenme ve uyku", "Kaslar dinlenirken gelişir. Düzenli uyku, yeterli su ve haftada en az bir dinlenme günü ilerlemeyi destekler."],
  ["Ağrıyı dinle", "Kas yorgunluğu normaldir; keskin ağrı, eklemde sıkışma ya da baş dönmesi olursa dur. Devam eden ağrı ya da sağlık sorunun varsa doktor ya da fizyoterapistle konuş. Bu bilgiler genel bilgidir, tıbbi tavsiye yerine geçmez."]
];
const TIPS_HOWTO = "Uygulamada: Program → bir güne dokun → ⋯ Diğer → \"Bu günü şablon olarak kaydet\". Sonra istediğin güne \"Hazır program uygula\" ile ekleyebilirsin.";
const secTemplates = p => {
  const keys = [...Object.keys(GOAL_INFO), ...(ahmetList().length ? ["ahmet"] : [])], g0 = ui.tg || (GOAL_INFO[p.goal] ? p.goal : "lose"), g = g0 === "ahmet" && !ahmetList().length ? "lose" : g0;
  const chips = keys.map(k => `<button class="btn ${g === k ? "pri" : ""}" data-act="tplgoal" data-goal="${k}">${k === "ahmet" ? "Ahmet'in programı" : GOAL_INFO[k].label}</button>`).join("");
  const list = g === "ahmet" ? tplExtraBuiltins().filter(t => t.author) : tplExtraBuiltins().filter(t => t.goal === g);
  const why = GOAL_INFO[g] ? `<small>${esc(GOAL_INFO[g].why)}</small>` : `<small>Ahmet'in kendi programı. İstersen olduğu gibi al, istersen kendine göre değiştir.</small>`;
  return `<details class="card fold" data-fold="tpl" ${ui.open.tpl ? "open" : ""}><summary><h3>Önerilen şablonlar</h3></summary>
    <small>Amacını seç, hazır şablonları Şablonlarım'a ekle. Eklediğin şablonu istediğin gibi değiştirebilirsin.</small>
    <div class="row" style="margin:10px 0">${chips}</div>${why}<div style="margin-top:10px">${list.map(tplInfoCard).join("")}</div></details>
  <details class="card fold" data-fold="tips" ${ui.open.tips ? "open" : ""}><summary><h3>Kendi programını hazırlarken tüyolar</h3></summary>
    ${TIPS.map(([h, t]) => `<p><b>${esc(h)}.</b> ${esc(t)}</p>`).join("")}<small>${esc(TIPS_HOWTO)}</small></details>`;
};
function addBuiltinToMine(id) {
  const t = tplExtraBuiltins().find(x => x.id === id); if (!t) return;
  if (S.presets.some(p => p.src === t.id)) { toast("Bu şablon zaten Şablonlarım'da"); return; }
  let name = t.name, i = 2; while (S.presets.some(p => p.name === name)) name = `${t.name} (${i++})`;
  S.presets.push({ id: "c-" + Date.now(), name, type: t.type, ids: [...t.ids], src: t.id }); save(); toast(`${t.name} şablonlarına eklendi`);
}
