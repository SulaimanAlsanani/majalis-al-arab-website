#!/usr/bin/env python3
"""Build a reproducible, same-origin Tajawal fallback for the static Pages site.

DIN Next Arabic remains the first choice if licensed and installed on a device.
The open-licensed Tajawal weights are supplied locally only as a fallback.
"""
from pathlib import Path
from shutil import copyfile
import re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
ASSETS = DIST / "assets"
FONTS = ASSETS / "fonts"
PACKAGE = ROOT / "node_modules" / "@fontsource" / "tajawal" / "files"
WEIGHTS = (400, 700, 800)
SUBSETS = {
    "arabic": "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+200C-200E, U+2010-2011, U+204F, U+FB50-FDFF, U+FE70-FEFF",
    "latin": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
}
FONTS.mkdir(parents=True, exist_ok=True)
rules = ["/* Tajawal fallback, v5.3.0 (@fontsource/tajawal), SIL OFL 1.1. */"]
for weight in WEIGHTS:
    for subset, unicode_range in SUBSETS.items():
        name = f"tajawal-{subset}-{weight}-normal.woff2"
        source = PACKAGE / name
        if not source.is_file():
            raise RuntimeError(f"Expected pinned Fontsource file is missing: {source}")
        payload = source.read_bytes()
        if len(payload) < 1000 or not payload.startswith(b"wOF2"):
            raise RuntimeError(f"Fontsource file failed WOFF2 integrity checks: {name}")
        copyfile(source, FONTS / name)
        rules.append(
            "@font-face{font-family:'Tajawal';font-style:normal;"
            f"font-weight:{weight};font-display:swap;"
            f"src:url('./fonts/{name}') format('woff2');"
            f"unicode-range:{unicode_range};}}"
        )
(ASSETS / "font-fallback.css").write_text("\n".join(rules) + "\n", encoding="utf-8")

# The original HTML remains readable and uses Google Fonts for local preview.
# Only the published artifact is rewritten to load the locally bundled fallback.
font_link = re.compile(r'<link\b[^>]*href="https://fonts\.googleapis\.com/css2\?family=Tajawal[^"]+"[^>]*>', re.I)
preconnect = re.compile(r'<link\b[^>]*href="https://fonts\.(?:googleapis|gstatic)\.com"[^>]*>', re.I)
count = 0
for page in sorted(DIST.glob("*.html")):
    text = page.read_text(encoding="utf-8")
    if page.name == "odoo-preview.html":
        # This preview already bundles its own local faces.
        if "fonts.googleapis.com" in text or "fonts.gstatic.com" in text:
            raise RuntimeError(f"{page.name}: external webfont reference in the storefront preview")
        continue
    text, replaced = font_link.subn("", text)
    if replaced != 2:
        raise RuntimeError(f"{page.name}: expected two Google Fonts fallback references, got {replaced}")
    text = preconnect.sub("", text)
    text = re.sub(r'<noscript>\s*</noscript>', "", text)
    anchor = '<link rel="stylesheet" href="assets/styles.css">'
    if text.count(anchor) != 1:
        raise RuntimeError(f"{page.name}: missing main stylesheet anchor")
    text = text.replace(anchor, '<link rel="stylesheet" href="assets/font-fallback.css">' + anchor)
    if "fonts.googleapis.com" in text or "fonts.gstatic.com" in text:
        raise RuntimeError(f"{page.name}: external webfont reference remains")
    page.write_text(text, encoding="utf-8")
    count += 1

if not (ASSETS / "Tajawal-OFL.txt").is_file():
    raise RuntimeError("Required open font license notice is missing")
print(f"Bundled {len(WEIGHTS) * len(SUBSETS)} licensed same-origin WOFF2 subsets and rewrote {count} HTML pages")
