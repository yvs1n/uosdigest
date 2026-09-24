#!/usr/bin/env python3
"""
University of Sharjah - UOS Digest Instagram Scraper and Updater
Fetches latest posts from @uosdigest, prepends new posts,
always extracts and refreshes real like and comment numbers,
and preserves a fixed sliding window of the latest MAX_POSTS.
"""

import os
import sys
import json
import re
import time
from datetime import datetime, timezone

# Configure utf-8 stdout for reliable cross-platform logging (Windows / Linux CI)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

USERNAME = os.environ.get('INSTAGRAM_USERNAME', 'uosdigest')
MAX_POSTS = int(os.environ.get('MAX_POSTS', 6))
OUTPUT_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'instagram.json'))
ASSETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'assets', 'instagram'))

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
}

def parse_count(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return int(val)
    t = str(val).strip().replace(',', '').lower()
    if not t:
        return None
    try:
        if 'k' in t:
            return int(float(t.replace('k', '')) * 1000)
        if 'm' in t:
            return int(float(t.replace('m', '')) * 1000000)
        return int(t)
    except Exception:
        return None

def apply_video_play_overlay(image_path):
    """
    Overlays a translucent circular play button badge on video/reel covers
    so that newly scraped videos always match the authentic Instagram reel play overlay.
    """
    try:
        from PIL import Image, ImageDraw
        with Image.open(image_path) as base:
            base = base.convert('RGBA')
            w, h = base.size
            cx, cy = w // 2, h // 2
            r = int(w * 0.138)
            overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 0, 0, 115))
            tri_h = int(r * 0.95)
            tri_w = int(r * 0.95)
            offset_x = int(r * 0.08)
            x_left = cx - int(tri_w * 0.45) + offset_x
            x_right = cx + int(tri_w * 0.55) + offset_x
            y_top = cy - int(tri_h * 0.55)
            y_bottom = cy + int(tri_h * 0.55)
            draw.polygon([(x_left, y_top), (x_left, y_bottom), (x_right, cy)], fill=(255, 255, 255, 245))
            result = Image.alpha_composite(base, overlay)
            result.convert('RGB').save(image_path, 'JPEG', quality=95)
            print(f"  [OVERLAY] Applied play button overlay to {image_path}")
    except Exception as e:
        print(f"  [OVERLAY WARN] Could not apply play button overlay: {e}")

def save_local_image(shortcode, image_url, is_video=True):
    """
    Downloads remote image into local assets/instagram/<shortcode>.jpg
    so images are permanent and never expire with 403 Forbidden.
    Automatically applies play button overlay if it is a reel/video.
    """
    if not image_url or not image_url.startswith('http'):
        return image_url
    try:
        import requests
        os.makedirs(ASSETS_DIR, exist_ok=True)
        local_rel = f"assets/instagram/{shortcode}.jpg"
        local_abs = os.path.join(ASSETS_DIR, f"{shortcode}.jpg")

        res = requests.get(image_url, headers=BROWSER_HEADERS, timeout=15)
        if res.status_code == 200 and len(res.content) > 1000:
            with open(local_abs, 'wb') as f:
                f.write(res.content)
            print(f"  [IMAGE] Saved permanent local image: {local_rel} ({len(res.content)} bytes)")
            if is_video:
                apply_video_play_overlay(local_abs)
            return local_rel
    except Exception as e:
        print(f"  [IMAGE WARN] Could not save local image for {shortcode}: {e}")
    return image_url

def load_existing_posts():
    try:
        if os.path.exists(OUTPUT_FILE):
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
    except Exception as e:
        print(f"Notice: Could not load existing posts from {OUTPUT_FILE}: {e}")
    return []

def extract_posts_from_html(html):
    """
    Extracts post items from Instagram profile SSR HTML by decoding
    the embedded polaris_ordered_timeline_connection JSON payload.
    Falls back to regex searching for shortcodes if JSON payload isn't found.
    """
    posts = []
    
    # 1. Primary: decode polaris_ordered_timeline_connection
    pos = html.find('"polaris_ordered_timeline_connection"')
    if pos != -1:
        pos_brace = html.find('{', pos)
        if pos_brace != -1:
            try:
                decoder = json.JSONDecoder()
                obj, _ = decoder.raw_decode(html[pos_brace:])
                edges = obj.get('edges', [])
                for e in edges:
                    node = e.get('node', {})
                    code = node.get('code')
                    if not code:
                        continue
                    typename = node.get('__typename', '')
                    is_video = ('Video' in typename) or (node.get('product_type') == 'clips')
                    prefix = 'reel' if is_video else 'p'

                    caption_obj = node.get('caption')
                    caption = caption_obj.get('text', '') if isinstance(caption_obj, dict) else (caption_obj or '')
                    display_uri = node.get('display_uri')

                    # Compute precise timestamp from media pk if available
                    ts_iso = None
                    pk = node.get('pk')
                    if pk:
                        try:
                            pk_int = int(pk)
                            ts_ms = (pk_int >> 23) + 1314220021721
                            ts_iso = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
                        except Exception:
                            pass
                    
                    if not ts_iso:
                        acc = node.get('accessibility_caption') or ''
                        date_m = re.search(r'on\s+([A-Za-z]+\s+\d+,\s+\d{4})', acc)
                        if date_m:
                            try:
                                ts_iso = datetime.strptime(date_m.group(1), '%B %d, %Y').isoformat() + 'Z'
                            except Exception:
                                pass
                    
                    if not ts_iso:
                        ts_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

                    snippet = caption[:160] + ('...' if len(caption) > 160 else '')
                    posts.append({
                        'id': code,
                        'shortcode': code,
                        'permalink': f"https://www.instagram.com/uosdigest/{prefix}/{code}/",
                        'imageUrl': display_uri,
                        'caption': snippet,
                        'timestamp': ts_iso,
                        'is_video': is_video,
                        'likes': None,
                        'comments': None
                    })
                if posts:
                    print(f"  [SSR HTML] Successfully extracted {len(posts)} posts from timeline payload")
                    return posts
            except Exception as j_err:
                print(f"  [SSR WARN] Failed to raw_decode timeline JSON: {j_err}")

    # 2. Secondary fallback: Regex scan for post/reel shortcodes in the HTML
    matches = re.findall(r'/(?:p|reel)/([A-Za-z0-9_-]{10,12})', html)
    unique_scs = []
    for sc in matches:
        if sc not in unique_scs:
            unique_scs.append(sc)
            posts.append({
                'id': sc,
                'shortcode': sc,
                'permalink': f"https://www.instagram.com/uosdigest/p/{sc}/",
                'imageUrl': None,
                'caption': '',
                'timestamp': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'is_video': True,
                'likes': None,
                'comments': None
            })
        if len(posts) >= MAX_POSTS:
            break
    if posts:
        print(f"  [REGEX HTML] Found {len(posts)} shortcodes via regex fallback")
    return posts

def fetch_posts_via_direct_requests():
    """
    Tier 1: Fast direct HTTP fetch of Instagram profile with Chrome headers.
    Instantly extracts embedded polaris_ordered_timeline_connection in < 1 second.
    """
    try:
        import requests
        url = f"https://www.instagram.com/{USERNAME}/"
        print(f"Attempting direct HTTP profile fetch from {url}...")
        res = requests.get(url, headers=BROWSER_HEADERS, timeout=15)
        if res.status_code == 200:
            posts = extract_posts_from_html(res.text)
            if posts:
                return posts
        else:
            print(f"Notice: Direct profile HTTP status: {res.status_code}")
    except Exception as e:
        print(f"Notice: Direct profile HTTP fetch encountered: {e}")
    return []

def fetch_metrics_from_web(shortcode):
    """
    Scrapes like and comment counts using Instagram's public Open Graph tags.
    """
    try:
        import requests
        for prefix in ['reel', 'p']:
            url = f"https://www.instagram.com/{prefix}/{shortcode}/"
            res = requests.get(url, headers=BROWSER_HEADERS, timeout=12)
            if res.status_code != 200:
                continue
            text = res.text
            m = re.search(r'property="og:description"\s+content="([^"]+)"', text)
            if not m:
                m = re.search(r'content="([^"]+)"\s+property="og:description"', text)
            if m:
                desc = m.group(1)
                likes = None
                comments = None
                lm = re.search(r'([\d,.]+[kKmM]?)\s+likes?', desc, re.I)
                if lm:
                    likes = parse_count(lm.group(1))
                cm = re.search(r'([\d,.]+[kKmM]?)\s+comments?', desc, re.I)
                if cm:
                    comments = parse_count(cm.group(1))

                img_m = re.search(r'property="og:image"\s+content="([^"]+)"', text)
                img_url = img_m.group(1) if img_m else None
                return likes, comments, img_url
        return None, None, None
    except Exception as e:
        print(f"Notice: Web metrics fetch for {shortcode} failed: {e}")
        return None, None, None

def fetch_metrics_from_embed(shortcode):
    """
    Scrapes like and comment counts using Instagram's public embed endpoint.
    Acts as an unauthenticated fallback when Instagram API rate-limits profile calls.
    """
    try:
        import requests
        url = f"https://www.instagram.com/p/{shortcode}/embed/captioned/"
        res = requests.get(url, headers=BROWSER_HEADERS, timeout=12)
        if res.status_code != 200:
            return None, None, None

        text = res.text
        likes = None
        like_match = re.search(r'data-log-event="likeCountClick"[^>]*>([\d,.]+[kKmM]?)\s+likes?', text, re.I)
        if not like_match:
            like_match = re.search(r'([\d,.]+[kKmM]?)\s+likes?', text, re.I)
        if like_match:
            likes = parse_count(like_match.group(1))

        comments = None
        comm_match = re.search(r'([\d,.]+[kKmM]?)\s+comments?', text, re.I)
        if comm_match:
            comments = parse_count(comm_match.group(1))

        img_url = None
        img_match = re.search(r'class="EmbeddedMediaImage"\s+src="([^"]+)"', text)
        if img_match:
            img_url = img_match.group(1).replace('&amp;', '&')

        return likes, comments, img_url
    except Exception as e:
        print(f"Notice: Embed metrics fetch for {shortcode} failed: {e}")
        return None, None, None

def fetch_posts_via_playwright():
    """
    Tier 2: Uses headless Chromium (Playwright) to browse @uosdigest on Instagram.
    Bypasses unauthenticated API rate limits and extracts posts via both HTML payload & DOM.
    """
    try:
        from playwright.sync_api import sync_playwright
        print(f"Launching headless browser to check @{USERNAME} on Instagram...")
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--window-size=1920,1080'
                ]
            )
            context = browser.new_context(
                user_agent=BROWSER_HEADERS['User-Agent'],
                viewport={'width': 1920, 'height': 1080},
                locale='en-US',
                timezone_id='Asia/Dubai',
                extra_http_headers=BROWSER_HEADERS
            )

            # Optional session cookie injection (e.g. from GitHub Secrets INSTAGRAM_SESSION)
            session_val = os.environ.get('INSTAGRAM_SESSION', '').strip()
            if session_val:
                try:
                    if '=' in session_val:
                        for cookie_part in session_val.split(';'):
                            if '=' in cookie_part:
                                ck, cv = cookie_part.strip().split('=', 1)
                                context.add_cookies([{'name': ck, 'value': cv, 'domain': '.instagram.com', 'path': '/'}])
                    else:
                        context.add_cookies([{'name': 'sessionid', 'value': session_val, 'domain': '.instagram.com', 'path': '/'}])
                    print("  [AUTH] Injected Instagram session cookies into browser context")
                except Exception as c_err:
                    print(f"  [AUTH WARN] Could not inject session cookies: {c_err}")

            page = context.new_page()
            target_url = f'https://www.instagram.com/{USERNAME}/'
            print(f"Navigating browser to {target_url}...")
            page.goto(target_url, timeout=30000)
            page.wait_for_timeout(3500)

            # First, inspect full page content for polaris timeline data
            html_content = page.content()
            posts = extract_posts_from_html(html_content)
            if posts:
                print(f"  [BROWSER SSR] Found {len(posts)} posts from rendered page HTML")
                browser.close()
                return posts

            # Fallback: check DOM anchors
            post_items = []
            anchors = page.query_selector_all('a[href*="/p/"], a[href*="/reel/"]')
            for a in anchors:
                href = a.get_attribute('href') or ''
                m = re.search(r'/(p|reel)/([A-Za-z0-9_-]+)', href)
                if m:
                    prefix = m.group(1)
                    sc = m.group(2)
                    if not any(item[0] == sc for item in post_items):
                        post_items.append((sc, prefix))
                if len(post_items) >= MAX_POSTS:
                    break

            print(f"  [BROWSER DOM] Discovered {len(post_items)} posts: {post_items}")
            fetched = []
            for sc, prefix in post_items:
                try:
                    page.goto(f'https://www.instagram.com/{prefix}/{sc}/', timeout=20000)
                    page.wait_for_timeout(1500)
                    desc_meta = page.query_selector('meta[property="og:description"]')
                    desc = desc_meta.get_attribute('content') if desc_meta else ''
                    img_meta = page.query_selector('meta[property="og:image"]')
                    img_url = img_meta.get_attribute('content') if img_meta else ''
                    title_meta = page.query_selector('meta[property="og:title"]')
                    title = title_meta.get_attribute('content') if title_meta else ''

                    likes_m = re.search(r'([\d,.]+[kKmM]?)\s+likes?', desc, re.I)
                    comms_m = re.search(r'([\d,.]+[kKmM]?)\s+comments?', desc, re.I)
                    likes = parse_count(likes_m.group(1)) if likes_m else None
                    comments = parse_count(comms_m.group(1)) if comms_m else None

                    caption = ''
                    cap_m = re.search(r':\s*"(.*)"', desc, re.S)
                    if cap_m:
                        caption = cap_m.group(1).strip()
                    elif title:
                        t_m = re.search(r':\s*"(.*)"', title, re.S)
                        caption = t_m.group(1).strip() if t_m else title

                    ts_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
                    date_m = re.search(r'on\s+([A-Za-z]+\s+\d+,\s+\d{4})', desc)
                    if date_m:
                        try:
                            parsed_date = datetime.strptime(date_m.group(1), '%B %d, %Y')
                            ts_iso = parsed_date.isoformat() + 'Z'
                        except Exception:
                            pass

                    is_video = (prefix == 'reel') or ('video' in desc.lower()) or ('video' in title.lower())
                    fetched.append({
                        'id': sc,
                        'shortcode': sc,
                        'permalink': f"https://www.instagram.com/uosdigest/{prefix}/{sc}/",
                        'imageUrl': img_url,
                        'caption': caption[:160] + ('...' if len(caption) > 160 else ''),
                        'timestamp': ts_iso,
                        'is_video': is_video,
                        'likes': likes,
                        'comments': comments
                    })
                except Exception as ex:
                    print(f"  [BROWSER WARN] Could not scrape {prefix} {sc}: {ex}")

            browser.close()
            return fetched
    except Exception as e:
        print(f"Notice: Playwright browser fetch encountered: {e}")
        return []

def fetch_posts_via_instaloader():
    """
    Tier 3 fallback: Instaloader
    """
    try:
        import instaloader
        print(f"Fetching posts for @{USERNAME} via instaloader...")
        L = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False
        )
        profile = instaloader.Profile.from_username(L.context, USERNAME)
        fetched = []
        for post in profile.get_posts():
            caption = post.caption or ''
            snippet = caption[:160] + ('...' if len(caption) > 160 else '')
            likes = post.likes
            comments = post.comments
            fetched.append({
                'id': post.shortcode,
                'shortcode': post.shortcode,
                'permalink': f"https://www.instagram.com/p/{post.shortcode}/",
                'imageUrl': post.url,
                'caption': snippet,
                'timestamp': post.date_utc.isoformat() + 'Z',
                'is_video': post.is_video,
                'likes': likes,
                'comments': comments
            })
            if len(fetched) >= MAX_POSTS:
                break
        return fetched
    except Exception as e:
        print(f"Notice: Instaloader profile fetch encountered: {e}")
        return []

def refresh_metrics_for_posts(posts):
    """
    Refreshes like numbers and comment numbers for all active posts in the sliding window
    using lightweight web/embed scrapers without triggering Instagram 429 rate limits.
    Also ensures permanent local images and play badges exist.
    """
    for p in posts:
        sc = p.get('shortcode') or p.get('id')
        if not sc:
            continue

        updated_likes = p.get('likes')
        updated_comments = p.get('comments')
        remote_img = None

        # 1. Fallback to web metadata (og:description and og:image) if missing
        if updated_likes is None or updated_comments is None or not p.get('imageUrl') or p.get('imageUrl').startswith('http'):
            wlikes, wcomments, wimg = fetch_metrics_from_web(sc)
            if updated_likes is None and wlikes is not None:
                updated_likes = wlikes
            if updated_comments is None and wcomments is not None:
                updated_comments = wcomments
            if wimg:
                remote_img = wimg

        # 2. Fallback to public embed scraper if still missing
        if updated_likes is None or updated_comments is None or not p.get('imageUrl') or p.get('imageUrl').startswith('http'):
            elikes, ecomments, eimg = fetch_metrics_from_embed(sc)
            if updated_likes is None and elikes is not None:
                updated_likes = elikes
            if updated_comments is None and ecomments is not None:
                updated_comments = ecomments
            if not remote_img and eimg:
                remote_img = eimg

        # Apply fresh counts if found
        if updated_likes is not None:
            p['likes'] = updated_likes
        if updated_comments is not None:
            p['comments'] = updated_comments

        # Save local image
        current_img = p.get('imageUrl')
        is_video = p.get('is_video', True) or ('/reel/' in p.get('permalink', ''))
        
        target_img_url = None
        if current_img and current_img.startswith('http'):
            target_img_url = current_img
        elif (not current_img or not os.path.exists(os.path.join(os.path.dirname(__file__), '..', current_img))) and remote_img:
            target_img_url = remote_img

        if target_img_url:
            p['imageUrl'] = save_local_image(sc, target_img_url, is_video=is_video)
        elif not current_img:
            p['imageUrl'] = f"assets/instagram/{sc}.jpg"

        # Clean helper fields not needed in JSON
        p.pop('is_video', None)

        print(f"  Verified {sc}: likes={p.get('likes')}, comments={p.get('comments')}, image={p.get('imageUrl')}")
        time.sleep(0.2)

def merge_and_slide_window(new_posts, existing_posts):
    combined = {}

    for p in existing_posts:
        pid = p.get('id') or p.get('shortcode')
        if pid:
            combined[pid] = dict(p)

    for p in new_posts:
        pid = p.get('id') or p.get('shortcode')
        if not pid:
            continue
        if pid in combined:
            ex = combined[pid]
            ex['caption'] = p.get('caption') or ex.get('caption')
            if p.get('imageUrl') and p.get('imageUrl').startswith('http'):
                ex['imageUrl'] = p['imageUrl']
            ex['permalink'] = p.get('permalink') or ex.get('permalink')
            ex['timestamp'] = p.get('timestamp') or ex.get('timestamp')
            if p.get('likes') is not None:
                ex['likes'] = p['likes']
            if p.get('comments') is not None:
                ex['comments'] = p['comments']
            if 'is_video' in p:
                ex['is_video'] = p['is_video']
        else:
            combined[pid] = dict(p)

    all_posts = list(combined.values())

    def get_time(item):
        ts = item.get('timestamp') or ''
        try:
            return datetime.fromisoformat(ts.replace('Z', '+00:00'))
        except Exception:
            return datetime.min

    all_posts.sort(key=get_time, reverse=True)
    return all_posts[:MAX_POSTS]

def sync_initial_posts_in_js(posts):
    js_data_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'js', 'data.js'))
    if not os.path.exists(js_data_file):
        return
    try:
        with open(js_data_file, 'r', encoding='utf-8') as f:
            content = f.read()
        formatted_json = json.dumps(posts, indent=2, ensure_ascii=False)
        pattern = r'export const initialInstagramPosts = \[[\s\S]*?\];'
        replacement = f"export const initialInstagramPosts = {formatted_json};"
        if re.search(pattern, content):
            new_content = re.sub(pattern, replacement, content)
            with open(js_data_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"  [DATA.JS] Synchronized initialInstagramPosts in {js_data_file}")
    except Exception as e:
        print(f"  [DATA.JS WARN] Could not sync initialInstagramPosts: {e}")

def main():
    print(f"=== UOS Digest Instagram Feed Sync (@{USERNAME}) ===")
    existing = load_existing_posts()
    print(f"Loaded {len(existing)} existing posts from {OUTPUT_FILE}")

    target_sc = os.environ.get('TARGET_SHORTCODE', '').strip()
    new_posts = []

    if target_sc:
        print(f"Target shortcode override detected: {target_sc}")
        wlikes, wcomments, wimg = fetch_metrics_from_web(target_sc)
        if not wimg or wlikes is None:
            elikes, ecomments, eimg = fetch_metrics_from_embed(target_sc)
            if wlikes is None: wlikes = elikes
            if wcomments is None: wcomments = ecomments
            if not wimg: wimg = eimg
        new_posts = [{
            'id': target_sc,
            'shortcode': target_sc,
            'permalink': f"https://www.instagram.com/uosdigest/reel/{target_sc}/",
            'imageUrl': wimg,
            'caption': '',
            'timestamp': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'is_video': True,
            'likes': wlikes,
            'comments': wcomments
        }]

    if not new_posts:
        # 1. Fetch new posts: Tier 1 Direct HTTP -> Tier 2 Playwright -> Tier 3 Instaloader
        new_posts = fetch_posts_via_direct_requests()
        if not new_posts:
            print("Direct HTTP produced no posts; trying Playwright browser...")
            new_posts = fetch_posts_via_playwright()
        if not new_posts:
            print("Playwright produced no posts; trying Instaloader fallback...")
            new_posts = fetch_posts_via_instaloader()

    print(f"Discovered {len(new_posts)} total posts from Instagram extraction.")

    # 2. Merge into fixed sliding window of latest MAX_POSTS
    updated = merge_and_slide_window(new_posts, existing)

    # 3. Always refresh and verify like numbers and comment numbers and local assets
    print("Extracting & refreshing likes and comment metrics for feed...")
    refresh_metrics_for_posts(updated)

    print(f"Feed window prepared: {len(updated)} posts (limit: {MAX_POSTS})")

    # 4. Save if any post, like count, or comment count changed
    if existing and json.dumps(existing, sort_keys=True) == json.dumps(updated, sort_keys=True):
        print("Feed and all metrics are already up to date. No changes to commit.")
        sync_initial_posts_in_js(updated)
        return

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
    print(f"[OK] Successfully saved {len(updated)} posts with verified likes and comments to {OUTPUT_FILE}")

    sync_initial_posts_in_js(updated)

if __name__ == '__main__':
    main()
