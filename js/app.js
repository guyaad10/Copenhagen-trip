const MAP = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q + ", Copenhagen");
const esc = s => String(s).replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
// Keeps time and number ranges left-to-right inside Hebrew text.
const fmt = s => esc(s).replace(/\d{1,3}(:\d{2})?\s?[–-]\s?\d{1,3}(:\d{2})?/g, m => `<span class="latin">${m}</span>`);
const btn = ([t,u]) => `<a class="btn" href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a>`;
const icon = type => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${TYPES[type].icon}"/></svg>`;
const app = document.getElementById("app");

// Merge Google Maps saved places into PLACES
const savedName = n => n.replace(/\s*(\|\s*)?(Store & Showroom )?(Closes soon|Closed)$/i, "").trim();
SAVED.forEach((s, i) => {
  const same = PLACES.find(p => p.id === SAVED_SAME_AS[s.name]);
  if (same) { Object.assign(same, { url: s.url, note: s.note || same.note }); return; }
  PLACES.push({ id: "s" + i, he: savedName(s.name), en: "", type: SAVED_TYPES[s.name] || TAG_TYPES[s.tags[0]] || "other",
    lat: s.lat, lng: s.lng, url: s.url, note: s.note, saved: true, wiki: WIKI[s.name], key: s.name });
});
PLACES.forEach(p => { if (!p.wiki && WIKI[p.id]) p.wiki = WIKI[p.id]; });
const PLACE = Object.fromEntries(PLACES.map(p => [p.id, p]));
const placeUrl = p => p.url || MAP(p.q || p.en || p.he);
const stopPlaces = s => s.ps || (s.p ? [s.p] : []);
// place id -> days it appears on
const PLACE_DAYS = {};
DAYS.forEach(d => d.stops.forEach(s => stopPlaces(s).forEach(id => (PLACE_DAYS[id] = PLACE_DAYS[id] || []).push(d))));

function cphToday(){
  try { return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Copenhagen"}).format(new Date()); }
  catch(e){ return new Date().toISOString().slice(0,10); }
}
const TODAY = cphToday();

function countdown(){
  const d = Math.round((Date.parse("2026-10-28") - Date.parse(TODAY)) / 864e5);
  if (d > 1) return `עוד ${d} ימים`;
  if (d === 1) return "טסים מחר";
  if (TODAY <= "2026-11-01") return "אנחנו בקופנהגן";
  return "היה כיף";
}

function header(view){
  const houses = DAYS.map(d => `
    <button class="house${d.iso===TODAY?" today":""}" style="--c:var(${d.c})" data-go="${d.id}" aria-label="יום ${d.name} ${d.date}: ${esc(d.title)}">
      <span class="gable"></span>
      <span class="facade"><span class="wins"><i></i><i></i><i></i><i></i></span><b>${d.name}</b><small>${d.date}</small></span>
    </button>`).join("");
  return `
    <header class="top">
      <span class="eyebrow">טיול משפחתי · <span class="latin">28.10–1.11.2026</span></span>
      <h1>קופנהגן</h1>
      <div class="meta"><span class="chip">${countdown()}</span><span>מלון Scandic Spectrum</span><span>5 ימים, 4 לילות</span></div>
    </header>
    <nav class="row${view==="map"?" mini":""}" aria-label="ימי הטיול">${houses}</nav>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected="${view==="days"}" data-go="">לוח זמנים</button>
      <button role="tab" aria-selected="${view==="map"}" data-go="map">מפה</button>
    </div>`;
}

const MONTHS = { "10": "אוק׳", "11": "נוב׳" };
const STOP_ICON = { flight: "M10 21h4l1-3-1.5-1.5L17 13l4 1v-3l-7-3V4a2 2 0 0 0-4 0v4L3 11v3l4-1 3.5 3.5L9 18z" };
const stopIcon = s => s.flight ? STOP_ICON.flight : (stopPlaces(s)[0] ? TYPES[PLACE[stopPlaces(s)[0]].type].icon : null);
const svgPath = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const homeDays = new Set(); // empty = all days
const toggle = (set, v) => set.has(v) ? set.delete(v) : set.add(v);
const homeCards = () => DAYS.filter(d => !homeDays.size || homeDays.has(d.id)).map(dayRow).join("");

function dayRow(d){
  const [, m, dd] = d.iso.split("-");
  const expanded = homeDays.has(d.id);
  const stops = expanded
    ? `<ol class="mini-stops">${d.stops.map(s => { const ic = stopIcon(s); return `<li>${ic?svgPath(ic):'<i class="sdot"></i>'}<span>${esc(s.h)}</span></li>`; }).join("")}</ol>`
    : `<span class="stops">${d.stops.map(s => { const ic = stopIcon(s); return `<span>${ic?svgPath(ic):""}${esc(s.h)}</span>`; }).join("")}</span>`;
  return `
    <div class="tlrow" style="--c:var(${d.c})">
      <div class="tile${d.iso===TODAY?" today":""}"><small>${d.name}</small><b>${+dd}</b><small>${MONTHS[m]}</small></div>
      <button class="dcard" data-go="${d.id}">
        <span class="body">
          ${d.iso===TODAY?'<span class="todaychip">היום</span>':""}
          <h3>${esc(d.title)}</h3>
          ${stops}
        </span>
        <span class="go" aria-hidden="true">${svgPath("M15 6l-6 6 6 6")}</span>
      </button>
    </div>`;
}

function dayFilter(){
  return `<div class="filters" aria-label="סינון לפי יום">${[["all","כל הימים",""], ...DAYS.map(d => [d.id, `${d.name} ${d.date}`, d.c])]
    .map(([id,label,c]) => `<button class="fchip" aria-pressed="${id==="all" ? !homeDays.size : homeDays.has(id)}" data-homeday="${id}" ${c?`style="--c:var(${c})"`:""}>${c?'<i class="dot"></i>':""}${label}</button>`).join("")}</div>`;
}

function home(){
  const cards = homeCards();
  const tips = TIPS.map((t,i) => `
    <details ${i===0?"open":""}><summary>${esc(t.h)}</summary><div class="dbody">
      ${t.body.map(([b,p,u]) => `<div class="item">${b?`<b>${esc(b)}</b>`:""}<p>${fmt(p)}${u?` <a href="${esc(u)}" target="_blank" rel="noopener">להזמנה ↗</a>`:""}</p></div>`).join("")}
    </div></details>`).join("");
  const recs = RECS.map(r => `
    <details><summary>${esc(r.h)}</summary><div class="dbody">
      ${r.items.map(([b,p,id]) => `<div class="item">${id?`<b><button class="linkish" data-place="${id}">${esc(b)}</button></b>`:`<b>${esc(b)}</b>`}<p>${esc(p)}</p></div>`).join("")}
    </div></details>`).join("");

  app.innerHTML = header("days") + `
    <section class="daysec"><h2>מה עושים בכל יום</h2>${dayFilter()}<div class="tl">${cards}</div></section>
    <section><h2>לפני שיוצאים</h2>${tips}</section>
    <section><h2>המלצות</h2>${recs}
      <a class="btn" style="align-self:flex-start" href="${LINKS.guide}" target="_blank" rel="noopener">מדריך המלצות למטייל ↗</a></section>
    <footer>נבנה מתוך המסמך "קופנהגן - מסלול והמלצות". שעות ומחירים משוערים, כדאי לבדוק לפני.</footer>`;
}

function day(id){
  const i = DAYS.findIndex(d => d.id === id), d = DAYS[i];
  const prev = DAYS[i-1], next = DAYS[i+1];
  const stops = d.stops.map(s => {
    const ps = stopPlaces(s).map(pid => PLACE[pid]);
    const links = [...(s.links||[]), ...ps.map(p => [ps.length > 1 ? p.he + " במפה" : "ב‑Google Maps", placeUrl(p)])];
    const t = ps[0] ? ps[0].type : null;
    return `
    <li class="stop" style="--c:var(${d.c})"><span class="smark">${stopIcon(s)?svgPath(stopIcon(s)):""}</span><div class="card">
      <div class="cardhead"><div><h3>${esc(s.h)}</h3><div class="en">${esc(s.en)}</div></div></div>
      ${s.flights?s.flights.map(([n,a,b])=>`<div class="flightrow"><b class="latin">${n}</b><span>${esc(a)} ← ${esc(b)}</span></div>`).join(""):""}
      ${s.facts?`<dl class="facts">${s.facts.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${fmt(v)}</dd>`).join("")}</dl>`:""}
      ${s.note?`<p class="note">${fmt(s.note)}</p>`:""}
      ${links.length || ps.length ? `<div class="links">${ps.length?`<button class="btn" data-place="${ps[0].id}" data-day="${d.id}">על המפה</button>`:""}${links.map(btn).join("")}</div>`:""}
    </div></li>`;
  }).join("");
  app.innerHTML = `
    <button class="back" data-go="">→ כל הימים</button>
    <header class="dayhead" style="--c:var(${d.c})">
      <span class="when">יום ${d.name} · ${d.date}${d.iso===TODAY?" · היום":""}</span>
      <h1>${esc(d.title)}</h1>
      <p>${esc(d.intro)}</p>
    </header>
    ${d.route?`<div class="route"><b>איך מגיעים</b>${esc(d.route)}</div>`:""}
    <ol class="timeline">${stops}</ol>
    <nav class="pager">
      <button ${prev?`data-go="${prev.id}"`:"disabled"}>→ ${prev?`יום ${prev.name}`:""}</button>
      <button ${next?`data-go="${next.id}"`:"disabled"}>${next?`יום ${next.name}`:""} ←</button>
    </nav>`;
}

/* ---------- map ---------- */
const mapState = { days: new Set(), types: new Set(), sel: null }; // empty set = no filter
let lmap = null, markers = {}, routeLines = [];

const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const HOME = "hotel";
const HOME_ICON = "M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10";

function visiblePlaces(){
  return PLACES.filter(p => {
    if (p.id === HOME) return true;  // the hotel stays on the map under every filter
    const days = PLACE_DAYS[p.id] || [];
    if (mapState.days.size && !(days.some(d => mapState.days.has(d.id)) || (!days.length && mapState.days.has("rec")))) return false;
    if (mapState.types.size && !mapState.types.has(p.type)) return false;
    return true;
  });
}

function mapView(){
  const usedTypes = Object.keys(TYPES).filter(t => PLACES.some(p => p.type === t));
  const dayChips = [["all","הכל",""], ...DAYS.map(d => [d.id, d.name, d.c]), ["rec","מקומות שמורים",""]]
    .map(([id,label,c]) => `<button class="fchip" aria-pressed="${id==="all" ? !mapState.days.size : mapState.days.has(id)}" data-day="${id}" ${c?`style="--c:var(${c})"`:""}>${c?'<i class="dot"></i>':""}${label}</button>`).join("");
  const typeChips = usedTypes.map(t => `<button class="fchip" aria-pressed="${mapState.types.has(t)}" data-type="${t}">${icon(t)}${TYPES[t].he}</button>`).join("");
  app.innerHTML = header("map") + `
    <section class="mapsec">
      <div class="mapbox" id="mapbox">
        <div class="filters" aria-label="סינון לפי יום">${dayChips}</div>
        <div class="filters" aria-label="סינון לפי סוג">${typeChips}</div>
        <div class="mapwrap">
          <div id="map" dir="ltr" role="region" aria-label="מפת קופנהגן"></div>
          <button class="fullbtn" id="fullbtn" aria-pressed="false" aria-label="מסך מלא">${svgPath(FULL_ICON.open)}</button>
          <button class="fullbtn homebtn" id="homebtn" aria-label="הצג את המלון">${svgPath(HOME_ICON)}</button>
        </div>
      </div>
      <div id="plist" class="plist"></div>
    </section>`;
  buildMap();
}

function buildMap(){
  if (lmap) { lmap.remove(); lmap = null; }
  const el = document.getElementById("map");
  if (typeof L === "undefined") { el.innerHTML = '<p class="maperr">המפה לא נטענה. בדקו חיבור לאינטרנט.</p>'; return; }
  lmap = L.map(el, { zoomControl: true, attributionControl: true }).setView([55.680, 12.580], 14);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(lmap);
  lmap.on("click", () => select(null, false));
  drawMarkers(true);
}

function drawMarkers(fit){
  if (!lmap) return;
  Object.values(markers).forEach(m => m.remove()); markers = {};
  routeLines.forEach(l => l.remove()); routeLines = [];
  const list = visiblePlaces();
  list.forEach(p => {
    const days = PLACE_DAYS[p.id] || [];
    const home = p.id === HOME;
    const html = home
      ? `<div class="homepin${mapState.sel===p.id?" sel":""}"><span class="pin">${svgPath(HOME_ICON)}</span><span class="homelabel">המלון שלנו</span></div>`
      : days[0]
      ? `<div class="pin${mapState.sel===p.id?" sel":""}" style="--c:var(${days[0].c})">${icon(p.type)}</div>`
      : `<div class="pin saved${mapState.sel===p.id?" sel":""}">${icon(p.type)}</div>`;
    const m = L.marker([p.lat, p.lng], {
      icon: home ? L.divIcon({ html, className: "pinwrap", iconSize: [46,46], iconAnchor: [23,23] })
                 : L.divIcon({ html, className: "pinwrap", iconSize: [34,34], iconAnchor: [17,17] }),
      title: p.he, keyboard: true, zIndexOffset: home ? 1000 : 0
    }).addTo(lmap);
    m.on("click", () => select(p.id, false));
    markers[p.id] = m;
  });
  DAYS.filter(d => mapState.days.has(d.id)).forEach(d => {
    const pts = d.stops.flatMap(stopPlaces).map(id => PLACE[id]).filter(p => list.includes(p)).map(p => [p.lat, p.lng]);
    if (pts.length > 1) routeLines.push(L.polyline(pts, { color: cssVar(d.c), weight: 4, dashArray: "6 8", opacity: .9 }).addTo(lmap));
  });
  if (fit && !mapState.days.size && !mapState.types.size) {
    lmap.setView([55.6815, 12.577], 14);  // city center; the full list reaches far suburbs
  } else if (fit && list.length) {
    if (list.length === 1) lmap.setView([list[0].lat, list[0].lng], 16);
    else lmap.fitBounds(L.latLngBounds(list.map(p => [p.lat, p.lng])), { padding: [36,36], maxZoom: 16 });
  }
  renderList(list);
  renderSel();
}

function renderList(list){
  const byType = {};
  list.forEach(p => (byType[p.type] = byType[p.type] || []).push(p));
  document.getElementById("plist").innerHTML = list.length ? Object.keys(TYPES).filter(t => byType[t]).map(t => `
    <details class="pgroup" ${list.length <= 40 ? "open" : ""}><summary>${icon(t)}${TYPES[t].he}<span class="count">${byType[t].length}</span></summary>
      ${byType[t].map(p => `<button class="prow${mapState.sel===p.id?" on":""}" data-place="${p.id}">
        <span>${esc(p.he)}</span>${(PLACE_DAYS[p.id]||[]).map(d=>`<i class="dot" style="--c:var(${d.c})" title="יום ${d.name}"></i>`).join("")}</button>`).join("")}
    </details>`).join("") + missingList() : '<p class="muted">אין מקומות שמתאימים לסינון.</p>';
}

function missingList(){
  if (!SAVED_MISSING.length || (mapState.days.size && !mapState.days.has("rec"))) return "";
  return `<details class="pgroup"><summary>${icon("other")}בלי מיקום על המפה<span class="count">${SAVED_MISSING.length}</span></summary>
    ${SAVED_MISSING.map(s => `<a class="prow" href="${esc(s.url)}" target="_blank" rel="noopener"><span>${esc(savedName(s.name))}</span>↗</a>`).join("")}</details>`;
}

/* place card: a popover on the map on wide screens, a bottom drawer on phones */
const isPhone = () => matchMedia("(max-width: 700px)").matches;
const photoCache = {};
async function photo(p){
  const own = IMAGES[p.key || p.id];
  if (own) return own;
  if (!p.wiki) return null;
  if (!(p.wiki in photoCache)) photoCache[p.wiki] = fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(p.wiki.replace(/ /g, "_")))
    .then(r => r.ok ? r.json() : null).then(j => j && (j.thumbnail || j.originalimage) ? (j.originalimage && j.originalimage.width <= 1200 ? j.originalimage.source : j.thumbnail.source) : null)
    .catch(() => null);
  return photoCache[p.wiki];
}

function placeCard(p){
  const days = PLACE_DAYS[p.id] || [];
  const c = days[0] ? `var(${days[0].c})` : "var(--rec)";
  return `<div class="pcard" dir="rtl" data-card="${p.id}">
    <div class="pphoto" style="--c:${c}">${icon(p.type)}</div>
    <div class="pbody">
      <div><h3>${esc(p.he)}</h3><div class="en">${esc(TYPES[p.type].he)}${p.en ? " · " + esc(p.en) : ""}</div></div>
      ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
      <a class="gbtn" href="${esc(placeUrl(p))}" target="_blank" rel="noopener">${svgPath("M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5")}פתיחה ב‑Google Maps</a>
      ${days.length ? `<div class="links">${days.map(d => `<button class="btn daybtn" style="--c:var(${d.c})" data-go="${d.id}">יום ${d.name}</button>`).join("")}</div>` : ""}
    </div>
  </div>`;
}

let popup = null;
function drawer(){
  let d = document.getElementById("drawer");
  if (d) return d;
  d = document.createElement("div");
  d.id = "drawer"; d.className = "drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "פרטי מקום");
  d.innerHTML = '<div class="grab" aria-hidden="true"></div><button class="dclose" aria-label="סגירה">' + svgPath("M6 6l12 12M18 6L6 18") + '</button><div class="dcontent"></div>';
  document.body.appendChild(d);
  d.querySelector(".dclose").addEventListener("click", () => select(null));
  // swipe down to close
  let y0 = null;
  d.addEventListener("touchstart", e => { y0 = e.touches[0].clientY; }, { passive: true });
  d.addEventListener("touchmove", e => { if (y0 === null) return; const dy = Math.max(0, e.touches[0].clientY - y0); d.style.transform = `translateY(${dy}px)`; }, { passive: true });
  d.addEventListener("touchend", e => { const dy = y0 === null ? 0 : e.changedTouches[0].clientY - y0; y0 = null; d.style.transform = ""; if (dy > 70) select(null); });
  d.addEventListener("click", e => { if (e.target.closest("[data-go]")) { hideCard(); } });
  return d;
}

function hideCard(){
  if (popup && lmap) lmap.closePopup(popup);
  popup = null;
  document.getElementById("drawer")?.classList.remove("open");
}

function renderSel(){
  const p = PLACE[mapState.sel];
  if (!p || !lmap) { hideCard(); return; }
  const html = placeCard(p);
  if (isPhone()) {
    if (popup) { lmap.closePopup(popup); popup = null; }
    const d = drawer();
    d.querySelector(".dcontent").innerHTML = html;
    d.classList.add("open");
  } else {
    document.getElementById("drawer")?.classList.remove("open");
    popup = L.popup({ className: "placepop", maxWidth: 300, minWidth: 260, offset: [0, -14], autoPanPaddingTopLeft: [20, 80], autoPanPaddingBottomRight: [20, 20] })
      .setLatLng([p.lat, p.lng]).setContent(html).openOn(lmap);
    popup.on("remove", () => { if (mapState.sel === p.id) { mapState.sel = null; markSel(); } });
  }
  photo(p).then(src => {
    if (!src) return;
    document.querySelectorAll(`[data-card="${p.id}"] .pphoto`).forEach(el => {
      el.innerHTML = `<img src="${esc(src)}" alt="" loading="lazy">`; el.classList.add("has");
    });
    if (popup) popup.update();
  });
}

function markSel(){
  const id = mapState.sel;
  Object.entries(markers).forEach(([pid, m]) => m.getElement()?.querySelector(".pin, .homepin")?.classList.toggle("sel", pid === id));
  document.querySelectorAll(".prow").forEach(b => b.classList.toggle("on", b.dataset.place === id));
}

function select(id, pan){
  mapState.sel = id;
  markSel();
  const p = PLACE[id];
  if (pan && lmap && p) lmap.setView([p.lat, p.lng], Math.max(lmap.getZoom(), 16), { animate: false });
  renderSel();
}

const FULL_ICON = { open: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5", close: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" };
function setFull(on){
  const box = document.getElementById("mapbox"), b = document.getElementById("fullbtn");
  if (!box) return;
  box.classList.toggle("full", on);
  document.documentElement.classList.toggle("noscroll", on);
  b.setAttribute("aria-pressed", on);
  b.setAttribute("aria-label", on ? "יציאה ממסך מלא" : "מסך מלא");
  b.innerHTML = svgPath(on ? FULL_ICON.close : FULL_ICON.open);
  if (lmap) setTimeout(() => lmap.invalidateSize(), 50);
}
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (mapState.sel) select(null); else setFull(false); } });

/* ---------- routing ---------- */
function render(){
  const id = (location.hash||"").slice(1);
  if (id !== "map" && lmap) { hideCard(); lmap.remove(); lmap = null; }
  document.documentElement.classList.remove("noscroll");
  if (id === "map") mapView();
  else if (DAYS.some(d => d.id === id)) day(id);
  else home();
}
function go(id){
  if (location.hash.slice(1) === id) render();
  else location.hash = id ? id : "";
  if (!id) history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo(0,0);
}

app.addEventListener("click", e => {
  if (e.target.closest("#homebtn")) { select(HOME, true); return; }
  if (e.target.closest("#fullbtn")) { setFull(!document.getElementById("mapbox").classList.contains("full")); return; }
  const g = e.target.closest("[data-go]");
  if (g) { go(g.dataset.go); return; }
  const hd = e.target.closest("[data-homeday]");
  if (hd) { const v = hd.dataset.homeday; v === "all" ? homeDays.clear() : toggle(homeDays, v);
    document.querySelector(".daysec .tl").innerHTML = homeCards();
    document.querySelectorAll("[data-homeday]").forEach(b => b.setAttribute("aria-pressed", b.dataset.homeday === "all" ? !homeDays.size : homeDays.has(b.dataset.homeday))); return; }
  const pl = e.target.closest("[data-place]");
  if (pl) {
    const dayId = pl.dataset.day;
    if (location.hash !== "#map") {
      mapState.days = new Set(dayId ? [dayId] : []); mapState.types.clear(); mapState.sel = pl.dataset.place;
      go("map");
      setTimeout(() => select(pl.dataset.place, true), 0);
    } else select(pl.dataset.place, true);
    return;
  }
  const dc = e.target.closest("[data-day]");
  if (dc) { const v = dc.dataset.day; v === "all" ? mapState.days.clear() : toggle(mapState.days, v); mapState.sel = null;
    document.querySelectorAll("[data-day].fchip").forEach(b => b.setAttribute("aria-pressed", b.dataset.day === "all" ? !mapState.days.size : mapState.days.has(b.dataset.day)));
    drawMarkers(true); return; }
  const tc = e.target.closest("[data-type]");
  if (tc) { const t = tc.dataset.type; mapState.types.has(t) ? mapState.types.delete(t) : mapState.types.add(t);
    tc.setAttribute("aria-pressed", mapState.types.has(t)); drawMarkers(true); }
});
window.addEventListener("hashchange", render);
render();
