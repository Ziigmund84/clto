#!/usr/bin/env python3
"""Génère les masques « coup de pinceau » du diaporama (PNG, la transparence porte la forme).
Un aplat central, des extrémités effilochées en traînées horizontales, quelques stries
de pinceau sec et des éclaboussures. Usage : python3 tools/brush_masks.py"""
import math, random, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "img"
S = 3  # suréchantillonnage

def brush(seed, W=800, H=1000, top=0.09, bot=0.91, core=(0.17, 0.83), skew=0.05, splat=60):
    r = random.Random(seed)
    w, h = W * S, H * S
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    T, B = h * top, h * bot
    slope = lambda x: -skew * h * (x / w - 0.5)   # le trait monte légèrement vers la droite
    # 1. passages de pinceau horizontaux qui se chevauchent : matière pleine au centre,
    #    extrémités effilées et de longueurs variées (bords gauche et droit effilochés)
    y = T - h * 0.01
    rl = rr = 0.08
    while y < B + h * 0.01:
        th = r.uniform(0.012, 0.03) * h
        rl = 0.6 * rl + 0.4 * r.uniform(0.0, 0.16)          # longueur corrélée d'une ligne à l'autre
        rr = 0.6 * rr + 0.4 * r.uniform(0.0, 0.16)
        if r.random() < 0.12: rl += r.uniform(0.04, 0.09)
        if r.random() < 0.12: rr += r.uniform(0.04, 0.09)
        edge_t = min(1, (y - (T - h * 0.01)) / (h * 0.05), ((B + h * 0.01) - y) / (h * 0.05))
        shrink = 0.35 * (1 - edge_t) * r.random()           # bords haut et bas : traits plus courts
        x0 = w * (core[0] - rl + shrink)
        x1 = w * (core[1] + rr - shrink * 0.8)
        n = 60
        top_e, bot_e = [], []
        for s_ in range(n + 1):
            u = s_ / n
            x = x0 + (x1 - x0) * u
            end = min(u / 0.22, (1 - u) / 0.22, 1)
            half = th / 2 * (end ** 0.6) + 0.3 * S
            yy = y + slope(x) + math.sin(u * 6 + y * 0.01) * th * 0.15
            top_e.append((x, yy - half)); bot_e.append((x, yy + half))
        d.polygon(top_e + bot_e[::-1], fill=255)
        y += th * r.uniform(0.35, 0.6)
    # 2. quelques fines traînées détachées, très longues
    for _ in range(16):
        side = r.choice((-1, 1))
        yy = r.uniform(T, B)
        x0 = w * (core[0] - 0.12 if side < 0 else core[1] + 0.12) + side * w * r.uniform(0.0, 0.05)
        x1 = x0 + side * w * r.uniform(0.04, 0.1)
        d.line([(x0, yy + slope(x0)), (x1, yy + slope(x1))], fill=255, width=max(1, int(r.uniform(1, 2.5) * S)))
    a = np.asarray(img).astype(np.float32) / 255
    # 4. stries de pinceau sec, discrètes, dans la matière
    rng = np.random.default_rng(seed)
    rows = np.zeros(h)
    for _ in range(18):
        c = rng.integers(int(T), int(B)); rows[c:c + rng.integers(1, 3) * S] = rng.uniform(0.15, 0.4)
    lenmask = np.clip(np.convolve(rng.random(w), np.ones(90 * S) / (90 * S), mode="same") * 3 - 1.2, 0, 1)
    a = a * (1 - rows[:, None] * lenmask[None, :])
    a = a * (0.94 + 0.06 * rng.random((h, w)))
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    # 5. éclaboussures près des bords
    for _ in range(splat):
        side = r.choice(("l", "r", "t", "b", "r", "l"))
        if side == "l": cx, cy = r.uniform(0, w * 0.12), r.uniform(T * 0.6, B * 1.03)
        elif side == "r": cx, cy = r.uniform(w * 0.88, w), r.uniform(T * 0.6, B * 1.03)
        elif side == "t": cx, cy = r.uniform(w * 0.2, w * 0.95), r.uniform(T * 0.15, T * 0.85)
        else: cx, cy = r.uniform(w * 0.05, w * 0.8), r.uniform(B * 1.01, min(h, B * 1.08))
        rad = r.uniform(1.2, 5) * S
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=255)
    img = img.filter(ImageFilter.GaussianBlur(0.5 * S)).resize((W * 5 // 8, H * 5 // 8), Image.LANCZOS)
    out = Image.new("LA", img.size, 0)
    out.putalpha(img)
    return out

OUT.mkdir(parents=True, exist_ok=True)
brush(7, core=(0.16, 0.84)).save(OUT / "brush-card.png", optimize=True)
brush(31, top=0.12, bot=0.9, core=(0.16, 0.84), skew=0.08, splat=40).save(OUT / "brush-swash.png", optimize=True)
print("ok")
