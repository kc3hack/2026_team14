# world/wiki.py
from __future__ import annotations
from typing import Optional, Tuple
import requests

WIKI_API_JA = "https://ja.wikipedia.org/w/api.php"
HEADERS = {
    # できれば連絡先も入れる（403回避に有利）
    "User-Agent": "travel_app_test/0.1 (contact: your-email@example.com)"
}

def search_first_pageid(query: str) -> Optional[int]:
    query = (query or "").strip()
    if not query:
        return None
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": 1,
        "format": "json",
    }
    r = requests.get(WIKI_API_JA, params=params, headers=HEADERS, timeout=10)  # ★ここ
    # 403などでも落とさず None にする方が開発が楽
    if r.status_code != 200:
        return None
    hits = r.json().get("query", {}).get("search", [])
    if not hits:
        return None
    return hits[0].get("pageid")

def get_extract(pageid: int) -> Tuple[str, str, str]:
    params = {
        "action": "query",
        "prop": "extracts",
        "exintro": 1,
        "explaintext": 1,
        "pageids": pageid,
        "format": "json",
    }
    r = requests.get(WIKI_API_JA, params=params, headers=HEADERS, timeout=10)  # ★ここ
    if r.status_code != 200:
        return "", "", ""
    pages = r.json().get("query", {}).get("pages", {})
    page = pages.get(str(pageid), {})
    title = page.get("title", "") or ""
    extract = page.get("extract", "") or ""
    url = f"https://ja.wikipedia.org/?curid={pageid}"
    return title, extract, url
