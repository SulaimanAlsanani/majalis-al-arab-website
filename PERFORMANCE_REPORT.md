# Performance & Accessibility Audit — 14 November 2026

## Measurement method

Google Lighthouse 12.8.2, Chromium (Playwright) on Ubuntu 24.04 GitHub Actions, Node.js 22, deterministic local static site server (`python3 -m http.server`). The same tool and scenario definitions were used before and after the changes.

**Important caveat:** The Python development server does not serve gzip or Brotli; its "Enable text compression" warning should not be read as proof that the production GitHub Pages CDN is uncompressed. Lighthouse simulated-lab scores are variable and are **not Core Web Vitals field data**.

## Verified before / after measurements

| Scenario | Performance before | Performance after | Accessibility before | Accessibility after | FCP before | FCP after | LCP before | LCP after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage mobile | 92 | **99** | 96 | 96 | 2.59s | **1.53s** | 2.72s | **1.84s** |
| Homepage desktop | 68 | **77** | 96 | 96 | 2.58s | **1.54s** | 3.17s | **2.93s** |
| Catalog mobile | 93 | **100** | 96 | **100** | 2.59s | **1.53s** | 2.59s | **1.53s** |

Baseline: https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43593911511

Final candidate: https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43594444346

Visual QA after optimization: https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43594444343

Deployment: https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43594444368

## Implemented

1. Added responsive `fetchpriority="high"` image preloads for the CSS background hero at 390px and 1440px.
2. Loaded the *optional fallback* Tajawal stylesheet asynchronously, with `noscript` fallback. The DIN Next Arabic font-family stack remains the specified brand preference; a licensed web-font file/embed is **still required** for universal DIN rendering.
3. Increased contrast of gold type on ivory and sand backgrounds without changing the decorative gold brand color.
4. Created automated Lighthouse performance/accessibility/best-practices/SEO reports with full JSON attachments in GitHub Actions.
5. Re-tested navigation, language, responsive layout, catalog deep links and mobile/tablet/desktop layout via Playwright.

## Remaining priorities

- Measure the **live published URL** and compare against local lab results; do not conflate local Python-server compression warnings with GitHub Pages.
- Fix remaining Lighthouse contrast issues on the homepage; accessibility is 96 rather than 100.
- Investigate CSS reduction only after isolating critical styles by route; avoid regressions from aggressive removal.
- Replace unverified Unsplash illustration photography with official approved assets, and adopt controlled formats/sizes.
- Complete licensing and deployment of DIN Next Arabic as an actual web font.
- Verify real-world Core Web Vitals and business contact functionality after commercial launch approvals.

All scores are observations from the listed workflow runs, not guarantees of site-wide or visitor-level performance.


## Published-site Lighthouse audit — 14 November 2026

**Source:** GitHub Actions [Live Website Lighthouse](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43596350028), measuring the **published GitHub Pages URL** rather than the local Python server.

| Published URL scenario | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home mobile | **93** | **100** | **100** | **100** | 2.61s | 2.61s | 0.008 |
| Home desktop | **85** | **100** | **100** | **100** | 1.53s | 1.98s | 0.002 |
| Catalog mobile | **93** | **100** | **100** | **100** | 2.59s | 2.59s | 0.018 |

This is a single Lighthouse lab run from a GitHub-hosted runner against the live site; it is not visitor field data. Outcomes may vary with external imagery, fonts, geographic connection and runner conditions.

### Optimization experiment

A lower-resolution externally hosted hero image encoded as WebP was tried, then **reverted** after Lighthouse recorded lower performance (desktop 75 vs previous local 77; mobile 95 vs previous local 99). This result is a reminder not to assume reduced image dimensions alone guarantee improved LCP when external hosting and caching vary.

### New monitoring process

The automated workflow `.github/workflows/live-lighthouse.yml` now measures the published URL after successful Pages deployments and also supports manual runs. It uploads detailed Lighthouse JSON reports. The local Lighthouse budget workflow remains independent. Acknowledged bottlenecks: desktop performance still under the 90-point goal; current font fallback and external stock photographs still require brand/licensing finalization.
