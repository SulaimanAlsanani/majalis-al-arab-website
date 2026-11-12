#!/usr/bin/env python3
"""Validate static pages and local links without third-party dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "about.html", "restaurant.html", "diwaniya.html", "roasteries.html", "catalog.html", "faq.html", "gallery.html", "locations.html", "gifts.html", "hospitality.html", "business.html"]

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()
        self.lang_pairs = 0
        self.lang = ""
        self.direction = ""
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang", "")
            self.direction = a.get("dir", "")
        if "id" in a:
            self.ids.add(a["id"])
        if "data-ar" in a and "data-en" in a:
            self.lang_pairs += 1
        for name in ("href", "src"):
            if a.get(name):
                self.links.append(a[name])

errors = []
for page in PAGES:
    path = ROOT / page
    if not path.is_file():
        errors.append(f"Missing page: {page}")
        continue
    p = LinkParser()
    p.feed(path.read_text(encoding="utf-8"))
    if p.lang != "ar" or p.direction != "rtl":
        errors.append(f"Incorrect default language/direction: {page}")
    if p.lang_pairs < 8:
        errors.append(f"Missing bilingual translations: {page}")
    for link in p.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc or link.startswith(("mailto:", "tel:", "data:")):
            continue
        pathname = parsed.path or page
        if pathname.startswith("/"):
            errors.append(f"Absolute local URL in {page}: {link}")
            continue
        destination = (path.parent / pathname).resolve()
        try:
            destination.relative_to(ROOT)
        except ValueError:
            errors.append(f"Outside repository in {page}: {link}")
            continue
        if not destination.is_file():
            errors.append(f"Broken local reference in {page}: {link}")
        elif parsed.fragment and destination.suffix == ".html":
            dest_parser = LinkParser()
            dest_parser.feed(destination.read_text(encoding="utf-8"))
            if parsed.fragment not in dest_parser.ids:
                errors.append(f"Unknown anchor in {page}: {link}")
    print(f"{page}: {p.lang_pairs} bilingual elements, {len(p.links)} links checked")
if errors:
    print("\n".join(errors), file=sys.stderr)
    raise SystemExit(1)
print("All static pages and local references validated.")
