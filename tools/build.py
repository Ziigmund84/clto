#!/usr/bin/env python3
"""Assemble les pages publiques du site.

Chaque fichier de src/pages/ commence par un commentaire JSON :
<!--{"title": "...", "description": "...", "scripts": ["pages/home.js"], "libs": ["leaflet"], "header": "dark"}-->
suivi du contenu de <main>. Le script écrit la page complète à la racine du dépôt.
Usage : python3 tools/build.py
"""
import json
import pathlib
import re
import hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "pages"
MEDIA = "https://kdcflcvufukagdjycwww.supabase.co/storage/v1/object/public/clto-media/import/"

LIBS = {
    "leaflet": (
        '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">',
        '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>',
    ),
}

TEMPLATE = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#0a2457">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{media}logo-android-chrome-512x512.webp">
<meta property="og:type" content="website">
<link rel="icon" type="image/webp" href="{media}logo-favicon-32x32.webp">
<link rel="apple-touch-icon" href="{media}logo-apple-touch-icon.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://kdcflcvufukagdjycwww.supabase.co" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Barlow+Condensed:ital,wght@1,600;1,700;1,800&family=Big+Shoulders+Display:wght@700;800;900&display=swap" rel="stylesheet">
{lib_css}<link rel="stylesheet" href="assets/css/site.css?v={v_css}">
</head>
<body{body_attrs}>
<main id="main">
{content}
</main>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/MotionPathPlugin.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
{lib_js}<script src="assets/js/config.js?v={v_cfg}"></script>
<script src="assets/js/core.js?v={v_core}"></script>
{scripts}</body>
</html>
"""


def ver(rel):
    """Empreinte du fichier, ajoutée en ?v= pour que les navigateurs rechargent les nouvelles versions."""
    return hashlib.md5((ROOT / rel).read_bytes()).hexdigest()[:8]


def build():
    count = 0
    for src in sorted(SRC.glob("*.html")):
        raw = src.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--(\{.*?\})-->\s*", raw, re.S)
        meta = json.loads(m.group(1)) if m else {}
        content = raw[m.end():] if m else raw
        libs = meta.get("libs", [])
        body_attrs = ""
        if meta.get("header") == "light":
            body_attrs = ' data-header="light"'
        page = TEMPLATE.format(
            title=meta.get("title", "CLTO Badminton Orléans"),
            description=meta.get("description", "Club de badminton à Orléans, ouvert à tous."),
            media=MEDIA,
            lib_css="".join(LIBS[l][0] + "\n" for l in libs),
            lib_js="".join(LIBS[l][1] + "\n" for l in libs),
            body_attrs=body_attrs,
            content=content.strip(),
            scripts="".join(f'<script src="assets/js/{s}?v={ver("assets/js/" + s)}"></script>\n' for s in meta.get("scripts", [])),
            v_css=ver("assets/css/site.css"), v_cfg=ver("assets/js/config.js"), v_core=ver("assets/js/core.js"),
        )
        (ROOT / src.name).write_text(page, encoding="utf-8")
        count += 1
    print(f"{count} pages générées")


if __name__ == "__main__":
    build()
