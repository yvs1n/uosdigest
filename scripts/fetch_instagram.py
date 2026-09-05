#!/usr/bin/env python3
"""
University of Sharjah - UOS Digest Instagram Scraper and Updater
Fetches latest posts from @uosdigest, prepends new posts,
and preserves a fixed sliding window of the latest MAX_POSTS.
"""

import os
import json
import re
from datetime import datetime

USERNAME = os.environ.get('INSTAGRAM_USERNAME', 'uosdigest')
MAX_POSTS = int(os.environ.get('MAX_POSTS', 6))
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'instagram.json')

def load_existing_posts():
    try:
        if os.path.exists(OUTPUT_FILE):
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
    except Exception as e:
        print(f"Notice: Could not load existing posts: {e}")
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
            fetched.append({
                'id': post.shortcode,
                'shortcode': post.shortcode,
                'permalink': f"https://www.instagram.com/p/{post.shortcode}/",
                'imageUrl': post.url,
                'caption': snippet,
                'timestamp': post.date_utc.isoformat() + 'Z',
                'likes': post.likes,
                'comments': post.comments
            })
            if len(fetched) >= MAX_POSTS:
                break
        return fetched
    except Exception as e:
        print(f"Warning: instaloader fetch encountered: {e}")
        return []

def fetch_posts_via_public_web():
    try:
        import requests
        url = f"https://www.instagram.com/{USERNAME}/"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            print("Public profile response received.")
    except Exception as e:
        print(f"Public web notice: {e}")
    return []

def merge_and_slide_window(new_posts, existing_posts):
    combined = {}
    for p in new_posts:
        pid = p.get('id') or p.get('shortcode') or p.get('permalink')
        if pid:
            combined[pid] = p
    for p in existing_posts:
        pid = p.get('id') or p.get('shortcode') or p.get('permalink')
        if pid and pid not in combined:
            combined[pid] = p
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
    new_posts = fetch_posts_via_instaloader()
    if not new_posts:
        new_posts = fetch_posts_via_public_web()
    if not new_posts:
        print("No new posts fetched (or rate-limited). Preserving existing feed.")
        return
    updated = merge_and_slide_window(new_posts, existing)
    print(f"Updated feed prepared: {len(updated)} posts (sliding window limit: {MAX_POSTS})")
    if existing and [p.get('id') for p in existing] == [p.get('id') for p in updated]:
        print("Feed is already up to date. No file changes needed.")
        return
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
    print(f"✓ Successfully updated {OUTPUT_FILE} with {len(updated)} latest posts.")

if __name__ == '__main__':
    main()
