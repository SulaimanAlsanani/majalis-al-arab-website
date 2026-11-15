#!/usr/bin/env python3
"""Verify the real GitHub Pages release, not merely the build artifact."""
import json
import os
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE = os.environ.get("SITE_BASE_URL", "https://sulaimanalsanani.github.io/majalis-al-arab-website").rstrip("/")
EXPECTED = os.environ.get("EXPECTED_DEPLOY_SHA", "").strip().lower()
PAGES = [
    "index.html", "about.html", "restaurant.html", "diwaniya.html",
    "roasteries.html", "catalog.html", "faq.html", "gallery.html",
    "locations.html", "gifts.html", "hospitality.html", "business.html",
    "privacy.html",
]
FILES = ["assets/styles.css", "assets/signature.js", "assets/favicon.svg", "sitemap.xml", "robots.txt"]


def get(path):
    # Cache-busting avoids treating a stale CDN response as the deployed version.
    uri = f"{BASE}/{path}?release={EXPECTED or 'health'}"
    req = Request(uri, headers={"User-Agent": "MajalisReleaseSmoke/1.0", "Cache-Control": "no-cache"})
    with urlopen(req, timeout=20) as res:
        return res.status, res.read(), res.headers.get("Content-Type", "")


def wait_for_release():
    for attempt in range(12):
        try:
            status, data, _ = get("build-info.json")
            obj = json.loads(data.decode("utf-8"))
            actual = str(obj.get("commit", "")).lower()
            if status == 200 and len(actual) == 40 and (not EXPECTED or actual == EXPECTED):
                print(f"Verified published build: {actual}")
                return
            print(f"Attempt {attempt + 1}/12: published build {actual or 'unknown'} does not match expected {EXPECTED or 'any valid SHA'}")
        except (HTTPError, URLError, ValueError, TimeoutError) as exc:
            print(f"Attempt {attempt + 1}/12: published build marker unavailable: {exc}")
        if attempt < 11:
            time.sleep(5)
    raise RuntimeError("The published GitHub Pages build marker was not synchronized with this deployment.")


def check_routes():
    errors = []
    for page in PAGES:
        try:
            status, body, content_type = get(page)
            html = body.decode("utf-8")
            if status != 200 or "text/html" not in content_type.lower():
                errors.append(f"{page}: status={status}, content-type={content_type}")
            if '<main id="main"' not in html or 'href="assets/signature.css"' not in html:
                errors.append(f"{page}: expected navigation/main or shared stylesheet not found")
            print(f"{page}: HTTP {status}, {len(body)} bytes")
        except (HTTPError, URLError, UnicodeDecodeError, TimeoutError) as exc:
            errors.append(f"{page}: {exc}")
    for path in FILES:
        try:
            status, body, _ = get(path)
            if status != 200 or len(body) < 10:
                errors.append(f"{path}: HTTP {status}, {len(body)} bytes")
            print(f"{path}: HTTP {status}, {len(body)} bytes")
        except (HTTPError, URLError, TimeoutError) as exc:
            errors.append(f"{path}: {exc}")
    if errors:
        raise RuntimeError("\n".join(errors))
    print(f"Published-site smoke checks passed: {len(PAGES)} HTML pages and {len(FILES)} static assets.")


if __name__ == "__main__":
    try:
        wait_for_release()
        check_routes()
    except RuntimeError as exc:
        print(f"Release smoke check failed: {exc}", file=sys.stderr)
        sys.exit(1)
