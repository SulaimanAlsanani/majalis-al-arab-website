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

# Navigation must be consistent and mark the current public page.
expected_nav = [
    "index.html", "about.html", "restaurant.html", "diwaniya.html",
    "roasteries.html", "catalog.html", "locations.html", "index.html#contact",
]
class NavParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_nav = False
        self.links = []
        self.current = []
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if tag == "nav" and props.get("id") == "navlinks":
            self.in_nav = True
        elif self.in_nav and tag == "a":
            self.links.append(props.get("href"))
            if props.get("aria-current") == "page":
                self.current.append(props.get("href"))
    def handle_endtag(self, tag):
        if tag == "nav" and self.in_nav:
            self.in_nav = False

for page in PAGES + ["404.html"]:
    parser = NavParser()
    parser.feed((ROOT / page).read_text(encoding="utf-8"))
    if parser.links != expected_nav:
        errors.append(f"{page}: navigation links differ from approved navigation")
    expected_current = [page] if page in expected_nav else []
    if parser.current != expected_current:
        errors.append(f"{page}: incorrect active-page marker {parser.current}")


# Premium redesign regression checks.
home_markup = (ROOT / "index.html").read_text(encoding="utf-8")
catalog_markup = (ROOT / "catalog.html").read_text(encoding="utf-8")
base_styles = (ROOT / "assets" / "styles.css").read_text(encoding="utf-8")
if "premium-hero" not in home_markup or "editorial-businesses" not in home_markup:
    errors.append("Premium landing page structure missing")
for section in ["home", "about", "businesses", "products", "locations", "contact"]:
    if f'id="{section}"' not in home_markup:
        errors.append(f"Main section missing: {section}")
for legacy_anchor in ["restaurant", "diwaniya", "values", "culture", "services"]:
    if f'id="{legacy_anchor}"' not in home_markup:
        errors.append(f"Required backward-compatible anchor missing: {legacy_anchor}")
if catalog_markup.count('class="catalog-visual"') != 6:
    errors.append("Expected six catalog illustration panels")
if "nav-dropdown" not in base_styles:
    errors.append("Business dropdown styling missing")
for page in PAGES + ["404.html"]:
    markup = (ROOT / page).read_text(encoding="utf-8")
    if 'class="nav-dropdown"' not in markup:
        errors.append(f"{page}: primary business dropdown missing")

# Signature design must be consistently loaded and stay free of duplicate includes.
for page in PAGES + ["404.html"]:
    markup = (ROOT / page).read_text(encoding="utf-8")
    if markup.count('href="assets/signature.css"') != 1:
        errors.append(f"{page}: signature CSS must be included exactly once")
    if markup.count('src="assets/signature.js"') != 1:
        errors.append(f"{page}: signature interaction script must be included exactly once")
signature_css = (ROOT / "assets" / "signature.css").read_text(encoding="utf-8")
signature_js = (ROOT / "assets" / "signature.js").read_text(encoding="utf-8")
if ".back-to-top" not in signature_css or "prefers-reduced-motion" not in signature_css:
    errors.append("Missing responsive and accessible Signature style rules")
if "aria-label" not in signature_js or "MutationObserver" not in signature_js:
    errors.append("Missing bilingual back-to-top accessibility handling")

# All routes share the provisional visual mark; verified official logo is still required.
for page in PAGES + ["404.html"]:
    markup = (ROOT / page).read_text(encoding="utf-8")
    if markup.count('href="assets/favicon.svg"') != 1:
        errors.append(f"{page}: browser favicon missing or duplicated")
if not (ROOT / "assets" / "favicon.svg").is_file():
    errors.append("Provisional favicon SVG is missing")

# Every page loads the global DIN Next Arabic brand-font declaration.
font_css = (ROOT / "assets" / "signature.css").read_text(encoding="utf-8")
if '--brand-font:' not in font_css or '"DIN Next Arabic"' not in font_css or '"DIN Next LT Arabic"' not in font_css:
    errors.append("DIN Next Arabic global brand font stack is missing")
if "font-family:var(--brand-font)!important" not in font_css:
    errors.append("DIN Next Arabic global font application is missing")

# Catalog and FAQ provide functional reset tools and shareable URL state.
catalog_html = (ROOT / "catalog.html").read_text(encoding="utf-8")
catalog_js = (ROOT / "assets" / "catalog.js").read_text(encoding="utf-8")
faq_html = (ROOT / "faq.html").read_text(encoding="utf-8")
faq_js = (ROOT / "assets" / "faq.js").read_text(encoding="utf-8")
homepage = (ROOT / "index.html").read_text(encoding="utf-8")
if 'id="catalogReset"' not in catalog_html or 'id="catalogResultCount"' not in catalog_html:
    errors.append("Catalog reset/result count is absent")
if 'id="faqReset"' not in faq_html:
    errors.append("FAQ reset is absent")
for module_name, module in [("catalog", catalog_js), ("FAQ", faq_js)]:
    if "searchParams" not in module or "replaceState" not in module or "popstate" not in module:
        errors.append(f"{module_name} deep-link state synchronization is incomplete")
if homepage.count('class="spotlight-card" href="catalog.html?q=') != 3:
    errors.append("Homepage product quick links are not configured")

# Performance and keyboard-accessibility invariants for every static page.
for page in PAGES + ["404.html"]:
    markup = (ROOT / page).read_text(encoding="utf-8")
    if 'family=DM+Sans' in markup:
        errors.append(f"{page}: unused external font family still requested")
    if '<a class="skip" href="#main">' not in markup:
        errors.append(f"{page}: missing keyboard skip-to-main link")
    if '<main id="main" tabindex="-1">' not in markup:
        errors.append(f"{page}: main landmark is not programmatically focusable")
signature_css = (ROOT / "assets" / "signature.css").read_text(encoding="utf-8")
for rule in [".skip:focus-visible", "prefers-reduced-motion", "prefers-contrast:more"]:
    if rule not in signature_css:
        errors.append(f"Shared accessible typography/style rule missing: {rule}")

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("Structural, sitemap, and client-side enquiry checks passed.")
