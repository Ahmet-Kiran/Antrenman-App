// Uçtan uca tarayıcı testi. Kurulum: npm install && npx playwright install chromium; çalıştırma: npm test
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium, devices } = require("playwright");
const ROOT = path.join(__dirname, "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split("?")[0].split("#")[0]).replace(/^\/$/, "/index.html"));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
const OUT = path.join(__dirname, "out"); fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "  ✓" : "  ✗ HATA:"} ${name}${cond ? "" : " " + extra}`); };
const NOW = new Date("2026-10-28T10:00:00");   // Çarşamba
const FRI = "2026-10-23", FRI0 = "2026-10-16";

async function open(browser, opts, url, pre) {
  const ctx = await browser.newContext({ acceptDownloads: true, ...opts }), page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/404|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: NOW });
  if (pre) pre(page);
  await page.goto(url); await page.waitForSelector("#app *"); page.errs = errs; return { ctx, page };
}
const pick = async (page, d) => { await page.click("#datebtn"); await page.click(`#sheetbody [data-date="${d}"]`); await page.waitForTimeout(550); };

async function suite(label, browser, opts, base) {
  console.log(`\n== ${label} ==`);
  const { ctx, page } = await open(browser, opts, base + "/index.html"); const sets = () => page.locator('input[data-act="set"]');
  ok("ilk açılışta kurulum sihirbazı", !(await page.$eval("#profile", e => e.hidden)));
  await page.click('[data-act="profskip"]');
  for (const t of ["b", "t", "h", "p"]) { await page.click(`#nav [data-tab="${t}"]`); await page.waitForTimeout(200); ok(`yatay taşma yok (${t})`, (await page.evaluate(() => innerWidth - document.documentElement.clientWidth)) === 0); }
  await page.click('#nav [data-tab="b"]');
  // --- Bugün düzeni
  await pick(page, FRI);
  const box = async s => page.$eval(s, e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top }; });
  const side = await box(".side"), main = await box(".main");
  if (label.startsWith("masaüstü")) ok("masaüstünde özet paneli sağda", side.l >= main.r - 1 && Math.abs(side.t - main.t) < 40, JSON.stringify({ side, main }));
  else ok("telefonda tek sütun", side.l < 40 && main.l < 40);
  // --- taslak, halkalar, yük
  await page.fill("#steps", "7000"); await sets().nth(0).fill("15"); await sets().nth(1).fill("12");
  await page.fill('input[data-act="load"]', "8");
  ok("adım halkası güncellendi", (await page.textContent("#stepring")).includes("7.000"));
  ok("hareket halkası 1/18", (await page.textContent("#prog")).includes("1/18"));
  await page.click('#nav [data-tab="t"]'); await page.click('#nav [data-tab="b"]'); await page.waitForTimeout(250);     // sekme değişince otomatik kayıt
  const rec = await page.evaluate(d => JSON.parse(localStorage.getItem("antrenman.v2")).days[d], FRI);
  ok("kaydedildi (adım, set, yük)", rec && rec.steps === 7000 && rec.sets.sq[0] === 15 && rec.load.sq === 8);
  // --- kutlama: tüm hareketler
  await pick(page, FRI0); const n = await sets().count();
  for (let i = 0; i < n; i += 3) await sets().nth(i).fill("10");
  await page.waitForTimeout(200);
  ok("tüm hareketler tamamlanınca kutlama", (await page.locator(".confetti").count()) > 0 || /tamam/i.test(await page.textContent("#toast")));
  await page.click('#nav [data-tab="t"]'); await page.click('#nav [data-tab="b"]'); await page.waitForTimeout(200);
  // --- örnek veriyle Takip
  await page.evaluate(() => {
    const S = JSON.parse(localStorage.getItem("antrenman.v2")), k = d => { const x = new Date(Date.now() - d * 864e5); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
    for (let i = 1; i <= 14; i++) { const t = new Date(Date.now() - i * 864e5).getDay(); S.days[k(i)] ||= { steps: 4000 + (i * 733) % 6000, sets: t % 2 ? { sq: [14, 12, 10], pu: [10, 8, 7] } : {}, checks: {}, done: i % 3 !== 0, type: t % 2 ? "g" : "e" }; }
    for (let i = 0; i < 6; i++) { S.metrics[k(i * 4)] = { weight: 72 - i * 0.4, waist: 84 - i * 0.5 }; S.calories[k(i)] = 2000 + i * 50; }
    S.profile = { onboarded: true, age: 30, sex: "e", height: 178, goal: "muscle", targetWeight: 70, equip: { bar: true, dumbbell: true, chair: true, bag: true }, steps: 8000 };
    localStorage.setItem("antrenman.v2", JSON.stringify(S));
  });
  await page.reload(); await page.waitForSelector("#app *");
  ok("yedek hatırlatma kartı (3+ gün, yedek yok)", (await page.locator(".banner").count()) === 1);
  await page.click('.banner [data-act="snooze"]'); await page.waitForTimeout(200);
  ok("3 gün sonra hatırlat → kart gizlendi", (await page.locator(".banner").count()) === 0);
  await page.click('#nav [data-tab="t"]'); await page.waitForTimeout(400);
  ok("takipte grafikler (en az 4 svg)", (await page.locator("svg.chart").count()) >= 4);
  ok("ısı haritası 35 hücre", (await page.locator(".hm-c").count()) === 35);
  ok("seri ve hacim kartları", (await page.textContent(".statgrid")).includes("gün") || (await page.textContent("#app")).includes("güncel seri"));
  ok("takipte taşma yok", (await page.evaluate(() => innerWidth - document.documentElement.clientWidth)) === 0);
  await page.screenshot({ path: path.join(OUT, `ekran-${label.split(" ")[0]}-takip.png`), fullPage: true });
  // --- Kayıt: kalori halkası
  ok("kayıt özeti ve hedefler", (await page.locator("#entry .nchip").count()) === 3 && /hedef/i.test(await page.textContent("#app")));
  // --- Havuz
  await page.click('#nav [data-tab="h"]'); await page.waitForTimeout(300);
  ok("havuz kartlarında alan rengi", (await page.locator("article.pc").count()) > 20);
  ok("ekipman filtresi: masa gerektiren gizli", !(await page.textContent("#list")).includes("Inverted Row"));
  await page.screenshot({ path: path.join(OUT, `ekran-${label.split(" ")[0]}-havuz.png`) });
  // --- Program: tema, vurgu, preset paylaşma
  await page.click('#profbtn'); await page.waitForTimeout(250);
  await page.selectOption('[data-act="theme"]', "dark"); await page.click('[data-act="accent"][data-v="blue"]'); await page.waitForTimeout(150);
  ok("koyu tema ve mavi vurgu uygulandı", await page.evaluate(() => document.documentElement.dataset.theme === "dark" && document.documentElement.dataset.accent === "blue"));
  await page.screenshot({ path: path.join(OUT, `ekran-${label.split(" ")[0]}-profil-koyu.png`) });
  await page.click('[data-act="profclose"]'); await page.waitForTimeout(150);
  await page.click('#nav [data-tab="p"]'); await page.waitForTimeout(300);
  const dlg = []; page.on("dialog", async d => { dlg.push({ type: d.type(), msg: d.message(), def: d.defaultValue() }); await d.accept(); });
  const presets = () => page.evaluate(() => JSON.parse(localStorage.getItem("antrenman.v2")).presets);
  // Program: gün menüsü açılıyor (şablon akışının ayrıntılı testi yeni arayüze göre henüz yazılmadı)
  await page.locator('details[data-fold="day1"] summary').click(); await page.waitForTimeout(200);
  await page.locator('[data-act="daymenu"][data-day="1"]').click(); await page.waitForTimeout(350);
  ok("gün menüsü açıldı", (await page.locator("#sheetbody").textContent()).trim().length > 10);
  await page.click('#sheetbody [data-act="closesheet"]').catch(() => {}); await page.waitForTimeout(250);
  ok("program sekmesinde yedek kartı görünüyor", (await page.locator('#app [data-act="export"]').count()) >= 1);
  await page.click('#nav [data-tab="b"]'); await page.waitForTimeout(250);
  ok("ana ekrana ekle ipucu yalnızca telefonda", (await page.locator(".tipbox").count()) === (label.startsWith("telefon") ? 1 : 0));
  ok("başlık kesilmiyor", await page.$eval("header h1", e => e.scrollWidth <= e.clientWidth + 1));
  await page.click('#nav [data-tab="p"]'); await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, `ekran-${label.split("\u0020")[0]}-program.png`), fullPage: true });
  // --- yedek: Profilim > Ayarlar
  const openSet = async () => { if (await page.$eval("#profile", e => e.hidden)) await page.click('[data-act="openprofile"]'); await page.waitForTimeout(300); await page.evaluate(() => { const d = document.querySelector('#profile details[data-fold="set"]'); if (d) d.open = true; }); await page.waitForTimeout(200); };
  await openSet();
  ok("kalıcı depolama satırı görünüyor", /alıcı depolama/.test(await page.textContent("#persistline")));
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }).catch(() => null), page.click('#profile [data-act="export"]')]);
  ok("yedek indirildi", !!dl);
  // --- yedek gidiş-dönüş (sarılı biçim), eski ham biçim ve geri al
  const bakFile = await dl.path(), nDays = () => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("antrenman.v2")).days).length);
  const nBefore = await nDays();
  await page.evaluate(() => { const S = JSON.parse(localStorage.getItem("antrenman.v2")); S.days = {}; localStorage.setItem("antrenman.v2", JSON.stringify(S)); });
  await page.reload(); await page.waitForSelector("#app *");
  await openSet();
  await page.setInputFiles("#file", bakFile); await page.waitForTimeout(600);
  ok("yedekten yükleme: kayıtlar geri geldi", nBefore > 5 && (await nDays()) === nBefore, `önce ${nBefore}`);
  ok("yükleme öncesi geri al kopyası alındı", await page.evaluate(() => !!localStorage.getItem("antrenman.v2.undo")));
  await openSet();
  await page.click('#profile [data-act="undo"]'); await page.waitForTimeout(500);
  ok("geri al: yükleme öncesi duruma döndü", (await nDays()) === 0);
  const raw = await page.evaluate(() => JSON.stringify({ days: { "2026-10-01": { steps: 1234, sets: {}, checks: {}, done: false } }, plan: JSON.parse(localStorage.getItem("antrenman.v2")).plan }));
  await page.setInputFiles("#file", { name: "ham.json", mimeType: "application/json", buffer: Buffer.from(raw) }); await page.waitForTimeout(500);
  ok("eski ham yedek biçimi de yükleniyor", await page.evaluate(() => JSON.parse(localStorage.getItem("antrenman.v2")).days["2026-10-01"]?.steps === 1234));
  await page.setInputFiles("#file", { name: "bozuk.json", mimeType: "application/json", buffer: Buffer.from('{"a":1}') }); await page.waitForTimeout(300);
  ok("geçersiz dosya kayıtları bozmadı", await page.evaluate(() => JSON.parse(localStorage.getItem("antrenman.v2")).days["2026-10-01"]?.steps === 1234));
  await page.reload(); await page.waitForSelector("#app *");
  if (!(await page.$eval("#profile", e => e.hidden))) await page.click('#profile [data-act="profskip"], #profile [data-act="profclose"]');
  // --- kalori: "Yapıldı" işaretli ama set girilmemişse plana göre tahmin
  const kc = await page.evaluate(() => { const k = "2026-09-14"; S.days[k] = { steps: 0, sets: {}, checks: {}, done: true }; const b = dayBurn(S.days[k], 70, k); const none = dayBurn({ sets: {}, done: false }, 70, k); delete S.days[k]; save(); return [Math.round(b.total), b.est, none.total]; });
  ok("yapıldı işaretli ama set yoksa kalori tahmini var", kc[0] > 20 && kc[1] === true && kc[2] === 0, String(kc));
  // --- önerilen şablonlar ve Ahmet'in programı
  const hasAhmet = await page.evaluate(() => typeof ahmetTemplates === "function");
  const gate = await page.evaluate(() => { S.profile.name = "Dilara"; const n = tplExtraBuiltins().filter(t => t.author).length; openTplPicker(1, "a"); const tabs = document.querySelector("#sheetbody").innerText; closeSheet(); return [n, /Ahmet/.test(tabs.split("Benimkiler")[0])]; });
  ok("adı Ahmet olmayanda Ahmet'in programı görünmüyor (dosya yoksa hiç yok)", gate[0] === 0 && gate[1] === false, String(gate));
  await page.evaluate(() => { S.profile.name = "Ahmet"; save(); });
  const tp = await page.evaluate(() => { const all = tplExtraBuiltins(), goals = {}; GOAL_TPL.forEach(t => goals[t.goal] = (goals[t.goal] || 0) + 1);
    return { n: all.length, goals, ids: all.every(t => t.ids.length >= 8 && t.ids.every(id => BY_ID.has(id)) && new Set(t.ids).size === t.ids.length), ahmet: ((all.find(t => t.id === "b-ahmet-g") || { ids: [] }).ids).join(","), ae: (all.find(t => t.id === "b-ahmet-e") || { ids: [] }).ids.length }; });
  ok("her amaç için 3 önerilen şablon", Object.values(tp.goals).length === 4 && Object.values(tp.goals).every(n => n === 3), JSON.stringify(tp.goals));
  ok("şablonlardaki tüm hareketler havuzda var, tekrar yok", tp.ids);
  ok("Ahmet'in programı: dosya varsa kendi hareketleri, yoksa hiç yok", hasAhmet ? (tp.ahmet.length > 0 && tp.ae >= 10) : tp.ahmet === "", tp.ahmet);
  await page.evaluate(() => openTplPicker(1, "a")); await page.waitForTimeout(250);
  ok("şablon seçicide Ahmet sekmesi: dosya varsa 3 şablon, yoksa sekme yok", hasAhmet ? (await page.locator("#sheetbody .tplc").count()) === 3 : (await page.locator('#sheetbody [data-act="tpltab"][data-tab="a"]').count()) === 0);
  await page.evaluate(() => openTplPicker(1, "r")); await page.waitForTimeout(250);
  ok("şablon seçicide Önerilen sekmesi 12 şablon gösteriyor", (await page.locator("#sheetbody .tplc").count()) === 12);
  await page.evaluate(() => closeSheet());
  await page.evaluate(() => openProfile(false)); await page.waitForTimeout(250);
  await page.evaluate(() => { const d = document.querySelector('#profile details[data-fold="tpl"]'); d.open = true; }); await page.waitForTimeout(150);
  await page.click('#profile [data-act="tplgoal"][data-goal="muscle"]'); await page.waitForTimeout(250);
  ok("Profilim'de seçilen amacın 3 şablonu görünüyor", (await page.locator("#profile .tplc").count()) === 3);
  ok("tüyolar bölümü var", (await page.locator('#profile details[data-fold="tips"]').count()) === 1);
  const pBefore = await page.evaluate(() => S.presets.length);
  await page.click('#profile [data-act="tplget"]'); await page.waitForTimeout(250);
  ok("Şablonlarıma ekle çalışıyor", (await page.evaluate(() => S.presets.length)) === pBefore + 1);
  await page.click('#profile [data-act="tplget"]'); await page.waitForTimeout(200);
  ok("aynı şablon ikinci kez eklenmiyor", (await page.evaluate(() => S.presets.length)) === pBefore + 1);
  await page.evaluate(() => closeProfile());
  // --- beslenme: protein, su, takip ve kalori alt sınırı
  await page.click('#nav [data-tab="t"]'); await page.waitForTimeout(300);
  await page.fill("#protein", "130"); await page.fill("#water", "8"); await page.waitForTimeout(1200);
  ok("kendiliğinden kaydedildi işareti", /Kaydedildi/.test(await page.textContent("#entrysave")));
  ok("protein ve su kaydediliyor", await page.evaluate(() => { const n = S.nutrition[ui.mDate]; return n && n.protein === 130 && n.water === 8; }));
  ok("günlük özet çipleri görünüyor", (await page.locator("#entry .nchip").count()) === 3);
  ok("protein ve su grafikleri var", (await page.locator("#app h3:has-text('Protein (g)')").count()) === 1 && (await page.locator("#app h3:has-text('Su (bardak)')").count()) === 1);
  const d0 = await page.evaluate(() => ui.mDate);
  await page.fill("#weight", "71.5"); await page.fill("#cal", "1800"); await page.waitForTimeout(1200);
  ok("kilo ve kalori kendiliğinden kaydedildi", await page.evaluate(() => S.metrics[ui.mDate]?.weight === 71.5 && S.calories[ui.mDate] === 1800));
  await page.fill("#cal", ""); await page.waitForTimeout(1200);
  ok("boş bırakılan alan silindi, diğerleri durdu", await page.evaluate(() => S.calories[ui.mDate] === undefined && S.metrics[ui.mDate]?.weight === 71.5));
  await page.fill("#waist", "80"); await page.fill('#entry [data-act="mdate"]', "2026-10-20"); await page.waitForTimeout(600);
  ok("tarih değişince yazılan önceki güne kaydedildi", await page.evaluate(d => S.metrics[d]?.waist === 80, d0));
  ok("başka güne bakarken Bugüne dön çıkıyor", (await page.locator('[data-act="mtoday"]').count()) === 1);
  await page.click('[data-act="mtoday"]'); await page.waitForTimeout(300);
  ok("Bugüne dön bugünü açıyor", (await page.evaluate(d => ui.mDate === d, d0)) && (await page.locator('[data-act="mtoday"]').count()) === 0);
  await page.evaluate(d => { delete S.metrics[d]; delete S.calories[d]; save(); }, d0);
  const nt = await page.evaluate(() => { const lo = calcTarget({ age: 60, height: 150, sex: "k", goal: "lose", steps: 3000 }, 40), hi = calcTarget({ age: 30, height: 180, sex: "e", goal: "general", steps: 8000 }, 80); return { loFloor: lo.floored && lo.target === 1200, hiOk: !hi.floored && hi.target > 1500, pt: proteinTarget(), wt: waterTarget() }; });
  ok("kalori hedefi güvenli alt sınırın altına düşmüyor", nt.loFloor && nt.hiOk, JSON.stringify(nt));
  ok("protein ve su hedefi makul", nt.pt >= 60 && nt.pt <= 220 && nt.wt >= 6 && nt.wt <= 20, `${nt.pt} g, ${nt.wt} bardak`);
  await page.evaluate(() => openProfile(false)); await page.waitForTimeout(250);
  ok("Profilim'de Beslenme tüyoları bölümü var", (await page.locator('#profile details[data-fold="food"]').count()) === 1);
  await page.evaluate(() => { closeProfile(); delete S.nutrition[ui.mDate]; save(); });
  // --- esnek kullanım: set sayısı, kısa antrenman, kısmen yapıldı, bugün farklı yaptım, boş günler
  const fx = await page.evaluate(() => {
    const r = {}; S.profile.sets = 4;
    const dd = { sets: {}, extra: [] }; r.cards4 = (moveCard(BY_ID.get("sq"), dd).match(/data-i=/g) || []).length; r.short2 = setsFor({ short: true });
    S.profile.sets = 5; r.cards5 = (moveCard(BY_ID.get("sq"), dd).match(/data-i=/g) || []).length; delete S.profile.sets; r.def3 = setCount();
    const ids18 = S.plan[1].ids; r.n18 = ids18.length; const sh = programIds({ sets: {}, extra: [], short: true }, { ids: ids18 }); r.shortN = sh.length; r.shortOrder = sh.every((id, i) => i === 0 || ids18.indexOf(sh[i - 1]) < ids18.indexOf(id));
    const k = "2026-09-21", half = Math.ceil(ids18.length / 2); const mk = n => { const d = { steps: 0, sets: {}, checks: {}, done: false }; ids18.slice(0, n).forEach(id => d.sets[id] = [10, 10, 10]); return d; };
    S.days[k] = mk(half - 1); r.pNo = isPartial(k); S.days[k] = mk(half); r.pYes = isPartial(k); r.streakPartial = streaks().cur >= 0; S.days[k].done = true; r.pDone = isPartial(k); delete S.days[k];
    const kc = "2026-09-22"; S.days[kc] = { steps: 0, sets: {}, checks: {}, done: true, short: true }; const b = dayBurn(S.days[kc], 70, kc); r.estShort = b.est && b.total > 0; S.days[kc].short = false; const b2 = dayBurn(S.days[kc], 70, kc); r.estFull = b2.total > b.total; delete S.days[kc]; save();
    r.cap = logCaption([["a", 100], ["b", null], ["c", 300]], "kcal"); return r; });
  ok("set sayısı ayarı: 4 ve 5 set kutusu, varsayılan 3, kısa modda 2", fx.cards4 === 4 && fx.cards5 === 5 && fx.def3 === 3 && fx.short2 === 2, JSON.stringify(fx));
  ok("kısa antrenman en çok 5 hareket ve sırayı koruyor", fx.shortN === 5 && fx.shortOrder && fx.n18 >= 8);
  ok("kısmen yapıldı: yarısından azı değil, yarısı ve fazlası evet, bitince hayır", fx.pNo === false && fx.pYes === true && fx.pDone === false);
  ok("kısa antrenman kalori tahmini daha düşük, tam daha yüksek", fx.estShort && fx.estFull);
  ok("boş günler: kayıtlı gün sayısı ve ortalama", /2\/3 gün kayıt/.test(fx.cap) && /200/.test(fx.cap) && /kayıt girilmedi/.test(fx.cap), fx.cap);
  await page.click('#nav [data-tab="b"]'); await page.waitForTimeout(300);
  ok("Bugün ekranında kısa antrenman ve farklı yaptım düğmeleri var", (await page.locator('[data-act="shorttoggle"]').count()) === 1 && (await page.locator('[data-act="altmenu"]').count()) === 1);
  const nFull = await page.evaluate(() => programIds(working(ui.date), planOf(ui.date)).length);
  await page.click('[data-act="shorttoggle"]'); await page.waitForTimeout(300);
  ok("kısa antrenman açılınca hareket sayısı azalıyor", await page.evaluate(n => programIds(working(ui.date), planOf(ui.date)).length <= 5 && (n <= 5 || programIds(working(ui.date), planOf(ui.date)).length < n), nFull));
  await page.click('[data-act="shorttoggle"]'); await page.waitForTimeout(300);
  ok("kısa antrenman kapanınca tam liste geri geliyor", (await page.evaluate(() => programIds(working(ui.date), planOf(ui.date)).length)) === nFull);
  await page.click('[data-act="altmenu"]'); await page.waitForTimeout(300);
  ok("farklı yaptım menüsünde 7 günün planı var", (await page.locator('#sheetbody [data-act="altday"]').count()) === 7);
  await page.click('#sheetbody [data-act="altrest"]'); await page.waitForTimeout(400);
  ok("dinlenme günü yaptım: bugün dinlenme, haftalık plan değişmedi", await page.evaluate(() => planOf(ui.date).type === "r" && S.plan[parse(ui.date).getDay()] !== planOf(ui.date)));
  ok("rozet ve Planıma dön görünüyor", /Dinlenme günü/.test(await page.textContent(".hero")));
  await page.click('[data-act="altmenu"]'); await page.waitForTimeout(250); await page.click('#sheetbody [data-act="altoff"]'); await page.waitForTimeout(400);
  ok("Planıma dön: plan geri geldi", await page.evaluate(() => planOf(ui.date) === S.plan[parse(ui.date).getDay()] && !working(ui.date).alt));
  await page.click('[data-act="altmenu"]'); await page.waitForTimeout(250); await page.click('#sheetbody [data-act="altpick"]'); await page.waitForTimeout(300);
  await page.locator('#sheetbody [data-act="tplapply"]').first().click(); await page.waitForTimeout(400);
  ok("şablondan bugüne uygulandı, haftalık plan aynı kaldı", await page.evaluate(() => { const a = working(ui.date).alt; return !!a && a.ids.length > 0 && S.plan[parse(ui.date).getDay()] !== a; }));
  await page.evaluate(() => { setAlt(ui.date, null); autosave(); const d = S.days[ui.date]; if (d && !d.done && !Object.keys(d.sets).length) { delete S.days[ui.date]; save(); } });
  // --- v13: yeni hareketler, ısınma/soğuma, kendi seçimi, gün kartı, haftayı doldur
  const snap = await page.evaluate(() => ({ days: JSON.stringify(S.days), presets: JSON.stringify(S.presets), plan: JSON.stringify(S.plan), met: JSON.stringify(S.metrics) }));
  const lib = await page.evaluate(() => { const by = a => LIB.filter(m => m.area === a).length, all = [...WARM_PACKS, ...COOL_PACKS].flatMap(p => p.ids);
    return { n: LIB.length, warm: by("Isınma"), cool: by("Soğuma"), cardio: by("Kardiyo"), packsOk: all.every(id => BY_ID.has(id)), noWarmInDay: !LIB.filter(m => dayRole("g", m)).some(m => m.role === "isinma" || m.role === "soguma"), kinds: ["g", "k", "w", "c", "e"].map(k => LIB.filter(m => roleKind(m) === k).length), kcal: moveKcal(BY_ID.get("cardio-burpee"), [10], 70) > 0, tags: !!TAGS["wide-pull-up"] && TAGS["cardio-treadmill-fast-walk"].equip[0] === "treadmill" }; });
  ok("kütüphane: ısınma, soğuma ve kardiyo ayrı bölgeler, toplam 148", lib.n === 148 && lib.warm === 12 && lib.cool === 4 && lib.cardio === 7 && lib.kinds.join() === "90,7,12,4,35", JSON.stringify(lib));
  ok("paketlerdeki tüm hareketler var; ısınma ve soğuma günün listesine girmiyor; kardiyo kalorisi var; etiketler var", lib.packsOk && lib.noWarmInDay && lib.kcal && lib.tags);
  await page.click('#nav [data-tab="b"]'); await page.waitForTimeout(250);
  await page.evaluate(() => { ui.open.w = true; ui.open.c = true; render(); }); await page.waitForTimeout(250);
  ok("ısınma listesi paket olarak görünüyor (8 satır, bilgi düğmesi)", (await page.locator('details[data-fold="w"] .ckrow').count()) === 8 && (await page.locator('details[data-fold="w"] .ckinfo').count()) === 8);
  await page.locator('details[data-fold="w"] input[data-act="check"]').first().check(); await page.waitForTimeout(250);
  ok("ısınma sayacı 1/8", /^1\/8$/.test((await page.textContent("#cnt-w")).trim()));
  await page.click('[data-act="warmmenu"][data-kind="w"]'); await page.waitForTimeout(250);
  ok("ısınma menüsünde 5 paket", (await page.locator("#sheetbody .packrow").count()) === 5);
  await page.click('#sheetbody [data-act="warmpick"][data-pack="alt"][data-scope="day"]'); await page.waitForTimeout(300);
  ok("Sadece bugün: alt vücut paketi geldi, plan değişmedi", await page.evaluate(() => warmIds(ui.date, "w").join() === WARM_PACKS.find(p => p.key === "alt").ids.join() && !S.plan[parse(ui.date).getDay()].warm));
  await page.click('[data-act="warmmenu"][data-kind="w"]'); await page.waitForTimeout(250); await page.click('#sheetbody [data-act="warmpick"][data-pack="kisa"][data-scope="plan"]'); await page.waitForTimeout(300);
  ok("Planda hep: günün planına işlendi, bugünkü seçim kalktı", await page.evaluate(() => S.plan[parse(ui.date).getDay()].warm?.pack === "kisa" && !working(ui.date).warm && warmIds(ui.date, "w").length === 4));
  await page.click('[data-act="warmmenu"][data-kind="c"]'); await page.waitForTimeout(250); await page.click('#sheetbody [data-act="warmown"]'); await page.waitForTimeout(250);
  await page.fill("#ownq", "cat"); await page.waitForTimeout(200);
  ok("seçicide arama çalışıyor", (await page.locator("#ownlist .ownrow").count()) >= 1 && (await page.locator("#ownlist .ownrow").count()) < 10);
  await page.locator("#ownlist input[data-own]").first().check(); const firstOwn = await page.locator("#ownlist input[data-own]").first().getAttribute("data-own");
  await page.fill("#ownq", ""); await page.waitForTimeout(200); await page.locator('#ownlist input[data-own="cool-walk"]').check();
  ok("seçim sayısı ve uygula düğmesi güncelleniyor", /2 hareket/.test(await page.textContent("#ownn")) && !(await page.locator('[data-act="ownapply"]').first().isDisabled()));
  await page.click('[data-act="ownapply"][data-key="day"]'); await page.waitForTimeout(300);
  ok("kendi soğuma listem: seçilen iki hareket, seçme sırasıyla", await page.evaluate(f => { const l = warmIds(ui.date, "c"); return l.length === 2 && l[0] === f && l[1] === "cool-walk"; }, firstOwn));
  await page.click('[data-act="altmenu"]'); await page.waitForTimeout(250); await page.click('#sheetbody [data-act="altown"]'); await page.waitForTimeout(250);
  await page.fill("#ownq", "squat"); await page.waitForTimeout(200);
  await page.locator("#ownlist input[data-own]").nth(0).check(); await page.locator("#ownlist input[data-own]").nth(1).check();
  await page.check("#ownsave"); await page.fill("#ownname", "Test seçim"); await page.click('[data-act="ownapply"][data-key="go"]'); await page.waitForTimeout(400);
  ok("farklı yaptım > kendi hareketlerim: gün ve şablon kaydı", await page.evaluate(() => { const a = working(ui.date).alt; return a && a.ids.length === 2 && a.label === "Kendi seçimim" && S.presets.some(p => p.name === "Test seçim" && p.ids.length === 2); }));
  await page.click('[data-act="altmenu"]'); await page.waitForTimeout(250); await page.click('#sheetbody [data-act="altact"]'); await page.waitForTimeout(250);
  await page.selectOption("#altActType", "4"); await page.fill("#altActMin", "60"); await page.fill("#altActName", "halı saha"); await page.click('[data-act="altactsave"]'); await page.waitForTimeout(400);
  ok("başka aktivite: gün yapıldı, kayıt ve başlık", await page.evaluate(() => { const d = working(ui.date); return d.done === true && d.acts.length === 1 && d.alt.act === true; }) && /halı saha 60 dk/.test(await page.textContent(".hero h2")));
  await page.evaluate(s => { S.days = JSON.parse(s.days); S.presets = JSON.parse(s.presets); S.plan = JSON.parse(s.plan); S.metrics = JSON.parse(s.met); ui.draft = null; ui.pending = false; ui.date = today; ui.fi = {}; ui.cel = {}; save(); render(); }, snap);
  // gün kartı
  const k0 = "2026-08-10";
  await page.click('#nav [data-tab="t"]'); await page.waitForTimeout(250); await page.evaluate(k => openDayInfo(k), k0); await page.waitForTimeout(250);
  ok("gün kartında 3 durum düğmesi ve hızlı alanlar", (await page.locator('#sheetbody [data-act="daystat"]').count()) === 3 && (await page.locator("#dq-steps").count()) === 1 && (await page.locator("#dq-weight").count()) === 1);
  await page.click('#sheetbody [data-act="daystat"][data-st="done"]'); await page.waitForTimeout(250);
  ok("Yaptım: gün yapıldı", await page.evaluate(k => S.days[k]?.done === true, k0));
  await page.click('#sheetbody [data-act="daystat"][data-st="partial"]'); await page.waitForTimeout(250);
  ok("Kısmen: yapıldı kalkar, kısmen olur", await page.evaluate(k => S.days[k].done === false && isPartial(k) === true, k0));
  await page.click('#sheetbody [data-act="daystat"][data-st="none"]'); await page.waitForTimeout(250);
  ok("Yapmadım: kısmen de kalkar", await page.evaluate(k => !isPartial(k) && !S.days[k]?.done, k0));
  await page.locator("#dq-steps").fill("4321"); await page.locator("#dq-steps").blur(); await page.locator("#dq-weight").fill("71.2"); await page.locator("#dq-weight").blur(); await page.waitForTimeout(250);
  ok("hızlı adım ve kilo kaydedildi", await page.evaluate(k => S.days[k]?.steps === 4321 && S.metrics[k]?.weight === 71.2, k0));
  await page.click('#sheetbody [data-act="pick"]'); await page.waitForTimeout(400);
  ok("güne gidince üstte düzenleniyor şeridi ve İlerleme'ye dön", await page.evaluate(k => ui.tab === "b" && ui.date === k && ui.from === "t", k0) && (await page.locator(".datebanner").count()) === 1 && (await page.locator('.datebanner [data-act="backtrack"]').count()) === 1);
  await page.click('[data-act="backtrack"]'); await page.waitForTimeout(300);
  ok("İlerleme'ye dön: bugüne ve İlerleme sekmesine döner, şerit kalkar", await page.evaluate(() => ui.tab === "t" && ui.date === today) && (await page.locator(".datebanner").count()) === 0);
  // haftayı doldur
  await page.click('[data-act="weekfill"]'); await page.waitForTimeout(300);
  const wk = await page.evaluate(() => ({ fut: weekDays(0).filter(k => k > today).length, past: weekDays(0).find(k => k < today) }));
  ok("haftayı doldur: 7 satır, gelecek günler pasif", (await page.locator("#sheetbody .wkrow").count()) === 7 && (await page.locator("#sheetbody .wkrow.fut").count()) === wk.fut);
  await page.click(`#sheetbody [data-act="wkst"][data-date="${wk.past}"][data-st="done"]`); await page.waitForTimeout(250);
  await page.locator(`#sheetbody .wkstep[data-date="${wk.past}"]`).fill("5000"); await page.locator(`#sheetbody .wkstep[data-date="${wk.past}"]`).blur(); await page.waitForTimeout(250);
  ok("haftayı doldur: durum ve adım kaydedildi", await page.evaluate(k => S.days[k]?.done === true && S.days[k].steps === 5000, wk.past));
  await page.click('#sheetbody [data-act="wkprev"]'); await page.waitForTimeout(250);
  ok("önceki hafta açılıyor, sonraki aktif", !/Bu hafta/.test(await page.textContent("#sheetbody b")) && !(await page.locator('#sheetbody [data-act="wknext"]').isDisabled()));
  await page.evaluate(() => closeSheet());
  await page.evaluate(s => { S.days = JSON.parse(s.days); S.presets = JSON.parse(s.presets); S.plan = JSON.parse(s.plan); S.metrics = JSON.parse(s.met); ui.draft = null; ui.pending = false; ui.date = today; ui.tab = "b"; ui.fi = {}; ui.cel = {}; save(); render(); }, snap);
  // --- APK uyumu (Capacitor taklit edilir)
  await page.evaluate(() => { ui.date = today; ui.tab = "b"; ui.draft = null; render(); });
  const nat = await page.evaluate(async () => {
    const r = { web: isNative() };
    window.Capacitor = { isNativePlatform: () => true, Plugins: { Filesystem: { writeFile: async o => { window.__fs = o; return { uri: "file:///cache/" + o.path }; } }, Share: { share: async o => { window.__sh = o; } }, App: { exitApp: () => { window.__exit = true; } } } };
    r.native = isNative(); r.tip = tipNeeded();
    await exportData(false);
    r.fsOk = !!window.__fs && /yedek-\d{4}/.test(window.__fs.path) && !!JSON.parse(window.__fs.data).data.plan && window.__fs.directory === "CACHE"; r.shUrl = !!window.__sh && window.__sh.url.startsWith("file://");
    ui.tab = "p"; render(); onBackButton(); r.back1 = ui.tab === "b";
    showSheet("<p>x</p>"); onBackButton(); r.back2 = !$("#sheet").classList.contains("open");
    onBackButton(); r.exit = window.__exit === true;
    delete window.Capacitor; delete window.__fs; delete window.__sh; delete window.__exit; r.after = isNative(); return r; });
  ok("APK uyumu: yedek yerel dosyaya yazılıp paylaşım menüsü açılıyor", nat.native && nat.fsOk && nat.shUrl, JSON.stringify(nat));
  ok("APK uyumu: kurulum ipucu gizli, geri tuşu panel, sekme, çıkış sırasıyla", nat.tip === false && nat.back1 && nat.back2 && nat.exit && nat.after === false && nat.web === false, JSON.stringify(nat));
  // --- güvenlik: içe aktarılan veri, paylaşım bağlantısı, içerik güvenlik politikası (CSP)
  const snapAll = await page.evaluate(() => JSON.stringify(S));
  const fid = await page.evaluate(() => { const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v)) ? Object.keys(v).sort().reduce((r, kk) => (r[kk] = v[kk], r), {}) : v);
    const a = JSON.parse(JSON.stringify(S)), b = cleanState(JSON.parse(JSON.stringify(S))), paths = [];
    const walk = (x, y, p) => { if (canon(x) === canon(y)) return; if (x && y && typeof x === "object" && typeof y === "object" && !Array.isArray(x) && !Array.isArray(y)) { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], p + "." + k); } else paths.push(p); };
    walk(a, b, "S"); return paths.slice(0, 8); });
  ok("temizleyici gerçek verini bozmuyor (bilinen alan kaybı yok)", fid.length === 0, fid.join(", "));
  const evil = await page.evaluate(async () => {
    const P = `"'><img src=x onerror="window.__xss=1"><svg onload="window.__xss=1"><b>`, r = { err: [] };
    const mut = (o, mode) => Array.isArray(o) ? o.map(x => mut(x, mode)) : (o && typeof o === "object") ? Object.fromEntries(Object.entries(o).map(([k, v]) => [/^\d{4}-\d\d-\d\d$/.test(k) && mode === "all" ? P : k, mut(v, mode)])) : (typeof o === "string" && (mode === "all" || /^(Test|Benim|Futbol|Kendi)/.test(o))) ? P : (typeof o === "number" && mode === "all") ? P : o;
    S.profile.name = "Test"; S.presets.push({ id: "c-zz", name: "Benim", type: "g", ids: ["sq", "pu"] }); S.days[today] = { ...(S.days[today] || { steps: 0, sets: {}, checks: {}, done: false }), acts: [{ id: "a1", name: "Futbol", min: 30, met: 7 }], alt: { type: "g", ids: ["sq"], label: "Kendi seçimim" } };
    const seed = JSON.parse(JSON.stringify(S)), screens = () => { const t = (n, f) => { try { f(); } catch (e) { r.err.push(n + ": " + String(e.message).slice(0, 60)); } };
      for (const tab of ["b", "t", "h", "p"]) t("tab " + tab, () => { ui.tab = tab; render(); });
      t("profile", () => { openProfile(false); document.querySelectorAll("#profile details").forEach(d => d.open = true); renderProfile(); closeProfile(); });
      Object.keys(S.days).slice(0, 3).concat([today]).forEach(k => { t("day", () => openDayInfo(k)); t("view", () => { ui.date = k; ui.tab = "b"; render(); }); });
      t("week", () => openWeekFill(0)); ["g", "e", "r", "m"].forEach(x => t("picker", () => openTplPicker(1, x))); t("warm", () => openWarmMenu("w")); t("alt", () => openAltMenu()); closeSheet(); ui.date = today; ui.tab = "b"; render(); };
    for (const mode of ["all", "names"]) { await importData(new File([JSON.stringify({ app: "x", data: mut(seed, mode) })], "bad.json")); screens(); r[mode] = window.__xss || 0; }
    r.nameKept = S.presets.some(p => /<img/.test(p.name)) || /<img/.test(S.profile.name || ""); r.protoSafe = ({}).polluted === undefined;
    return r; });
  ok("kötü niyetli yedek (tüm alanlar): kod çalışmadı, uygulama çökmedi", evil.all === 0 && evil.err.length === 0, JSON.stringify(evil));
  ok("kötü niyetli yedek (adlar): metin olarak kaldı, kod çalışmadı", evil.names === 0 && evil.nameKept && evil.protoSafe, JSON.stringify(evil));
  await page.evaluate(s => { S = JSON.parse(s); normalize(); ui.draft = null; ui.pending = false; ui.date = today; ui.tab = "b"; save(); render(); }, snapAll);
  const shr = await page.evaluate(() => { const P = `"'><img src=x onerror="window.__xss=7"><svg onload="window.__xss=7">`, r = {};
    r.ok = openShared(parseShare(shareUrl("p", { n: P, t: "<x>", i: ["sq", "pu", P, 5, null], f: P }))); r.imgs = document.querySelectorAll("#sheetbody img[src='x'], #sheetbody svg[onload]").length;
    acceptShared(); openTplPicker(1, "m"); r.imgs2 = document.querySelectorAll("#sheetbody img[src='x']").length; closeSheet();
    openShared(parseShare(shareUrl("w", { w: { 1: { t: P, i: [P, "sq"] }, x: 1 }, f: P }))); r.imgs3 = document.querySelectorAll("#sheetbody img[src='x']").length; closeSheet();
    r.xss = window.__xss || 0; S.presets = S.presets.filter(p => !/<img/.test(p.name)); save(); return r; });
  ok("kötü niyetli paylaşım bağlantısı: kod çalışmadı", shr.xss === 0 && shr.imgs === 0 && shr.imgs2 === 0 && shr.imgs3 === 0, JSON.stringify(shr));
  const csp = await page.evaluate(() => { const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]'); const s = document.createElement("script"); s.textContent = "window.__cspProbe=1"; document.head.appendChild(s); return { c: m ? m.content : "", ran: window.__cspProbe === 1 }; });
  page.errs.splice(0, page.errs.length, ...page.errs.filter(e => !/Content Security Policy|Refused to/i.test(e)));
  ok("CSP: yalnızca kendi betiklerine izin var, dışarıdan eklenen betik çalışmıyor", /script-src 'self'/.test(csp.c) && !/unsafe-eval/.test(csp.c) && !/script-src[^;]*unsafe-inline/.test(csp.c) && csp.ran === false, JSON.stringify(csp));
  await page.evaluate(() => { openProfile(false); document.querySelectorAll("#profile details").forEach(d => d.open = true); renderProfile(); }); await page.waitForTimeout(500);
  ok("Profilim'de Hakkında ve gizlilik: sürüm, sağlık uyarısı", (await page.locator('#profile details[data-fold="about"]').count()) === 1 && /Sağlık uyarısı/.test(await page.textContent('#profile details[data-fold="about"]')) && /Sürüm \d+/.test(await page.textContent("#appver")), await page.textContent("#appver"));
  await page.evaluate(() => closeProfile());
  // --- sayaçlar
  await page.click('#nav [data-tab="b"]'); await page.click('[data-act="timer"]'); await page.waitForTimeout(400);
  await page.click('[data-act="restset"][data-sec="30"]'); await page.click('[data-act="restgo"]');
  ok("dinlenme sayacı başladı", (await page.textContent("#chip")).includes("0:30"));
  await page.clock.runFor(31000);
  ok("sayaç bitti", await page.$eval("#chip", e => e.hidden));
  ok("kod hatası yok", page.errs.length === 0, page.errs.join(" | "));
  await ctx.close();
}

(async () => {
  await new Promise(r => server.listen(0, r)); const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();
  await suite("masaüstü 1280x900", browser, { viewport: { width: 1280, height: 900 } }, base);
  await suite("telefon iPhone 13", browser, { ...devices["iPhone 13"] }, base);
  await browser.close(); server.close();
  console.log(`\nSonuç: ${pass} başarılı, ${fail} hatalı`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error("TEST ÇÖKTÜ", e); process.exit(2); });
