#!/usr/bin/env python3
"""Additional dependency-free structural and launch-safety checks."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://sulaimanalsanani.github.io/majalis-al-arab-website/"
PAGES = [
    "index.html", "about.html", "restaurant.html", "diwaniya.html", "roasteries.html",
    "catalog.html", "faq.html", "gallery.html", "locations.html", "gifts.html",
    "hospitality.html", "business.html", "privacy.html",
]

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.duplicates = []
        self.labels = set()
        self.form_controls = []
        self.headings = 0
        self.canonicals = []
        self.jsonld = []
        self._jsonld_active = False
        self._script = []

    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if props.get("id"):
            identifier = props["id"]
            if identifier in self.ids:
                self.duplicates.append(identifier)
            self.ids.add(identifier)
        if tag == "label" and props.get("for"):
            self.labels.add(props["for"])
        if tag in ("input", "select", "textarea") and props.get("id"):
            self.form_controls.append((props["id"], props))
        if tag == "h1":
            self.headings += 1
        if tag == "link" and props.get("rel") == "canonical":
            self.canonicals.append(props.get("href"))
        if tag == "script" and props.get("type") == "application/ld+json":
            self._jsonld_active = True
            self._script = []

    def handle_data(self, text):
        if self._jsonld_active:
            self._script.append(text)

    def handle_endtag(self, tag):
        if tag == "script" and self._jsonld_active:
            self.jsonld.append("".join(self._script))
            self._jsonld_active = False

errors = []
sitemap_path = ROOT / "sitemap.xml"
if not sitemap_path.exists():
    errors.append("Missing sitemap.xml")
    locations = []
else:
    try:
        tree = ElementTree.parse(sitemap_path)
        ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
        locations = [el.text for el in tree.findall(f"{ns}url/{ns}loc")]
    except ElementTree.ParseError as exc:
        errors.append(f"Invalid sitemap: {exc}")
        locations = []

for page in PAGES:
    raw = (ROOT / page).read_text(encoding="utf-8")
    doc = Document()
    doc.feed(raw)
    expected = BASE + ("" if page == "index.html" else page)
    if doc.duplicates:
        errors.append(f"{page}: duplicate IDs {doc.duplicates}")
    if doc.headings != 1:
        errors.append(f"{page}: expected one h1, got {doc.headings}")
    if doc.canonicals != [expected]:
        errors.append(f"{page}: canonical mismatch {doc.canonicals!r}")
    if locations.count(expected) != 1:
        errors.append(f"{page}: expected exactly one sitemap URL")
    for identifier, props in doc.form_controls:
        if identifier not in doc.labels and not props.get("aria-label"):
            errors.append(f"{page}: unlabeled form control #{identifier}")
    for schema in doc.jsonld:
        try:
            obj = json.loads(schema)
            if obj.get("@context") != "https://schema.org":
                errors.append(f"{page}: JSON-LD context incorrect")
        except json.JSONDecodeError as exc:
            errors.append(f"{page}: invalid JSON-LD: {exc}")
    print(f"{page}: heading={doc.headings}, controls={len(doc.form_controls)}, JSON-LD={len(doc.jsonld)}")

if len(locations) != len(PAGES):
    errors.append(f"Sitemap contains {len(locations)} URLs, expected {len(PAGES)}")
for url in locations:
    p = urlparse(url)
    if not url.startswith(BASE) or p.query or p.fragment:
        errors.append(f"Unexpected sitemap URL: {url}")

index = (ROOT / "index.html").read_text(encoding="utf-8")
script = (ROOT / "assets" / "app.js").read_text(encoding="utf-8")
if 'id="downloadEnquiry"' not in index or "URL.createObjectURL" not in script:
    errors.append("Enquiry download feature is missing")
if 'action="http' in index or 'action="https' in index:
    errors.append("Demo contact form must not post to a remote server")
faq_html = (ROOT / "faq.html").read_text(encoding="utf-8")
faq_script = (ROOT / "assets" / "faq.js").read_text(encoding="utf-8")
faq_filters = ["all", "locations", "services", "products", "contact"]
if 'id="faqSearch"' not in faq_html or 'id="faqEmpty"' not in faq_html:
    errors.append("FAQ search or empty-results interface missing")
for filter_name in faq_filters:
    if f'data-faq-filter="{filter_name}"' not in faq_html:
        errors.append(f"FAQ filter missing: {filter_name}")
for cat in faq_filters[1:]:
    if f'data-faq-category="{cat}"' not in faq_html:
        errors.append(f"FAQ answer category missing: {cat}")
if faq_html.count('class="faq-item"') != 10:
    errors.append("FAQ entries count unexpected")
if 'MutationObserver' not in faq_script or 'aria-pressed' not in faq_script:
    errors.append("FAQ translation/accessible-filter behavior missing")

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("Structural, sitemap, and client-side enquiry checks passed.")
