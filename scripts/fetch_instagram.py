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

def save_local_image(shortcode, image_url):
    """
    Downloads remote image into local assets/instagram/<shortcode>.jpg
    so images are permanent and never expire with 403 Forbidden.
    """
    if not image_url or not image_url.startswith('http'):
        return image_url
    try:
        import requests
        os.makedirs(ASSETS_DIR, exist_ok=True)
        local_rel = f"assets/instagram/{shortcode}.jpg"
        local_abs = os.path.join(ASSETS_DIR, f"{shortcode}.jpg")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        res = requests.get(image_url, headers=headers, timeout=15)
        if res.status_code == 200 and len(res.content) > 1000:
            with open(local_abs, 'wb') as f:
                f.write(res.content)
            print(f"  [IMAGE] Saved permanent local image: {local_rel} ({len(res.content)} bytes)")
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

def fetch_metrics_from_web(shortcode):
    """
    Scrapes like and comment counts using Instagram's public Open Graph tags.
    """
    try:
        import requests
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        }
        for prefix in ['reel', 'p']:
            url = f"https://www.instagram.com/{prefix}/{shortcode}/"
            res = requests.get(url, headers=headers, timeout=12)
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
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        }
        res = requests.get(url, headers=headers, timeout=12)
        if res.status_code != 200:
            return None, None
        
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

        return likes, comments
    except Exception as e:
        print(f"Notice: Embed metrics fetch for {shortcode} failed: {e}")
def fetch_posts_via_playwright():
    """
    Uses headless Chromium (Playwright) to browse @uosdigest on Instagram.
    Bypasses unauthenticated API rate limits and accurately extracts top post shortcodes,
    direct media URLs, captions, and real-time like/comment counts.
    """
    try:
        from playwright.sync_api import sync_playwright
        print(f"Launching headless browser to check @{USERNAME} on Instagram...")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1280, 'height': 800}
            )
            page = context.new_page()
            page.goto(f'https://www.instagram.com/{USERNAME}/', timeout=30000)
            page.wait_for_timeout(3500)
            
            anchors = page.query_selector_all('a[href*="/p/"], a[href*="/reel/"]')
            shortcodes = []
            for a in anchors:
                href = a.get_attribute('href') or ''
                m = re.search(r'/(?:p|reel)/([A-Za-z0-9_-]+)', href)
                if m:
                    sc = m.group(1)
                    if sc not in shortcodes:
                        shortcodes.append(sc)
                if len(shortcodes) >= MAX_POSTS:
                    break
            
            print(f"  [BROWSER] Discovered top {len(shortcodes)} shortcodes: {shortcodes}")
            if not shortcodes:
                browser.close()
                return []
            
            fetched = []
            for sc in shortcodes:
                try:
                    page.goto(f'https://www.instagram.com/reel/{sc}/', timeout=20000)
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
                    
                    local_img = save_local_image(sc, img_url) if img_url else f"assets/instagram/{sc}.jpg"
                    
                    fetched.append({
                        'id': sc,
                        'shortcode': sc,
                        'permalink': f"https://www.instagram.com/uosdigest/reel/{sc}/",
                        'imageUrl': local_img,
                        'caption': caption[:160] + ('...' if len(caption) > 160 else ''),
                        'timestamp': ts_iso,
                        'likes': likes,
                        'comments': comments
                    })
                    print(f"  [BROWSER POST] {sc}: {likes} likes, {comments} comments -> {local_img}")
                except Exception as ex:
                    print(f"  [BROWSER WARN] Could not scrape reel {sc}: {ex}")
            
            browser.close()
            return fetched
    except Exception as e:
        print(f"Notice: Playwright browser fetch encountered: {e}")
        return []

def fetch_posts_via_instaloader():
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

        session_data = os.environ.get('INSTAGRAM_SESSION')
        if session_data:
            try:
                L.load_session_from_file(USERNAME)
            except Exception:
                pass

        profile = instaloader.Profile.from_username(L.context, USERNAME)
        fetched = []
        for post in profile.get_posts():
            caption = post.caption or ''
            snippet = caption[:160] + ('...' if len(caption) > 160 else '')
            likes = post.likes
            comments = post.comments
            print(f"  Found post {post.shortcode}: {likes} likes, {comments} comments")
            fetched.append({
                'id': post.shortcode,
                'shortcode': post.shortcode,
                'permalink': f"https://www.instagram.com/p/{post.shortcode}/",
                'imageUrl': post.url,
                'caption': snippet,
                'timestamp': post.date_utc.isoformat() + 'Z',
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
    Refreshes like numbers and comment numbers for all active posts in the sliding window.
    """
    try:
        import instaloader
        L = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False
        )
    except Exception:
        L = None

    for p in posts:
        sc = p.get('shortcode') or p.get('id')
        if not sc:
            continue

        updated_likes = None
        updated_comments = None

        # 1. Try Instaloader Post object directly
        if L:
            try:
                inst_post = instaloader.Post.from_shortcode(L.context, sc)
                if inst_post.likes is not None:
                    updated_likes = inst_post.likes
                if inst_post.comments is not None:
                    updated_comments = inst_post.comments
                if inst_post.url:
                    p['imageUrl'] = save_local_image(sc, inst_post.url)
            except Exception:
                pass

        # 2. Fallback to web metadata (og:description and og:image)
        if updated_likes is None or updated_comments is None:
            wlikes, wcomments, wimg = fetch_metrics_from_web(sc)
            if updated_likes is None and wlikes is not None:
                updated_likes = wlikes
            if updated_comments is None and wcomments is not None:
                updated_comments = wcomments
            if wimg and (not p.get('imageUrl') or p.get('imageUrl').startswith('http')):
                p['imageUrl'] = save_local_image(sc, wimg)

        # 3. Fallback to public embed scraper if needed
        if updated_likes is None or updated_comments is None:
            elikes, ecomments = fetch_metrics_from_embed(sc)
            if updated_likes is None and elikes is not None:
                updated_likes = elikes
            if updated_comments is None and ecomments is not None:
                updated_comments = ecomments

        # Ensure image is saved locally
        img_url = p.get('imageUrl')
        if img_url and img_url.startswith('http'):
            p['imageUrl'] = save_local_image(sc, img_url)

        # Apply fresh counts if found
        if updated_likes is not None:
            p['likes'] = updated_likes
        if updated_comments is not None:
            p['comments'] = updated_comments

        print(f"  Verified {sc}: likes={p.get('likes')}, comments={p.get('comments')}, image={p.get('imageUrl')}")
        time.sleep(0.3)

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
        if p.get('imageUrl') and p.get('imageUrl').startswith('http'):
            p['imageUrl'] = save_local_image(pid, p['imageUrl'])
        if pid in combined:
            ex = combined[pid]
            ex['caption'] = p.get('caption') or ex.get('caption')
            ex['imageUrl'] = p.get('imageUrl') or ex.get('imageUrl')
            ex['permalink'] = p.get('permalink') or ex.get('permalink')
            ex['timestamp'] = p.get('timestamp') or ex.get('timestamp')
            if p.get('likes') is not None:
                ex['likes'] = p['likes']
            if p.get('comments') is not None:
                ex['comments'] = p['comments']
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

def main():
    print(f"=== UOS Digest Instagram Feed Sync (@{USERNAME}) ===")
    existing = load_existing_posts()
    print(f"Loaded {len(existing)} existing posts from {OUTPUT_FILE}")

    # 1. Fetch new posts: Try Playwright browser first (bypasses 401 unauthenticated rate limits)
    new_posts = fetch_posts_via_playwright()
    if not new_posts:
        print("Playwright produced no posts; falling back to Instaloader...")
        new_posts = fetch_posts_via_instaloader()

    # 2. Merge into fixed sliding window of latest MAX_POSTS
    updated = merge_and_slide_window(new_posts, existing)

    # 3. Always refresh and verify like numbers and comment numbers
    print("Extracting & refreshing likes and comment metrics for feed...")
    refresh_metrics_for_posts(updated)

    print(f"Feed window prepared: {len(updated)} posts (limit: {MAX_POSTS})")

    # 4. Save if any post, like count, or comment count changed
    if existing and json.dumps(existing, sort_keys=True) == json.dumps(updated, sort_keys=True):
        print("Feed and all metrics are already up to date. No changes to commit.")
        return

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
    print(f"[OK] Successfully saved {len(updated)} posts with verified likes and comments to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
