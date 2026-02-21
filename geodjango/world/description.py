import os
from typing import Optional
from openai import OpenAI
from .models import Pin
from .wiki import search_first_pageid, get_extract
_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
DEFAULT_MODEL="gpt-5-mini"
def load_address(name: str, address: Optional[dict]) -> str:
    text=""
    main=""
    if name:
        if 3<=len(name)<=15:
            text+=name
        f=True
    if address:
        f=True
    if not f:
        return ""
    for k in ["attraction", "tourism", "amenity", "historic", "leisure", "building", "railway", "station"]:
        v = address.get(k)
        if v:
            main = str(v).strip()
            break
    return text + main if main else ""
def generate_description_from_wiki(name: str, wiki_title: str, wiki_extract: str, wiki_url: str) -> str:
    max_chars = 100
    instructions = (
        "あなたは旅行アプリ向けの説明文を作る編集者です。"
        "与えられたWikipediaの導入文の内容だけを根拠にして要約してください。"
        "導入文に無い事実は推測で補わないでください。"
        "出力は日本語。"
    )

    input_text = (
        f"場所名（ユーザー入力）: {name or '(なし)'}\n"
        f"Wikipedia記事タイトル: {wiki_title}\n"
        f"Wikipedia導入文:\n{wiki_extract}\n\n"
        f"条件:\n"
        f"- {max_chars}文字以内\n"
        f"- 1〜3文\n"
        f"- 文末に「出典: Wikipedia」も付ける（URLは貼らない）\n"
    )

    resp = _client.responses.create(
        model=DEFAULT_MODEL,
        reasoning={"effort": "low"},
        instructions=instructions,
        input=input_text,
    )
    text = (resp.output_text or "").strip()
    if len(text) > max_chars:
        text = text[: max_chars - 1].rstrip() + "…"
    return text
def save_pin(pin_id: int):
    pin = Pin.objects.get(id=pin_id)
    if pin.description:
        return
    query=load_address(pin.name, pin.address)
    pageid = search_first_pageid(query)
    title, extract, _url = get_extract(pageid)
    text = generate_description_from_wiki(
        name=pin.name,
        wiki_title=title,
        wiki_extract=extract,
        wiki_url=_url,
    )
    return text