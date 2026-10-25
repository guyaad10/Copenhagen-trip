# קופנהגן 2026

A small site for our family trip to Copenhagen (28.10–1.11.2026): what we do each day, a page per day, an interactive map, and recommendations. Hebrew, right-to-left, built for phones.

Plain HTML, CSS and JavaScript. No build step.

## Files

- `index.html` – the page shell
- `js/data.js` – all trip content: days, places, tips, recommendations
- `js/app.js` – rendering, the day pages and the map
- `css/style.css` – styles (colors are tokens at the top, with a dark mode)
- `vendor/leaflet/` – Leaflet 1.9.4 for the map (map tiles come from OpenStreetMap, no API key needed)

## Adding a place

Add an entry to `PLACES` in `js/data.js`:

```js
{ id: "coffee-collective", he: "Coffee Collective", en: "Jægersborggade 57", type: "food", lat: 55.6935, lng: 12.5440 }
```

`type` is one of the keys in `TYPES` (food, museum, castle, shop, park, street, view, fun, boat, hotel, transit). It sets the icon and the map filter.
Places that no day refers to show on the map under "המלצות נוספות". To put a place on a day, set `p: "<id>"` (or `ps: [...]`) on that day's stop.

## Running locally

```sh
python3 -m http.server
```

Then open http://localhost:8000.

## Deploying

Every push to `main` deploys to GitHub Pages through `.github/workflows/pages.yml`.

## Saved places from Google Maps

`data/saved-places.csv` is the Copenhagen list from a Google Takeout export (Saved → `Copenhagen.csv`).
On push, `.github/workflows/geocode.yml` runs `scripts/geocode.py`, which looks up each place's coordinates
(cached in `data/geocoded.json`), writes `js/saved.js`, and redeploys. To update the list, replace the CSV and push.
A Google Maps tag sets the place's type (see `TAG_TYPES` in `js/data.js`); saved places show as white pins.
