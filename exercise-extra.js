// Ek hareketler: ısınma, soğuma, kardiyo ve bölgesel güç hareketleri.
// exercise-data.js'e dokunmaz; video bağlantılarını orada tutmaya devam edebilirsin.
// Genel egzersiz bilgisidir; ağrı olursa dur. Zor hareketlere önce kolay varyasyonla başla.
(() => {
  const N = false, mk = (id, name, area, role, muscles, instructions, unit, target) => ({ id, name, area, role, muscles, instructions, unit, target, inDefaultProgram: N });
  const L = window.EXERCISE_LIBRARY, T = window.EXERCISE_TAGS, A = window.EXERCISE_ALT || (window.EXERCISE_ALT = {});
  const I = "Isınma", S = "Soğuma", K = "Kardiyo";
  L.push(
    // ---- Isınma (dinamik) ----
    mk("warm-jumping-jack", "Jumping Jack", I, "isinma", "Tüm vücut, nabız", "Ayaklar bitişik başla. Zıplayarak ayakları açıp kolları başın üstüne kaldır, sonra kapat. Dizler hafif bükük, iniş yumuşak olsun.", "saniye", "45–60 sn"),
    mk("warm-high-knees", "High Knees (Yerinde Diz Çekme)", I, "isinma", "Kalça bükücüler, bacaklar, nabız", "Yerinde koşar gibi dizlerini kalça hizasına çek. Kollar eşlik etsin, gövde dik, ayak ucuna yumuşak bas.", "saniye", "30 sn"),
    mk("warm-butt-kicks", "Butt Kicks (Topuk Vurma)", I, "isinma", "Arka bacak, nabız", "Yerinde koşarken topuklarını kalçana doğru çek. Gövde dik, dizler öne düşmesin.", "saniye", "30 sn"),
    mk("warm-arm-circles", "Kol Daireleri", I, "isinma", "Omuz, üst sırt", "Kollar yana açık. Küçük dairelerle başla, giderek büyüt. Önce ileri sonra geri çevir.", "tekrar", "15 ileri + 15 geri"),
    mk("warm-leg-swings", "Bacak Savurma", I, "isinma", "Kalça, arka ve ön bacak", "Duvara ya da sandalyeye tutun. Bir bacağı kontrollü şekilde öne arkaya, sonra yana savur. Gövde sabit kalsın, hareketi giderek büyüt.", "tekrar", "10 (her bacak, her yön)"),
    mk("warm-hip-circles", "Kalça Daireleri", I, "isinma", "Kalça eklemi", "Bir ayağın üstünde dur, diğer dizini kalça hizasına çek ve kalçada geniş bir daire çiz. Her iki yöne yap.", "tekrar", "10 (her yön, her bacak)"),
    mk("warm-inchworm", "Inchworm (Solucan)", I, "isinma", "Arka bacak, omuz, core", "Ayakta öne eğil, ellerinle plank pozisyonuna yürü. Ellerini ayaklarına doğru geri yürüt ve kalk. Hamstring gerilirse dizlerini hafif bükebilirsin.", "tekrar", "6 tekrar"),
    mk("warm-worlds-greatest", "World's Greatest Stretch", I, "isinma", "Kalça, sırt, omuz", "Derin bir hamle pozisyonu al. İçteki elini yere koy, diğer kolu tavana aç ve bakışını eline çevir. Sonra kalçanı geriye alıp ön bacağını uzat.", "tekrar", "5 (her taraf)"),
    mk("warm-bodyweight-squat", "Isınma Squat'ı", I, "isinma", "Bacak, kalça", "Ayaklar omuz genişliğinde. Kalçanı geriye iterek rahat tempoda çömel ve kalk. Topuklar yerde kalsın.", "tekrar", "10–15 tekrar"),
    mk("warm-scapular-pushup", "Scapular Push-Up", I, "isinma", "Kürek kemiği, omuz stabilitesi", "Düz kollarla plank pozisyonunda dur. Dirsekleri bükmeden sadece kürek kemiklerini birbirine yaklaştır, sonra aç.", "tekrar", "10 tekrar"),
    mk("warm-ankle-rocks", "Ayak Bileği Hareketliliği", I, "isinma", "Ayak bileği, baldır", "Bir ayak önde dur. Topuğunu yerden kaldırmadan dizini ayak parmaklarının üstüne doğru it, geri gel.", "tekrar", "10 (her taraf)"),
    mk("warm-thoracic-rotation", "Sırt Rotasyonu (Open Book)", I, "isinma", "Omurga rotasyonu, göğüs", "Yan yat, dizler 90 derece bükük. Üstteki kolu tavana ve arkaya aç, bakışın elini takip etsin. Dizler yerden ayrılmasın.", "tekrar", "8 (her taraf)"),
    // ---- Soğuma ----
    mk("cool-walk", "Rahat Yürüyüş", S, "soguma", "Nabız düşürme", "Nefesin ve nabzın normale dönene kadar rahat tempoda yürü.", "saniye", "180–240 sn"),
    mk("cool-breathing", "Kutu Nefes (4-4-4-4)", S, "soguma", "Nefes, sakinleşme", "4 saniye nefes al, 4 saniye tut, 4 saniye ver, 4 saniye bekle. Rahat bir tempoda 10–15 tur yap.", "saniye", "60–90 sn"),
    mk("cool-belly-breathing", "Karın (Diyafram) Nefesi", S, "soguma", "Diyafram, sakinleşme", "Sırtüstü yat, elini karnına koy. Nefes alırken karnın kabarsın, nefesi yavaşça ver.", "tekrar", "10 nefes"),
    mk("cool-legs-up-wall", "Bacakları Duvara Yaslama", S, "soguma", "Bacak dinlenmesi", "Sırtüstü yat, kalçanı duvara yaklaştır ve bacaklarını duvara yasla. Rahat nefes al. Bacakların uyuşursa indir.", "saniye", "120–180 sn"),
    // ---- Kardiyo ----
    mk("cardio-burpee", "Burpee", K, "kardiyo", "Tüm vücut, nabız", "Ayakta çömel, ellerini yere koy, ayaklarını geriye at (plank). İstersen bir push-up yap, ayaklarını geri çek ve zıpla. Zorsa zıplamayı ve push-up'ı atla.", "tekrar", "8–12 tekrar"),
    mk("cardio-skater", "Skater (Yana Sıçrama)", K, "kardiyo", "Bacak, kalça, denge", "Bir bacağın üstüne yana sıçra, diğer ayağını arkandan çaprazla. Yumuşak in, bir sonraki sıçramada yön değiştir.", "tekrar", "20 toplam"),
    mk("cardio-squat-jump", "Squat Jump", K, "kardiyo", "Bacak, kalça, patlayıcılık", "Squat pozisyonuna in, patlayıcı şekilde zıpla ve dizlerini bükerek yumuşak in. Zıplamadan önce squat'ı iyi öğren.", "tekrar", "8–12 tekrar"),
    mk("cardio-shadow-boxing", "Gölge Boks", K, "kardiyo", "Omuz, core, nabız", "Ayaklar omuz genişliğinde, hafif sek. Yumruk serileri at, gövdeni hafifçe döndür. Kollar gevşek, nefes düzenli.", "saniye", "60 sn tur"),
    mk("cardio-jog-in-place", "Yerinde Koşu", K, "kardiyo", "Bacak, nabız", "Yerinde rahat tempoda koş, kollar eşlik etsin. Ayak ucuna yumuşak bas.", "saniye", "60–120 sn"),
    mk("cardio-treadmill-fast-walk", "Yürüme Bandı · Tempolu Yürüyüş", K, "kardiyo", "Bacak, kalp ve dolaşım", "Bandı, konuşabildiğin ama hafif nefes nefese kaldığın bir hıza ayarla (eğimsiz). Dik dur, kolların rahat sallansın.", "saniye", "600–1200 sn"),
    mk("cardio-treadmill-intervals", "Yürüme Bandı · Aralıklı Yürüyüş", K, "kardiyo", "Bacak, kalp ve dolaşım", "1 dakika hızlı, 1 dakika rahat tempoda yürü ve bunu 5 kez tekrarla. Hızı kendine göre ayarla.", "saniye", "600 sn"),
    // ---- Bölgesel: Biceps ve ön kol ----
    mk("reverse-curl", "Reverse Curl", "Biceps ve ön kol", "yan", "Ön kol, brachialis", "Avuçların aşağıya bakarken dambılları (ya da dolu çantayı) dirsekleri gövdene sabit tutarak kaldır ve kontrollü indir.", "tekrar", "10–12 tekrar"),
    mk("zottman-curl", "Zottman Curl", "Biceps ve ön kol", "yan", "Biceps, ön kol", "Avuç içi yukarı kaldır. Üstte avuçlarını aşağı çevir ve bu tutuşla yavaşça indir. Dirsekler sabit.", "tekrar", "8–10 tekrar"),
    mk("farmers-carry", "Farmer's Carry (Dambıl Taşıma)", "Biceps ve ön kol", "yan", "Kavrama gücü, core, omuz", "Her elinde bir dambıl, dik dur ve omuzlarını geri al. Kontrollü adımlarla yürü ya da dambılları sadece tutarak dur.", "saniye", "30–40 sn"),
    // ---- Triceps ----
    mk("skull-crusher", "Skull Crusher (Dambıl)", "Triceps", "yan", "Triceps", "Sırtüstü yat, dambılları yüzünün üstünde tut. Dirsekleri sabit tutup alnına doğru indir, tekrar yukarı it. Hafif ağırlıkla başla.", "tekrar", "10–12 tekrar"),
    mk("close-grip-push-up", "Dar Tutuşlu Push-Up", "Triceps", "yan", "Triceps, göğüs", "Elleri omuz genişliğinden biraz dar koy. Dirsekler gövdene yakın, vücut düz bir hatta kalarak in ve it.", "tekrar", "8–12 tekrar"),
    // ---- Göğüs ----
    mk("archer-push-up", "Archer Push-Up", "Göğüs", "ana", "Göğüs, omuz, triceps", "Eller omuzdan geniş. Bir kola doğru kayarak in; diğer kol düz kalsın, sonra geri it. Zordur, önce Geniş Push-Up ile hazırlan.", "tekrar", "5–8 (her taraf)"),
    mk("push-up-plus", "Push-Up Plus", "Göğüs", "yan", "Serratus, göğüs", "Push-up'ın üst noktasında kürek kemiklerini öne iterek sırtını hafifçe yuvarla. Ekstra bir adım yukarı itmiş gibi.", "tekrar", "8–12 tekrar"),
    mk("dumbbell-squeeze-press", "Dambıl Squeeze Press", "Göğüs", "yan", "Göğüs, triceps", "Yerde sırtüstü, iki dambılı göğüs üstünde birbirine bastırarak yukarı it ve indir. Basınç boyunca dambıllar birbirine değsin.", "tekrar", "10–12 tekrar"),
    // ---- Omuz ----
    mk("arnold-press", "Arnold Press", "Omuz", "yan", "Omuz", "Dambıllar göğüs önünde, avuçlar sana dönük. Yukarı iterken avuçlarını dışa çevir; inerken geri çevir.", "tekrar", "8–12 tekrar"),
    mk("dumbbell-external-rotation", "Dambıl Dış Rotasyon (Rotator Manşet)", "Omuz", "yan", "Rotator manşet", "Yan yat, dirsek bel yanında 90 derece bükük. Ön kolunu tavana doğru döndür ve yavaşça indir. Ağırlık çok hafif olsun, 4 kg bile fazla gelebilir.", "tekrar", "12–15 (her kol)"),
    // ---- Sırt ----
    mk("dumbbell-pullover", "Dambıl Pullover", "Sırt ve alt sırt", "yan", "Sırt (latissimus), göğüs", "Sırtüstü yat, dambılı iki elle göğüs üstünde tut. Kollar hafif bükük, dambılı başının arkasına indir ve geri çek.", "tekrar", "10–12 tekrar"),
    mk("wide-pull-up", "Geniş Tutuşlu Barfiks", "Sırt ve alt sırt", "ana", "Sırt (latissimus), biceps", "Elleri omuzdan geniş tut. Kürek kemiklerini aşağı çekerek çeneni bara kaldır, kontrollü in.", "tekrar", "3–8 tekrar"),
    // ---- Kalça ve arka bacak / Bacak ----
    mk("dumbbell-rdl", "Dambıl Romanian Deadlift", "Kalça ve arka bacak", "ana", "Arka bacak, kalça, alt sırt", "Dambıllar uyluklarının önünde, dizler hafif bükük. Kalçanı geriye iterek gövdeni öne eğ, sırt düz kalsın. Kalçayı öne iterek kalk.", "tekrar", "10–12 tekrar"),
    mk("bulgarian-split-squat", "Bulgarian Split Squat", "Bacak", "ana", "Ön bacak, kalça", "Arka ayağının üstünü sandalyeye koy. Ön bacakta çömel; ön diz ayak yönünde, gövde dik. Dengeyi bulana kadar yavaş yap.", "tekrar", "8–10 (her bacak)"),
    mk("walking-lunge", "Yürüyen Hamle", "Bacak", "yan", "Ön bacak, kalça", "Büyük bir adımla ileri çık ve hamle yap. Arka bacağı öne getirerek bir sonraki adıma geç. Gövde dik.", "tekrar", "10–12 adım"),
    mk("curtsy-lunge", "Curtsy Lunge", "Bacak", "yan", "Kalça yan kasları, ön bacak", "Bir bacağını diğerinin arkasından çaprazlayarak geriye at ve hamle yap. Kalçanı kontrollü tut, öne dönük kal.", "tekrar", "8–10 (her bacak)"),
    mk("clamshell", "Clamshell", "Kalça ve arka bacak", "yan", "Kalça yan kasları", "Yan yat, dizler bükük, ayaklar birleşik. Ayakları ayırmadan üstteki dizini aç ve yavaşça kapat. Kalçan geriye devrilmesin.", "tekrar", "12–15 (her taraf)"),
    mk("frog-pump", "Frog Pump", "Kalça ve arka bacak", "yan", "Kalça (gluteus)", "Sırtüstü yat, ayak tabanlarını birleştir, dizler dışa. Kalçanı yukarı it, üstte sık ve yavaşça indir.", "tekrar", "12–15 tekrar"),
    // ---- Karın ve core ----
    mk("plank-shoulder-taps", "Plank Omuz Dokunuşu", "Karın ve core", "yan", "Core, omuz stabilitesi", "Yüksek plank pozisyonunda bir elinle karşı omzuna dokun. Kalça sağa sola sallanmasın.", "tekrar", "20 toplam"),
    mk("side-plank-hip-dip", "Side Plank Hip Dip", "Karın ve core", "yan", "Yan karın (oblik)", "Yan plank'ta kalçanı yere doğru indir ve tekrar yukarı kaldır. Vücut düz bir hatta kalmaya çalışsın.", "tekrar", "10–12 (her taraf)"),
    mk("v-up", "V-Up", "Karın ve core", "yan", "Karın", "Sırtüstü yat, kollar başın arkasında. Bacaklar ve gövdeyi aynı anda kaldırıp V şekli yap, yavaşça indir. Belini yerden koparma.", "tekrar", "8–12 tekrar"),
    mk("flutter-kicks", "Flutter Kicks", "Karın ve core", "yan", "Alt karın", "Sırtüstü yat, bacaklar yerden hafif kalkık. Küçük, hızlı vuruşlarla bacakları sırayla yukarı aşağı oynat. Bel yere bitişik kalsın.", "saniye", "20–30 sn"),
    mk("l-sit-chair", "L-Sit (Sandalye)", "Karın ve core", "yan", "Core, triceps, omuz", "Sandalyenin iki yanına ellerini koy, kollarını düzleştir ve bacaklarını öne uzatarak havada tut. Zordur, dizleri bükük başlayabilirsin.", "saniye", "10–20 sn"),
    mk("hanging-leg-raise", "Hanging Leg Raise", "Karın ve core", "ana", "Alt karın, kavrama", "Barda asılı, düz bacaklarını yatay hizaya kaldır ve kontrollü indir. Sallanma. Önce Hanging Knee Raise ile hazırlan.", "tekrar", "6–10 tekrar")
  );
  const tag = (kind, key, ids) => ids.forEach(id => { (T[id] ||= { equip: [], risk: [] })[kind].push(key); });
  tag("equip", "bar", ["wide-pull-up", "hanging-leg-raise"]);
  tag("equip", "dumbbell", ["zottman-curl", "farmers-carry", "skull-crusher", "dumbbell-squeeze-press", "arnold-press", "dumbbell-external-rotation", "dumbbell-pullover"]);
  tag("equip", "dumbbell|bag", ["reverse-curl", "dumbbell-rdl"]);
  tag("equip", "chair", ["bulgarian-split-squat", "l-sit-chair"]);
  tag("equip", "treadmill", ["cardio-treadmill-fast-walk", "cardio-treadmill-intervals"]);
  tag("risk", "diz", ["bulgarian-split-squat", "walking-lunge", "curtsy-lunge", "cardio-skater", "cardio-squat-jump", "cardio-burpee"]);
  tag("risk", "bel", ["dumbbell-rdl", "v-up", "flutter-kicks", "cardio-burpee"]);
  tag("risk", "omuz", ["archer-push-up", "arnold-press", "dumbbell-external-rotation", "dumbbell-pullover", "wide-pull-up", "hanging-leg-raise", "l-sit-chair"]);
  tag("risk", "bilek", ["archer-push-up", "close-grip-push-up", "push-up-plus", "warm-scapular-pushup", "warm-inchworm", "plank-shoulder-taps", "cardio-burpee", "l-sit-chair"]);
  Object.assign(A, {
    "bulgarian-split-squat": ["split-squat"], "hanging-leg-raise": ["leg-raise"], "wide-pull-up": ["inverted-row"], "arnold-press": ["pk"], "skull-crusher": ["diamond-push-up"],
    "dumbbell-pullover": ["sm"], "farmers-carry": ["plank"], "l-sit-chair": ["plank"], "dumbbell-external-rotation": ["prone-t-raise"], "zottman-curl": ["bag-curl"],
    "reverse-curl": ["bag-curl"], "dumbbell-rdl": ["good-morning"], "dumbbell-squeeze-press": ["pu"], "cardio-treadmill-fast-walk": ["cardio-jog-in-place"], "cardio-treadmill-intervals": ["cardio-jog-in-place"]
  });
})();
