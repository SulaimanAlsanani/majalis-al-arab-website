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


## Follow-up experiment — 15 November 2026

- Tried replacing the CSS hero-background image with a responsive, explicitly prioritized HTML `<picture>`.
- Browser-based responsive checks passed for the experimental candidate, but the published-site Lighthouse lab run reported **99 mobile / 69 desktop**; the earlier published-site CSS hero baseline reported **93 mobile / 85 desktop**. These are separate, potentially noisy runs and should not be treated as controlled paired trials.
- Because improving desktop performance was the goal, the experimental `<picture>` and matching CSS were **reverted**.
- The real-site audit workflow remains enabled after successful deployments. The next performance optimization should focus on a fully controlled, licensed image asset or another measurable bottleneck rather than assuming a different tag automatically improves LCP.


## Current published-site recheck — 15 November 2026

Workflow: [Live Website Lighthouse run 43692169306](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43692169306), run on published GitHub Pages.

| Scenario | Performance | Accessibility | Best Practices | SEO | FCP | LCP |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage mobile | 96 | 100 | 100 | 100 | 1.65 s | 2.57 s |
| Homepage desktop | 82 | 100 | 100 | 100 | 0.85 s | 3.02 s |
| Catalog mobile | 99 | 100 | 100 | 100 | 1.62 s | 1.62 s |

The CSS-background hero was retained after the native HTML-picture experiment underperformed on desktop. Scores vary from earlier results (85 desktop, 93 mobile); repeatable Web Vitals field measurements are still needed before claiming a sustained improvement. Desktop 90+ remains an open target. The publicly selectable color-theme controls and their keyboard interactions were restored across homepage and interior-page footers; responsive Visual QA passed for commit `853ba982ff8789ed0cb2e40ac6078efcdd5683f0`.


## Lazy business imagery and mobile theme UI — 15 November 2026

Changes:
- The Restaurant and Diwaniya card photos now use below-the-fold `<img loading="lazy" decoding="async" fetchpriority="low">` with explicit image geometry and an ornamental fallback. The homepage hero still uses the previous, prioritized CSS background.
- Dynamic mobile browser `theme-color` now follows the saved Heritage, Warm Sand or Modern Noir palette across routes.
- [Visual QA](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43695171562) passed mobile, tablet and desktop checks for this set of changes.
- [Published-site Lighthouse](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43695265387) completed with home mobile **92**, home desktop **68**, catalog mobile **93** (all three achieved accessibility, best-practices, and SEO **100**). This single run does **not** establish an improvement from lazy loading: even the unchanged catalog scored lower than earlier runs, indicating measurement variability or changing network conditions. The desktop 90+ target is not complete.

The remaining `Properly size images` issue is associated with externally hosted illustration assets. Official, approved source images and licensed web fonts are prerequisites for more deterministic asset control and repeatable production measurements.


## Optimized production asset pipeline — 15 November 2026

The GitHub Pages release process now minifies **only its published CSS/JavaScript copies** with esbuild, leaving the repository sources readable and editable. For any tiny file whose output is not smaller, the original copy is retained. A byte-size audit and complete Playwright responsive QA run against the `dist/` package before deployment.

Measured release output: **66,335 source bytes vs 60,794 production bytes** (5,541 bytes / **8.4%** reduction across CSS and JS files). These are uncompressed asset sizes, not network-transfer or Lighthouse savings.

- [Production pipeline and deployment success](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43708054474)
- [Lighthouse live-site results](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43708191449): home mobile **96**, home desktop **77**, catalog mobile **93**; all tested routes accessibility/best-practices/SEO **100**.

The desktop Lighthouse 90+ performance objective remains open. Production minification reduced asset size but has **not demonstrated** a desktop Lighthouse score improvement in this single run. External hero media, font licensing, and approved local imagery remain important dependencies.


## Desktop hero sizing experiment — 15 November 2026

The homepage's illustrative desktop background now uses a 1280px, quality-70 Unsplash image instead of a 1600px, quality-75 variant; the desktop preload and both CSS hero references are kept identical. The mobile 900px image remains unchanged. Structural checks and Playwright tests verify the active CSS background and responsive preload agree, preventing accidental duplicate hero transfers.

- [Deployment, optimized-bundle browser QA](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43709552482): **passed**.
- [Live Lighthouse for the updated desktop image](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43709660063): homepage mobile **99** (LCP **1.97 s**), homepage desktop **85** (LCP **2.56 s**), catalog mobile **100** (LCP **0.99 s**); all three scored **100** for accessibility, best practices and SEO.
- [Prior live Lighthouse](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43708526450): homepage mobile **93** (LCP **2.61 s**), homepage desktop **78** (LCP **2.88 s**), catalog mobile **100** (LCP **1.54 s**). These are individual lab runs with network variability; the observed desktop improvement is not a measured field-data guarantee.
- The updated desktop hero transfer was approximately **45.9 KB** in the live lab report. Unsplash is still an external dependency, and these editorial photographs require replacement with verified official photography before commercial launch.

**Decision:** Retain the smaller CSS hero variant given successful layout tests and improved observed desktop lab performance. The 90+ desktop target remains an open objective. Avoid trading away visual fidelity without side-by-side visual review and repeated measurements.


## Asset-level diagnostics — 15 November 2026

The enhanced Lighthouse runner now includes the largest transferred network resources, request counts, and available LCP-element metadata in `performance-reports/summary.json`. Full raw audits remain available as GitHub Actions artifacts.

Verified measurements from the [published-site Lighthouse run](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43709660063) after the responsive desktop hero image-width experiment:

| Scenario | Performance | Accessibility | SEO | LCP | Requests | Total measured transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage mobile | 99 | 100 | 100 | 1.97 s | 15 | 139,240 B |
| Homepage desktop | 85 | 100 | 100 | 2.56 s | 16 | 196,945 B |
| Catalog mobile | 100 | 100 | 100 | 0.99 s | 16 | 80,167 B |

The desktop hero image was about **45.9 KB** transferred, rather than the earlier larger candidate. The desktop run also loaded two illustrative card images (about **42.3 KB** and **30.2 KB**) and six distinct Tajawal `.woff2` font requests (each about 9–10.5 KB); external media and font resources are significant contributors to bytes transferred. These counts are from a single simulated Lighthouse run, not real-user transfer statistics. The LCP-element node was unavailable in this Lighthouse audit format, so no specific element can be asserted as LCP.

**Next priorities:** (1) obtain licensed DIN Next Arabic webfont assets or an authorized provider embed, (2) consider reducing unnecessary font weights/subsets only after checking visual fidelity and licensing, (3) replace the externally hosted illustrative imagery with officially approved optimized files, (4) confirm improvements by repeated measurements on the **published site**. Do not infer production compression problems from the local Python test server, and do not claim the 90+ desktop target is achieved: it remains **85** in this single published audit.


## Optional font weight experiment — 15 November 2026

Removed the unused Tajawal 500 weight from the Google Fonts fallback stylesheet URLs on all **14** HTML pages; the retained weights are 400, 700 and 800. The preferred DIN Next Arabic stack was left unchanged (a licensed embedded font is still needed for universal DIN rendering). Source QA now prevents accidentally requesting the unused 500 weight again.

The [live-site Lighthouse audit](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43725242058) passed, and the deployment [completed successfully](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43725104259). Measured performance: home mobile **93**, home desktop **80**, catalog mobile **99**; all three accessibility, best practices and SEO **100**.

**Important null result:** the audit still recorded **six** `fonts.gstatic.com` WOFF2 requests. Simply removing the unused CSS weight did **not** establish lower transfer volume or better performance; compared with earlier 85 desktop run, the score was lower, but isolated Lighthouse runs vary with test conditions. Future font optimization should use licensed and controlled assets, actual text coverage/subsets and repeated comparable published-site measurements, rather than merely removing family-weight parameters.

## Self-hosted Tajawal fallback and viewport-triggered photography — 15 November 2026

The homepage now keeps its two illustrative business-card photographs behind a 64px IntersectionObserver boundary, with fixed dimensions and `noscript` fallback. Photos no longer compete with the priority hero at initial load. [Deployed version](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43725401390) and [visual QA](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43725401329) passed.

The production release bundles **Tajawal v5.3.0** (Arabic and Latin WOFF2, weights 400/700/800) locally from the pinned `@fontsource/tajawal` package and includes the upstream **SIL Open Font License 1.1** copyright notice in `assets/Tajawal-OFL.txt`. Only the published artifact is rewritten: development HTML retains remote Google Fonts for convenient static preview. Production browser QA verifies local font loading and refuses Google Fonts requests. The priority font stack still starts with DIN Next Arabic if installed; a licensed DIN webfont remains **not provided**.

### Published Lighthouse after local fallback

| Scenario | Performance | Accessibility | Best Practices | SEO | LCP | External requests | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage mobile | **100** | 100 | 100 | 100 | **1.75 s** | **2** | 109,976 B |
| Homepage desktop | **90** | 100 | 100 | 100 | **1.83 s** | **2** | 125,560 B |
| Catalog mobile | **100** | 100 | 100 | 100 | **1.32 s** | **0** | 80,701 B |

- [Production deploy and test gate](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43726058239): **success**.
- [Lighthouse against the published site](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43726172640): **success**, correct published SHA.
- Prior [live audit before local font hosting](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43725510815): homepage desktop **85**, homepage mobile **99**, catalog mobile **99**; desktop had 9 external requests and catalog had 7. Following font hosting the desktop external-request count dropped to **2**, and the catalog count to **0**. Overall desktop transfer volume did **not** materially drop, because fonts were moved rather than removed.

The **90/100 desktop** objective was reached **in one published synthetic Lighthouse run**. Treat it as an achieved lab result, **not** a stable field performance guarantee. The external Unsplash imagery is still illustrative and must be replaced with approved official photography before launch; do not imply those images document the establishment.
