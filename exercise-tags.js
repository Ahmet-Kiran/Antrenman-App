// Hareket etiketleri: ekipman gereksinimi (equip) ve dikkat bölgesi (risk).
// equip: bar, dumbbell, chair, table, bag; "dumbbell|bag" = ikisinden biri yeter.
// risk: bel, diz, omuz, bilek (Profilim'deki dikkat notlarıyla eşleşir).
(() => {
  const T = {}, add = (kind, key, ids) => ids.forEach(id => { (T[id] ||= { equip: [], risk: [] })[kind].push(key); });
  add("equip", "bar", ["bf", "ch", "kr", "negative-pull-up", "chin-up-hold", "scapular-pull-up", "stretch-dead-hang"]);
  add("equip", "dumbbell", ["lr", "rd", "dc", "floor-press", "dumbbell-fly", "shoulder-press", "front-raise", "dumbbell-shrug", "hammer-curl", "concentration-curl", "wrist-curl", "overhead-triceps-extension", "triceps-kickback"]);
  add("equip", "dumbbell|bag", ["ar", "goblet-squat"]);
  add("equip", "bag", ["bent-over-row", "bag-curl"]);
  add("equip", "chair", ["hp", "dp", "step-up", "box-squat", "incline-push-up", "decline-push-up", "stretch-seated-figure-four", "ar", "seated-calf-raise"]);
  add("equip", "table", ["inverted-row"]);
  add("risk", "bel", ["good-morning", "single-leg-rdl", "bent-over-row", "rd", "sm", "hh", "leg-raise", "reverse-crunch", "russian-twist", "bicycle-crunch", "mountain-climbers", "kr"]);
  add("risk", "diz", ["sq", "su", "goblet-squat", "split-squat", "step-up", "cossack-squat", "side-lunge", "wall-sit", "box-squat", "rl", "mountain-climbers", "stretch-deep-squat", "stretch-half-kneeling-quad", "stretch-90-90", "stretch-foot-sole", "stretch-standing-quad"]);
  add("risk", "omuz", ["pk", "shoulder-press", "lr", "front-raise", "rd", "prone-y-raise", "dumbbell-shrug", "dp", "decline-push-up", "pu", "bf", "ch", "negative-pull-up", "chin-up-hold", "kr", "scapular-pull-up", "stretch-dead-hang", "floor-press", "dumbbell-fly", "stretch-doorway"]);
  add("risk", "bilek", ["pu", "decline-push-up", "incline-push-up", "wide-push-up", "diamond-push-up", "pk", "dp", "plank", "sp", "mountain-climbers", "wrist-curl", "hammer-curl", "dc", "bf", "ch", "kr"]);
  window.EXERCISE_TAGS = T;
  // Ekipman eksikse önerilen alternatifler
  window.EXERCISE_ALT = {
    bf: ["inverted-row", "bent-over-row"], ch: ["inverted-row", "bag-curl"], kr: ["reverse-crunch", "leg-raise"], "negative-pull-up": ["inverted-row"],
    "chin-up-hold": ["plank"], "scapular-pull-up": ["prone-y-raise"], "stretch-dead-hang": ["stretch-child-pose"],
    lr: ["prone-y-raise"], rd: ["prone-t-raise"], dc: ["bag-curl"], ar: ["bent-over-row"], "floor-press": ["pu"], "shoulder-press": ["pk"],
    "front-raise": ["pk"], "hammer-curl": ["bag-curl"], "dumbbell-shrug": ["prone-y-raise"], dp: ["diamond-push-up"], "inverted-row": ["bent-over-row"]
  };
})();
