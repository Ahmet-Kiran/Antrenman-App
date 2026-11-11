"use strict";
/* ---------- Beslenme: protein ve su hedefi, günlük takip, tüyolar ---------- */
const PROT_PER_KG = { lose: 1.6, muscle: 1.8, strength: 1.6, general: 1.2 };
const GLASS_ML = 200;
const nutOf = k => (S.nutrition && S.nutrition[k]) || {};
const proteinTarget = () => Math.round(weightOn(today) * (PROT_PER_KG[prof().goal] ?? 1.2) / 5) * 5;
const waterTarget = () => Math.round(weightOn(today) * 33 / GLASS_ML);          // yaklaşık 33 ml/kg, bardak (200 ml)
const calFloor = p => p && p.sex === "e" ? 1500 : 1200;
function nutritionDay(k) {
  const n = nutOf(k), pt = proteinTarget(), wt = waterTarget(), c = S.calories[k];
  const bar = (v, t, label, unit) => `<div class="nutrow"><span>${label}</span><div class="nbar"><i style="width:${Math.min(100, (v || 0) / t * 100)}%"></i></div><b>${v ?? "–"} / ${t} ${unit}</b></div>`;
  const low = c > 0 && c < calFloor(prof()) ? `<small style="display:block;margin-top:6px">Girdiğin kalori genel alt sınırın (${calFloor(prof())} kcal) altında. Bunu alışkanlık yapma; endişen varsa bir diyetisyenle konuş.</small>` : "";
  return `<div class="nut">${bar(n.protein, pt, "Protein", "g")}${bar(n.water, wt, "Su", "bardak")}<small style="display:block">Hedefler kilona ve amacına göre yaklaşık tahmindir.</small>${low}</div>`;
}
const FOOD_TIPS = [
  ["Küçük adımlarla başla", "Bir anda çok kısıtlamak yerine küçük değişiklikler seç: şekerli içeceği azalt, her öğüne bir protein kaynağı ekle, akşam atıştırmasını planla."],
  ["Protein", "Her öğünde bir protein kaynağı iyi bir kuraldır: yumurta, yoğurt, peynir, tavuk, balık, et, mercimek, nohut. Egzersiz yapanlarda günlük kilo başına yaklaşık 1,2–1,8 g yaygın bir aralıktır. Böbrek sorunun varsa miktarı doktorunla belirle."],
  ["Sebze ve lif", "Tabağının yaklaşık yarısı sebze ya da salata olsun. Baklagil, tam tahıl ve sebze lifi seni daha uzun süre tok tutar."],
  ["Su", "Günlük başlangıç hedefi yaklaşık kilo başına 30–35 ml. Sıcakta ve çok terlediğinde daha fazlası gerekir. Gün içine yay, tek seferde içme."],
  ["Sıvı kalorilere dikkat", "Meyve suyu, gazlı içecek ve şekerli kahve fark etmeden kalori ekler. Su, sade çay ve kahve en kolay seçimdir."],
  ["Öğün düzeni", "Mümkün olduğunca düzenli saatlerde ye. Yavaş ye; tokluk sinyali yaklaşık 20 dakikada gelir."],
  ["Kilo hedefi", "Haftada yarım kilo civarı yavaş değişim sürdürülebilir. Çok hızlı düşüş çoğu zaman kas ve enerji kaybettirir."],
  ["Antrenman günü", "Antrenmandan önce ağır yemekten kaçın, sonrasında protein içeren bir öğün ye."],
  ["Uyku ve stres", "Yetersiz uyku iştahı artırabilir. Uykunu düzenli tutmak beslenmene de yardım eder."],
  ["Kalori takibi herkese uygun değil", "Sayı takibi seni gerer ya da yemekle ilişkini bozarsa bırak ve bir uzmanla konuş. Hamilelik, emzirme, kronik hastalık, ilaç kullanımı ya da yeme bozukluğu geçmişi varsa diyet değişikliğini doktor veya diyetisyenle yap. Bu bilgiler genel bilgidir, tıbbi tavsiye yerine geçmez."]
];
const secNutrition = p => `<details class="card fold" data-fold="food" ${ui.open.food ? "open" : ""}><summary><h3>Beslenme tüyoları</h3></summary>
  <p><b>Günlük protein hedefin: yaklaşık ${proteinTarget()} g</b> · <b>su: yaklaşık ${waterTarget()} bardak</b> (200 ml)<small style="display:block">Kilona ve amacına göre yaklaşık tahmin. Kilonu İlerleme sekmesinden girersen güncellenir. Takibini İlerleme sekmesindeki "Ölçüm ve beslenme" bölümünden yapabilirsin.</small></p>
  ${FOOD_TIPS.map(([h, t]) => `<p><b>${esc(h)}.</b> ${esc(t)}</p>`).join("")}</details>`;
