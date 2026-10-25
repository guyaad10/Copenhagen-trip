"""Build js/saved.js from the Google Maps saved-places export (data/saved-places.csv).

Google's export has names, notes, tags and place links but no coordinates, so this
looks each place up once and keeps the result in data/geocoded.json:
  1. the Google Maps place page (its preview image URL carries the place's center)
  2. OpenStreetMap Nominatim, by name, inside Copenhagen

Run with --offline to rebuild js/saved.js from the cache without any lookups.
Fix a wrong pin by editing its entry in data/geocoded.json and setting "src": "manual"; "src": "none" keeps a place off the map.
"""
import csv
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "saved-places.csv"
CACHE_PATH = ROOT / "data" / "geocoded.json"
OUT_PATH = ROOT / "js" / "saved.js"

# Greater Copenhagen, generous enough for Ordrupgaard and Amager
LOG = []
BBOX = (55.55, 12.30, 55.82, 12.72)
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
NOMINATIM_UA = "Copenhagen-trip/1.0 (https://github.com/guyaad10/Copenhagen-trip)"


def in_bbox(lat, lng):
    return BBOX[0] <= lat <= BBOX[2] and BBOX[1] <= lng <= BBOX[3]


def get(url, ua=UA):
    # the cookies skip Google's EU consent page
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept-Language": "en", "Cookie": "CONSENT=YES+cb; SOCS=CAI"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.geturl(), r.read().decode("utf-8", "replace")


PATTERNS = [
    # [[[altitude, lng, lat]: the map center Google renders the place page with
    re.compile(r"APP_INITIALIZATION_STATE=\[\[\[[\d.]+,(-?\d+\.\d+),(-?\d+\.\d+)\]"),
    re.compile(r"center=(-?\d+\.\d+)%2C(-?\d+\.\d+)"),
    re.compile(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)"),
    re.compile(r"@(-?\d+\.\d+),(-?\d+\.\d+),"),
    re.compile(r"\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]"),
]


def from_google(url):
    final, html = get(url + ("&" if "?" in url else "?") + "hl=en")
    for text in (final, html):
        for pat in PATTERNS:
            for m in pat.finditer(text):
                a, b = float(m.group(1)), float(m.group(2))
                lat, lng = (b, a) if pat is PATTERNS[0] else (a, b)
                if in_bbox(lat, lng):
                    return lat, lng
    title = re.search(r"<title>(.*?)</title>", html, re.S)
    LOG.append(f"google: no coordinates at {urllib.parse.urlsplit(final).netloc}, title {title.group(1)[:80] if title else '-'}")
    return None


def clean(name):
    name = re.sub(r"\s*(\|.*|Closes soon|Closed|ApS\.?|HQ)$", "", name, flags=re.I)
    return re.sub(r"\s+-\s+.*$", "", name).strip()


def from_nominatim(name):
    for q in dict.fromkeys([name, clean(name), clean(name) + " København"]):
        hit = nominatim_query(q)
        if hit:
            return hit
    return None


def nominatim_query(name):
    q = urllib.parse.urlencode({
        "q": name, "format": "json", "limit": 1, "bounded": 1,
        "viewbox": f"{BBOX[1]},{BBOX[2]},{BBOX[3]},{BBOX[0]}",
    })
    _, body = get("https://nominatim.openstreetmap.org/search?" + q, ua=NOMINATIM_UA)
    time.sleep(1.1)  # Nominatim allows one request per second
    hits = json.loads(body)
    if hits:
        lat, lng = float(hits[0]["lat"]), float(hits[0]["lon"])
        if in_bbox(lat, lng):
            return lat, lng, hits[0].get("display_name", "")[:120]
    return None


def main():
    offline = "--offline" in sys.argv
    rows = [r for r in csv.DictReader(CSV_PATH.open(encoding="utf-8")) if r["Title"].strip()]
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}

    for r in rows:
        url = r["URL"].strip()
        if url in cache and cache[url]["src"] == "nominatim" and "match" not in cache[url]:
            del cache[url]  # look it up again so the matched address gets recorded
        if offline or url in cache:
            continue
        found, source = None, None
        try:
            found = from_google(url)
            source = "google" if found else None
        except Exception as e:  # keep going; the next source may work
            LOG.append(f"google failed for {r['Title']}: {e}")
        if not found:
            try:
                found = from_nominatim(r["Title"])
                source = "nominatim" if found else None
                if found:
                    LOG.append(f"   matched {found[2]}")
            except Exception as e:
                print(f"nominatim failed for {r['Title']}: {e}")
        if found:
            cache[url] = {"lat": round(found[0], 6), "lng": round(found[1], 6), "src": source, "name": r["Title"]}
            if len(found) > 2:
                cache[url]["match"] = found[2]
            LOG.append(f"{source:9} {r['Title']}")
        else:
            LOG.append(f"MISSING   {r['Title']}")
        time.sleep(0.5)

    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")

    saved, missing = [], []
    for r in rows:
        url = r["URL"].strip()
        tags = [t.split(" ", 1)[-1].strip() for t in r["Tags"].split(";") if t.strip()]
        item = {"name": r["Title"].strip(), "note": r["Note"].strip(), "url": url, "tags": tags}
        if url in cache and cache[url]["src"] != "none":
            item.update(lat=cache[url]["lat"], lng=cache[url]["lng"])
            saved.append(item)
        else:
            missing.append(item)

    OUT_PATH.write_text(
        "// Generated by scripts/geocode.py from data/saved-places.csv. Do not edit by hand.\n"
        f"const SAVED = {json.dumps(saved, ensure_ascii=False, indent=1)};\n"
        f"const SAVED_MISSING = {json.dumps(missing, ensure_ascii=False, indent=1)};\n",
        encoding="utf-8",
    )
    LOG.append(f"{len(saved)} placed, {len(missing)} without coordinates")
    print("\n".join(LOG))
    if not offline:
        (ROOT / "data" / "geocode-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
