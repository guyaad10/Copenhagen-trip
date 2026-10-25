// All trip content lives here. To add a place: add an entry to PLACES with a type from TYPES.
// To put it on a day, reference its id from that day's stop with `p` (or `ps` for several).

const LINKS = {
  rosenborg: "https://denkongeligesamling.dk/en/rosenborg-castle/tickets/",
  tivoli: "https://www.tivoli.dk/en/billetter-og-turpas",
  design: "https://shop.designmuseum.dk/?lang=en",
  stromma: "https://www.stromma.com/en-dk/copenhagen/sightseeing/sightseeing-by-boat/grand-tour/",
  hotel: "https://scandic-spectrum-copenhagen.bookstaygo.com/",
  shuttle: "https://share.google/ONbyR7TStS6rQy6jU",
  guide: "https://share.google/FNL9nVCtZPHQNRWga"
};

// Place types: Hebrew label + icon (24x24 stroke path).
const TYPES = {
  food:    { he: "מסעדות ואוכל",     icon: "M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1-3 4-3 7h3v11" },
  museum:  { he: "מוזיאון",        icon: "M3 9l9-5 9 5M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18" },
  castle:  { he: "ארמון וטירה",    icon: "M3 19h18M4 17L3 8l5 4 4-7 4 7 5-4-1 9z" },
  shop:    { he: "חנות",           icon: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" },
  park:    { he: "פארק וגן",       icon: "M12 21v-5M12 3l6 8h-3l3 5H6l3-5H6z" },
  street:  { he: "רחוב ושכונה",    icon: "M5 21L9 3M19 21L15 3M12 5v2M12 10v3M12 16v3" },
  view:    { he: "תצפית",          icon: "M12 2l3 6v13H9V8zM8 21h8M12 12v3" },
  fun:     { he: "אטרקציה",        icon: "M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M12 5v14M5 12h14M9 21l3-9 3 9" },
  boat:    { he: "שייט",           icon: "M3 15h18l-3 5H6zM6 15v-5h9l3 5M9 10V6h4v4" },
  hotel:   { he: "מלון",           icon: "M3 19v-9M3 15h18v4M21 15v-2a3 3 0 0 0-3-3h-7v5M7 13.5a1.5 1.5 0 1 0 0-.01" },
  cafe:    { he: "מאפים וקפה",     icon: "M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2" },
  bar:     { he: "בר",             icon: "M5 4h14l-7 8zM12 12v8M8 20h8" },
  fashion: { he: "אופנה",          icon: "M12 7a2 2 0 1 1 2-2M12 7v1l-9 7a1 1 0 0 0 .6 2h16.8a1 1 0 0 0 .6-2l-9-7" },
  design:  { he: "עיצוב ואדריכלות", icon: "M8 3h8l3 7H5zM12 10v9M8 21h8" },
  vintage: { he: "וינטג׳",          icon: "M6 10a6 7 0 1 0 12 0a6 7 0 1 0-12 0M12 17v4M9 21h6" },
  other:   { he: "שמור",           icon: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" },
  transit: { he: "תחבורה",         icon: "M7 3h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM5 10h14M8 21l2-5M16 21l-2-5" }
};

// q = Google Maps search text. Coordinates are approximate (good enough for the map).
const PLACES = [
  { id: "hotel",        he: "מלון סקנדיק ספקטרום", en: "Scandic Spectrum",        type: "hotel",   lat: 55.6699, lng: 12.5716 },
  { id: "cph-h",        he: "התחנה המרכזית",       en: "København H",             type: "transit", lat: 55.6726, lng: 12.5646 },
  { id: "noerreport",   he: "תחנת נורפורט",         en: "Nørreport Station",       type: "transit", lat: 55.6833, lng: 12.5717 },
  { id: "marmorkirken", he: "תחנת מרמורקירקן",     en: "Marmorkirken Station",    type: "transit", lat: 55.6850, lng: 12.5891 },
  { id: "rundetaarn",   he: "המגדל העגול",         en: "Rundetårn",               type: "view",    lat: 55.6813, lng: 12.5757 },
  { id: "zara",         he: "ZARA ו‑Uniqlo",        en: "Strøget",                 type: "fashion", lat: 55.6780, lng: 12.5745, q: "Uniqlo Strøget" },
  { id: "illums",       he: "Illums Bolighus",      en: "Amagertorv 10",           type: "design",  lat: 55.6787, lng: 12.5794 },
  { id: "hay",          he: "HAY House",            en: "Østergade 61",            type: "design",  lat: 55.6795, lng: 12.5806, q: "HAY House Østergade" },
  { id: "louis",        he: "Louis Poulsen",        en: "אולם תצוגה, סגור בראשון", type: "design",  lat: 55.6825, lng: 12.6015, q: "Louis Poulsen showroom" },
  { id: "designmuseum", he: "המוזיאון הדני לאמנות ועיצוב", en: "Designmuseum Danmark", type: "museum", lat: 55.6862, lng: 12.5935 },
  { id: "glyptotek",    he: "ני קרלסברג גליפטוטק",  en: "Ny Carlsberg Glyptotek",  type: "museum",  lat: 55.6727, lng: 12.5725 },
  { id: "bertels",      he: "Bertels Salon",        en: "עוגות גבינה",             type: "cafe",    lat: 55.6794, lng: 12.5762 },
  { id: "torvehallerne",he: "טורבהאלרנה",           en: "Torvehallerne",           type: "food",    lat: 55.6838, lng: 12.5697 },
  { id: "tivolifood",   he: "Tivoli Food Hall",     en: "ליד הכניסה לטיבולי",     type: "food",    lat: 55.6743, lng: 12.5658 },
  { id: "kastellet",    he: "קאסטלט",               en: "Kastellet",               type: "park",    lat: 55.6913, lng: 12.5951 },
  { id: "palmhouse",    he: "החממה הבוטנית",        en: "Palm House",              type: "park",    lat: 55.6869, lng: 12.5738, q: "Palm House Botanical Garden" },
  { id: "frbhave",      he: "פרדריקסברג",           en: "Frederiksberg Have",      type: "park",    lat: 55.6760, lng: 12.5250 },
  { id: "amalienborg",  he: "ארמון אמאליאנבורג",    en: "Amalienborg",             type: "castle",  lat: 55.6840, lng: 12.5930 },
  { id: "rosenborg",    he: "טירת רוזנבורג",        en: "Rosenborg Castle",        type: "castle",  lat: 55.6858, lng: 12.5774 },
  { id: "nyhavn",       he: "ניהאבן ושייט תעלות",   en: "Nyhavn 3 · Stromma",      type: "boat",    lat: 55.6797, lng: 12.5878, q: "Nyhavn 3" },
  { id: "tivoli",       he: "גני טיבולי",           en: "Tivoli Gardens",          type: "fun",     lat: 55.6737, lng: 12.5681 },
  { id: "saviour",      he: "כנסיית גואלנו",         en: "Church of Our Saviour",   type: "view",    lat: 55.6726, lng: 12.5944 },
  { id: "christianshavn",he: "קריסטיאנסהאבן",       en: "Christianshavn",          type: "street",  lat: 55.6730, lng: 12.5905 },
  { id: "vaernedamsvej",he: "רחוב Værnedamsvej",    en: "הרובע הצרפתי",           type: "street",  lat: 55.6727, lng: 12.5450, q: "Værnedamsvej" },
  { id: "bredgade",     he: "ברדגאדה",              en: "Bredgade",                type: "street",  lat: 55.6825, lng: 12.5900 },
  { id: "amagertorv",   he: "אמאגרטורב והסטרוייט",  en: "Amagertorv",              type: "street",  lat: 55.6785, lng: 12.5790 },
  { id: "pilestraede",  he: "פילסטראדה",            en: "Pilestræde",              type: "street",  lat: 55.6810, lng: 12.5797 },
  { id: "kobmagergade", he: "קובמאגרגאדה",          en: "Købmagergade",            type: "street",  lat: 55.6808, lng: 12.5768 }
];

// Google Maps saved places (js/saved.js, built from data/saved-places.csv) use their list tags for a type.
const TAG_TYPES = {
  "Bakery & Coffee": "cafe", "Restaurant": "food", "Design store and architecture": "design", "Fashion": "fashion",
  "Vintage": "vintage", "Attractions and museums": "museum", "Bar": "bar", "Hotel": "hotel", "Park": "park"
};
// Saved places that had no tag in Google Maps
const SAVED_TYPES = {
  "Elmegade": "street", "Gasoline Grill": "food", "Samsøe Samsøe": "fashion", "Le Labo": "fashion",
  "Bottega Barlie": "food", "Ancher Studio ApS": "design", "Axel Copenhagen": "other"
};
// Saved places that are already on the itinerary: they reuse the itinerary pin.
const SAVED_SAME_AS = {
  "Illums Bolighus": "illums", "HAY House": "hay", "Louis Poulsen": "louis", "Designmuseum Danmark": "designmuseum",
  "Ny Carlsberg Glyptotek": "glyptotek", "Rosenborg Castle": "rosenborg", "Tivoli Gardens": "tivoli",
  "TorvehallerneKBH": "torvehallerne", "Palmehuset": "palmhouse", "Uniqlo Closes soon": "zara"
};

// English Wikipedia articles used for place photos (itinerary ids, then saved-place names)
const WIKI = {
  rundetaarn: "Rundetårn", illums: "Illums Bolighus", designmuseum: "Designmuseum Danmark", glyptotek: "Ny Carlsberg Glyptotek",
  torvehallerne: "Torvehallerne", kastellet: "Kastellet, Copenhagen", palmhouse: "University of Copenhagen Botanical Garden",
  frbhave: "Frederiksberg Gardens", amalienborg: "Amalienborg", rosenborg: "Rosenborg Castle", nyhavn: "Nyhavn",
  tivoli: "Tivoli Gardens", saviour: "Church of Our Saviour, Copenhagen", christianshavn: "Christianshavn",
  bredgade: "Bredgade", amagertorv: "Amagertorv", kobmagergade: "Købmagergade", pilestraede: "Pilestræde",
  vaernedamsvej: "Værnedamsvej", zara: "Strøget", "cph-h": "Copenhagen Central Station", noerreport: "Nørreport station",
  marmorkirken: "Frederik's Church", louis: "Louis Poulsen", tivolifood: "Tivoli Food Hall",
  "SMK – Statens Museum for Kunst": "National Gallery of Denmark", "Copenhagen Contemporary": "Copenhagen Contemporary",
  "Ordrupgaard": "Ordrupgaard", "8 House": "8 House", "Superkilen Park": "Superkilen", "Noma": "Noma (restaurant)",
  "Reffen - Copenhagen Street Food": "Reffen", "Hotel NH Collection Copenhagen": "NH Collection Copenhagen",
  "Bæst": "Bæst", "Kødbyens Fiskebar": "Kødbyens Fiskebar"
};

const DAYS = [
 {id:"wed", name:"רביעי", date:"28.10", iso:"2026-10-28", c:"--h1", title:"נחיתה והתמקמות",
  intro:"יום טיסות. נוחתים אחר הצהריים, שאטל למלון ומתמקמים.",
  stops:[
   {flight:true, h:"טיסות הלוך", en:"SWISS · דרך ציריך",
    flights:[["LX 257","תל אביב 05:20","ציריך 08:40"],["LX 1270","ציריך 12:20","קופנהגן 14:10"]],
    note:"נוחתים בטרמינל 2. כדאי לוודא את שעות הטיסה לפני היציאה."},
   {h:"שאטל מהשדה", en:"Shuttle", facts:[["שעה","15:15"]], links:[["פרטי השאטל",LINKS.shuttle]]},
   {p:"hotel", h:"מלון סקנדיק ספקטרום", en:"Scandic Spectrum Hotel", facts:[["מיקום","ליד התחנה המרכזית"]], links:[["אתר המלון",LINKS.hotel]]}
  ]},
 {id:"thu", name:"חמישי", date:"29.10", iso:"2026-10-29", c:"--h2", title:"שופינג, אופנה ועיצוב הבית",
  intro:"יום של המדרחוב והחנויות. חמישי ושישי הם הימים הכי טובים לשופינג, כי בסופ״ש החנויות נסגרות מוקדם.",
  stops:[
   {p:"rundetaarn", h:"המגדל העגול", en:"Rundetårn", facts:[["שעות","כל יום 10:00–18:00"],["עלות","כ‑40 DKK למבוגר"]]},
   {p:"zara", h:"ZARA ו‑Uniqlo במדרחוב", en:"Strøget", facts:[["שעות","10:00–19:00"],["עלות","כניסה חופשית"]]},
   {ps:["illums","hay"], h:"Illums Bolighus ו‑HAY House", en:"על המדרחוב, כיכר Amagertorv", facts:[["Illums","כל יום 10:00–19:00"],["HAY House","10:00–18:00"],["עלות","כניסה חופשית"]]},
   {p:"designmuseum", h:"המוזיאון הדני לאמנות ועיצוב", en:"Designmuseum Danmark", facts:[["שעות","בחמישי פתוח עד 20:00"],["עלות","כ‑140 DKK למבוגר"]],
    note:"כדאי להזמין שעת כניסה מראש כדי לדלג על התור. עם Copenhagen Card בוחרים כרטיס חינמי רק בשביל השריון.",
    links:[["הזמנת כרטיסים",LINKS.design]]},
   {p:"bertels", h:"קינוח וצעצועים", en:"Bertels Salon", facts:[["מה","עוגות גבינה (המלצה של סילביה)"],["ועוד","חנויות משחקים"]]}
  ]},
 {id:"fri", name:"שישי", date:"30.10", iso:"2026-10-30", c:"--h3", title:"קאסטלט, ארמונות ושייט",
  intro:"בוקר ליד הארמון, חילופי משמר בצהריים ושייט תעלות מניהאבן.",
  route:"מהתחנה המרכזית (København H) או מ‑Rådhuspladsen לוקחים מטרו M3 או M4 עד Marmorkirken. משם שתי דקות הליכה לארמון.",
  stops:[
   {p:"kastellet", h:"קאסטלט", en:"Kastellet", facts:[["שעות","כל יום 06:00–20:00"],["עלות","חינם"]], note:"תוספת מצוינת לבוקר, הליכה קצרה מהארמון."},
   {p:"amalienborg", h:"ארמון אמאליאנבורג", en:"Amalienborg", facts:[["מתי","חילופי משמר כל יום ב‑12:00"],["עלות","צפייה מבחוץ בחינם"]]},
   {p:"nyhavn", h:"ניהאבן ושייט תעלות", en:"Nyhavn · Stromma Classic Canal Tour", facts:[["יציאה","Nyhavn 3, בסירות מקורות ומחוממות"],["קופות","שישי 09:30–18:30, סירה אחרונה בערך ב‑17:00"],["עלות","109–135 DKK למבוגר"]],
    note:"מזמינים באתר Stromma: בוחרים תאריך ונקודת יציאה Nyhavn ומקבלים כרטיס אלקטרוני.",
    links:[["הזמנת שייט",LINKS.stromma]]}
  ]},
 {id:"sat", name:"שבת", date:"31.10", iso:"2026-10-31", c:"--h4", title:"שוק, טירה וטיבולי בהאלווין",
  intro:"שוק האוכל בבוקר, טירת רוזנבורג, ובערב טיבולי בתפאורת ליל כל הקדושים.",
  route:"מטרו או רכבת S מהתחנה המרכזית עד Nørreport. התחנה ממש מול גני המלך שמקיפים את טירת רוזנבורג.",
  stops:[
   {p:"torvehallerne", h:"שוק האוכל טורבהאלרנה", en:"Torvehallerne", facts:[["שעות","שבת 10:00–18:00 (חלק מדוכני הקפה מ‑07:00)"],["עלות","כניסה חופשית"]],
    note:"לא לפספס את הקפה של Coffee Collective."},
   {p:"rosenborg", h:"טירת רוזנבורג", en:"Rosenborg Castle", facts:[["שעות","10:00–17:00"],["עלות","כ‑140 DKK למבוגר"]],
    note:"חובה להזמין חלון זמן מראש, גם עם Copenhagen Card (בוחרים כרטיס חינמי מסוג Copenhagen Card).",
    links:[["הזמנת חלון זמן",LINKS.rosenborg]]},
   {p:"tivoli", h:"גני טיבולי, ספיישל האלווין", en:"Tivoli Gardens", facts:[["שעות","שבת 11:00–00:00"],["עלות","כניסה כ‑150 DKK, מתקנים (Ride Pass) עוד כ‑269 DKK"]],
    note:"הכרטיסים כבר שמורים דרך GetYourGuide. אפשר לבטל עד 30.10.",
    links:[["אתר טיבולי",LINKS.tivoli]]}
  ]},
 {id:"sun", name:"ראשון", date:"1.11", iso:"2026-11-01", c:"--h5", title:"בוקר רגוע וטיסה הביתה",
  intro:"רוב חנויות העיצוב סגורות בראשון, אז זה בוקר לשיטוט נינוח לפני שיוצאים לשדה.",
  stops:[
   {ps:["christianshavn","vaernedamsvej"], h:"רעיונות לבוקר", en:"מתוך ההמלצות", facts:[["שיטוט","קריסטיאנסהאבן, תעלות ורחובות אבן"],["או","פרדריקסברג ורחוב Værnedamsvej"]]},
   {h:"יציאה לשדה", en:"Kastrup, טרמינל 2", facts:[["שעה","16:00"]]},
   {flight:true, h:"טיסות חזור", en:"SWISS · דרך ציריך",
    flights:[["LX 1273","קופנהגן 19:55","ציריך 21:45"],["LX 256","ציריך 22:45","תל אביב 03:35 (+1)"]],
    note:"נוחתים ביום שני 2.11 בטרמינל 3."}
  ]}
];

const TIPS = [
 {h:"תחבורה: אפליקציית DOT Billetter", body:[
   ["", "מורידים מראש ומזינים כרטיס אשראי. כשהרגליים כואבות או מתחיל גשם, קונים בשתי לחיצות כרטיס בודד ל‑2 אזורים (Zones 1‑2). הכרטיס תקף לשעה ורבע במטרו, אוטובוס ורכבת במרכז העיר."]]},
 {h:"מה להזמין מראש", body:[
   ["טירת רוזנבורג","חלונות זמן קשיחים, כרטיסים לשעות הקרובות נגמרים.",LINKS.rosenborg],
   ["המוזיאון לעיצוב","תורים בקופות, בעיקר בסופ״ש.",LINKS.design],
   ["גני טיבולי","תורים ארוכים וקרים בקופות. כבר הוזמן.",LINKS.tivoli],
   ["כנסיית גואלנו","לטיפוס על המגדל הספירלי צריך חלון זמן."],
   ["החממה הבוטנית (Palm House)","כניסה בחלונות זמן בלבד."],
   ["סיורי בוטיק","למשל Hey Captain, סירות קטנות עם ספות, תה ויין. מתמלאים מראש."]]},
 {h:"שעות פתיחה בסופ״ש", body:[["", "בשבת רוב החנויות נסגרות סביב 16:00–17:00, ובראשון חלק גדול מחנויות העיצוב (כולל Louis Poulsen) סגורות. שופינג בחמישי ושישי, מוזיאונים ושיטוט בשבת וראשון."]]}
];

// Recommendation items: [title, text, placeId]
const RECS = [
 {h:"שווקי אוכל מקורים", items:[
   ["טורבהאלרנה","שוק החובה. שני אולמות זכוכית ליד Nørreport, יותר מ‑60 דוכנים: דגים, גבינות, מאפים, סמורברוד וקפה Coffee Collective.","torvehallerne"],
   ["Tivoli Food Hall","בכניסה לטיבולי, בלי צורך בכרטיס לפארק. כ‑15 דוכנים, מחומם ונעים לצהריים או ערב.","tivolifood"],
   ["לדלג בעונה הזאת","Reffen ו‑Broens Gadekøkken פתוחים לרוח, ו‑Reffen לרוב סגור בחורף."]]},
 {h:"רחובות לשיטוט", items:[
   ["ברדגאדה","Bredgade. השראה אדריכלית ועיצוב עילי.","bredgade"],
   ["אמאגרטורב והסטרוייט","Amagertorv. ספינות הדגל של העיצוב הדני: Illums Bolighus, HAY, Royal Copenhagen.","amagertorv"],
   ["פילסטראדה","Pilestræde. בוטיקים קטנים, חנויות לבית ועצירות קפה.","pilestraede"],
   ["קובמאגרגאדה","Købmagergade. אופנה ומותגים, מוביל צפונה לטורבהאלרנה.","kobmagergade"]]},
 {h:"חנויות עיצוב לבית", items:[
   ["Illums Bolighus","כלבו יוקרתי לעיצוב הבית, כמה קומות של ריהוט סקנדינבי וטקסטיל.","illums"],
   ["HAY House","חנות הדגל בקומה השנייה מעל המדרחוב.","hay"],
   ["Louis Poulsen","אולם התצוגה של חברת התאורה. סגור בראשון.","louis"]]},
 {h:"מוזיאונים", items:[
   ["Designmuseum Danmark","היסטוריה של העיצוב הדני, ריהוט ואדריכלות בבניין היסטורי.","designmuseum"],
   ["Ny Carlsberg Glyptotek","אמנות ופיסול קלאסי, וגן חורף מרהיב תחת כיפת זכוכית.","glyptotek"]]},
 {h:"שכונות", items:[
   ["פרדריקסברג","שדרות ופארק. רחוב Værnedamsvej עם בוטיקים, יין ובתי קפה.","vaernedamsvej"],
   ["קריסטיאנסהאבן","תעלות, סירות ורחובות אבן. מושלם לטיול בוקר.","christianshavn"]]}
];
