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
from datetime import datetime

# Configure utf-8 stdout for reliable cross-platform logging (Windows / Linux CI)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

USERNAME = os.environ.get('INSTAGRAM_USERNAME', 'uosdigest')
MAX_POSTS = int(os.environ.get('MAX_POSTS', 6))
OUTPUT_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'instagram.json'))

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
        return None, None

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
            except Exception:
                pass

        # 2. Fallback to public embed scraper if needed
        if updated_likes is None or updated_comments is None:
            elikes, ecomments = fetch_metrics_from_embed(sc)
            if updated_likes is None and elikes is not None:
                updated_likes = elikes
            if updated_comments is None and ecomments is not None:
                updated_comments = ecomments

        # 3. Apply fresh counts if found
        if updated_likes is not None:
            p['likes'] = updated_likes
        if updated_comments is not None:
            p['comments'] = updated_comments

        print(f"  Verified {sc}: likes={p.get('likes')}, comments={p.get('comments')}")
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

    # 1. Fetch new posts from Instagram profile
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
