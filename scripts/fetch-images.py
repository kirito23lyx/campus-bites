"""Find and download Wikimedia Commons photos with attribution metadata."""
import concurrent.futures
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUERIES = {
    'chicken-rice': 'chicken leg rice',
    'kung-pao': 'Kung Pao chicken',
    'tomato-rice': 'stir fried tomato scrambled eggs',
    'fish-pork': 'Yuxiang shredded pork',
    'braised-pork': 'Hongshao rou',
    'black-pepper-beef': 'black pepper beef',
    'mapo-tofu': 'Mapo tofu',
    'curry-chicken': 'chicken curry rice',
    'fried-rice': 'Yangzhou fried rice',
    'beef-noodles-flat': 'beef chow fun',
    'beef-noodles': 'Lanzhou beef noodles',
    'chongqing-noodles': 'Chongqing noodles',
    'tomato-noodles': 'tomato egg noodles',
    'dumplings': 'pork cabbage jiaozi',
    'salad': 'chicken salad',
    'shrimp-dumplings': 'har gow',
    'siu-mai': 'siu mai',
    'char-siu-buns': 'char siu bao',
    'chicken-feet': 'dim sum chicken feet',
    'spare-ribs': 'dim sum spare ribs',
    'sticky-rice': 'lo mai gai',
    'rice-rolls': 'shrimp cheung fun',
    'custard-buns': 'liu sha bao',
    'turnip-cakes': 'turnip cake',
    'egg-tarts': 'Hong Kong egg tart',
}

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'CampusBites/1.0 (educational food demo; Wikimedia attribution retained)'})
    for attempt in range(3):
        try:
            return urllib.request.urlopen(req, timeout=25).read()
        except urllib.error.HTTPError as error:
            if attempt == 2:
                raise
            delay = int(error.headers.get('Retry-After', '15')) if error.code == 429 else attempt + 2
            time.sleep(min(delay, 45))
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)

def plain(value):
    return html.unescape(re.sub('<[^>]+>', '', value or '')).strip()

def search(pair):
    key, query = pair
    params = {'action': 'query', 'generator': 'search', 'gsrsearch': query + ' filetype:bitmap', 'gsrnamespace': 6, 'gsrlimit': 6, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 800, 'format': 'json'}
    data = json.loads(get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))
    candidates = []
    for page in sorted(data.get('query', {}).get('pages', {}).values(), key=lambda x: x.get('index', 0)):
        info = page.get('imageinfo', [{}])[0]
        meta = info.get('extmetadata', {})
        license_name = meta.get('LicenseShortName', {}).get('value', '')
        if not any(tag in license_name.lower() for tag in ['cc by', 'cc0', 'public domain']):
            continue
        candidates.append({'title': page['title'], 'url': info.get('thumburl', info.get('url', '')), 'originalUrl': info.get('url', ''), 'source': info.get('descriptionurl', ''), 'author': plain(meta.get('Artist', {}).get('value', 'Wikimedia Commons contributor')), 'license': license_name, 'licenseUrl': meta.get('LicenseUrl', {}).get('value', ''), 'description': plain(meta.get('ImageDescription', {}).get('value', ''))[:1500]})
    return key, candidates

def search_all():
    (ROOT / 'artifacts').mkdir(exist_ok=True)
    output = ROOT / 'artifacts/image-candidates.json'
    results = json.loads(output.read_text(encoding='utf-8')) if output.exists() else {}
    for pair in QUERIES.items():
        if results.get(pair[0]):
            continue
        try:
            key, candidates = search(pair)
            results[key] = candidates
            output.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
            print(key + ': ' + ' | '.join(f'{i}: {c["title"]}' for i, c in enumerate(candidates[:5])), flush=True)
        except Exception as error:
            print(pair[0] + ': ' + str(error), flush=True)
        time.sleep(1)

def download_all():
    candidates = json.loads((ROOT / 'artifacts/image-candidates.json').read_text(encoding='utf-8'))
    selections = json.loads((ROOT / 'scripts/image-selections.json').read_text(encoding='utf-8'))
    destination = ROOT / 'assets/food'
    destination.mkdir(parents=True, exist_ok=True)
    def download(pair):
        key, index = pair
        selected = candidates[key][index].copy()
        path = destination / (key + '.jpg')
        content = path.read_bytes() if path.exists() and path.stat().st_size else get(selected['url'])
        # Keep the licensed photo unmodified; CSS only adjusts its displayed crop.
        path.write_bytes(content)
        selected['path'] = './assets/food/' + path.name
        selected['dishId'] = key
        print(f'{key}: {len(content)} bytes / {selected["license"]}', flush=True)
        return key, selected
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        credits = dict(pool.map(download, selections.items()))
    (ROOT / 'image-credits.json').write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / 'photos.js').write_text('export const photos = ' + json.dumps(credits, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')

if __name__ == '__main__':
    if '--query' in sys.argv:
        key, query = sys.argv[2:4]
        output = ROOT / 'artifacts/image-candidates.json'
        results = json.loads(output.read_text(encoding='utf-8'))
        _, results[key] = search((key, query))
        output.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
        print(key + ': ' + ' | '.join(f'{i}: {c["title"]}' for i, c in enumerate(results[key])), flush=True)
    else:
        download_all() if '--download' in sys.argv else search_all()
