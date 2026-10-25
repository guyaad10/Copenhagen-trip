"""Find a photo for every place on the map and save it under img/places/.

Sources, in order:
  1. the place's Wikipedia article (WIKI in js/data.js)
  2. OpenStreetMap tags for the place (image, wikimedia_commons, wikidata)
  3. the place's own website (its og:image / twitter:image preview picture)
  4. a web search for the place, using the preview picture of the first useful result

Results are cached in data/images.json; js/images.js maps place keys to files.
Set an entry's "src" to "none" in data/images.json to drop a bad picture, or put
your own file in img/places/ and point the entry at it with "src": "manual".
"""
import base64
import hashlib
import io
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE_PATH = ROOT / "data" / "images.json"
OUT_PATH = ROOT / "js" / "images.js"
IMG_DIR = ROOT / "img" / "places"
LOG = []
UA = "Copenhagen-trip/1.0 (https://github.com/guyaad10/Copenhagen-trip)"
BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def get(url, ua=UA, raw=False):
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=20) as r:
        body = r.read()
        return body if raw else body.decode("utf-8", "replace")


def places():
    """(key, search name, lat, lng) for itinerary places and saved places."""
    data = (ROOT / "js" / "data.js").read_text(encoding="utf-8")
    out = []
    for m in re.finditer(r'\{ id: "([^"]+)",.*?en: "([^"]*)",.*?lat: ([\d.]+), lng: ([\d.]+)(?:, q: "([^"]+)")?', data):
        pid, en, lat, lng, q = m.groups()
        out.append((pid, q or en, float(lat), float(lng)))
    saved = (ROOT / "js" / "saved.js").read_text(encoding="utf-8")
    arr = json.loads(saved[saved.index("const SAVED = ") + 14: saved.index("];\n") + 1])
    for s in arr:
        out.append((s["name"], s["name"], s["lat"], s["lng"]))
    wiki = {}
    block = data[data.index("const WIKI = {"): data.index("};", data.index("const WIKI = {"))]
    for k, v in re.findall(r'"?([^",{\n]+?)"?:\s*"([^"]+)"', block.split("{", 1)[1]):
        wiki[k.strip()] = v
    return out, wiki


def commons_url(filename):
    filename = filename.replace("File:", "").strip()
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(filename) + "?width=900"


def from_wikipedia(title):
    j = json.loads(get("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"))))
    img = j.get("originalimage") or j.get("thumbnail")
    if not img:
        return None
    if j.get("thumbnail") and img["width"] > 1200:
        return re.sub(r"/\d+px-", "/960px-", j["thumbnail"]["source"])  # Wikimedia only serves standard widths
    return img["source"]


def osm_tags(name, lat, lng):
    d = 0.004
    q = urllib.parse.urlencode({
        "q": re.sub(r"\s*(\|.*|Closes soon|Closed)$", "", name), "format": "json", "limit": 1, "bounded": 1,
        "extratags": 1, "viewbox": f"{lng - d},{lat + d},{lng + d},{lat - d}",
    })
    hits = json.loads(get("https://nominatim.openstreetmap.org/search?" + q))
    time.sleep(1.5)  # Nominatim allows one request per second
    return (hits[0].get("extratags") or {}) if hits else {}


def from_osm(tags):
    if tags.get("image", "").startswith("http"):
        return tags["image"], "osm image"
    if tags.get("wikimedia_commons", "").startswith("File:"):
        return commons_url(tags["wikimedia_commons"]), "commons"
    if tags.get("wikidata"):
        q = tags["wikidata"]
        j = json.loads(get(f"https://www.wikidata.org/wiki/Special:EntityData/{q}.json"))
        claims = j["entities"][q]["claims"]
        if "P18" in claims:
            return commons_url(claims["P18"][0]["mainsnak"]["datavalue"]["value"]), "wikidata"
    return None, None


def from_website(url):
    html = get(url, ua=BROWSER_UA)
    for pat in (r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image',
                r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)'):
        m = re.search(pat, html, re.I)
        if m:
            return urllib.parse.urljoin(url, m.group(1).replace("&amp;", "&"))
    return None


SKIP_HOSTS = ("duckduckgo.com", "maps.apple.com", "instagram.com", "facebook.com", "tiktok.com", "google.", "youtube.com", "linkedin.com", "wikipedia.org")


def search_links(name):
    """Result links from Bing, then DuckDuckGo."""
    q = f"{name} Copenhagen"
    links = []
    try:
        html = get("https://www.bing.com/search?" + urllib.parse.urlencode({"q": q, "setlang": "en", "cc": "DK"}), ua=BROWSER_UA)
        links = re.findall(r'<li class="b_algo".*?<h2[^>]*><a[^>]+href="(https?://[^"]+)"', html, re.S)
    except Exception as e:
        LOG.append(f"bing failed for {name}: {e}")
    if not links:
        html = get("https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": q}), ua=BROWSER_UA)
        links = re.findall(r'class="result__a" href="([^"]+)"', html)
    time.sleep(3)
    return [l.replace("&amp;", "&") for l in links]


def from_search(name):
    """Preview pictures of the first few useful search results, as (image, page) pairs."""
    found = []
    for href in search_links(name):
        if len(found) >= 5:
            break
        if "bing.com/ck/a" in href:
            u = re.search(r"[?&]u=a1([^&]+)", href)
            if not u:
                continue
            href = base64.urlsafe_b64decode(u.group(1) + "=" * (-len(u.group(1)) % 4)).decode("utf-8", "replace")
        if "uddg=" in href:
            href = urllib.parse.unquote(re.search(r"uddg=([^&]+)", href).group(1))
        if not href.startswith("http") or any(h in href for h in SKIP_HOSTS):
            continue
        try:
            img = from_website(href)
        except Exception:
            continue
        if img:
            found.append((img, href))
    return found


def is_logo(im):
    """Wordmarks and banners are dominated by one flat color; photos are not."""
    small = im.resize((64, 64))
    counts = {}
    for r, g, b in small.getdata():
        q = (r // 24, g // 24, b // 24)
        counts[q] = counts.get(q, 0) + 1
    return max(counts.values()) / (64 * 64) > 0.42


def save(key, url):
    raw = get(url, ua=BROWSER_UA, raw=True)
    im = Image.open(io.BytesIO(raw))
    if im.width < 300 or im.height < 200:
        raise ValueError(f"too small ({im.width}x{im.height}), probably a logo")
    im = im.convert("RGB")
    if is_logo(im):
        raise ValueError("mostly one flat color, probably a logo or a blank banner")
    im.thumbnail((900, 900))
    slug = re.sub(r"[^a-z0-9]+", "-", key.lower()).strip("-")[:40] or "place"
    name = f"{slug}-{hashlib.sha1(key.encode()).hexdigest()[:6]}.jpg"
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    im.save(IMG_DIR / name, "JPEG", quality=78, optimize=True, progressive=True)
    return "img/places/" + name


def try_save(cache, key, candidates):
    for url, src, page in candidates:
        try:
            cache[key] = {"file": save(key, url), "src": src, "from": url}
            if page:
                cache[key]["page"] = page
            LOG.append(f"{src:10} {key}" + (f"  ({page})" if page else ""))
            return True
        except Exception as e:
            LOG.append(f"skip {src} for {key}: {e}")
    return False


def main():
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}
    items, wiki = places()
    for key, name, lat, lng in items:
        if key in cache and cache[key].get("src") == "none":
            continue
        if key in cache:
            f = ROOT / cache[key]["file"]
            if cache[key]["src"] == "manual" or (f.exists() and not is_logo(Image.open(f).convert("RGB"))):
                continue
            LOG.append(f"recheck    {key}: saved photo looks like a logo")
            del cache[key]
        candidates = []
        try:
            if key in wiki:
                u = from_wikipedia(wiki[key])
                if u:
                    candidates.append((u, "wikipedia"))
        except Exception as e:
            LOG.append(f"wikipedia failed for {key}: {e}")
        try:
            tags = osm_tags(name, lat, lng)
            u, src = from_osm(tags)
            if u:
                candidates.append((u, src))
            site = tags.get("website") or tags.get("contact:website")
            if site:
                u = from_website(site)
                if u:
                    candidates.append((u, "website"))
        except Exception as e:
            LOG.append(f"osm/website failed for {key}: {e}")
        if not try_save(cache, key, [(u, src, None) for u, src in candidates]):
            try:
                results = from_search(name)
            except Exception as e:
                LOG.append(f"search failed for {key}: {e}")
                results = []
            if not try_save(cache, key, [(u, "search", page) for u, page in results]):
                LOG.append(f"NO PHOTO   {key}")

    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    images = {k: v["file"] for k, v in sorted(cache.items()) if v.get("src") != "none" and v.get("file")}
    OUT_PATH.write_text(
        "// Generated by scripts/images.py. Do not edit by hand.\n"
        f"const IMAGES = {json.dumps(images, ensure_ascii=False, indent=1)};\n", encoding="utf-8")
    LOG.append(f"{len(images)} of {len(items)} places have a photo")
    (ROOT / "data" / "images-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    print("\n".join(LOG))


if __name__ == "__main__":
    main()
