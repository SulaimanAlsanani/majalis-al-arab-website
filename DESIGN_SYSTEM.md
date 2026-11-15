# Majalis Al Arab — Premium Editorial Design System

## Direction
**Royal Heritage / تراث معاصر** — luxurious but quiet, inspired by the Saudi majlis rather than decorative ornaments.

## Tokens
- Deep green: `#172D27` (primary surfaces and hero)
- Muted gold: `#B99A62` (small accents only, never oversized borders)
- Ivory: `#F5F1E8` (quiet section surfaces)
- White: `#FFFFFF` (breathing room)
- Secondary ink: `#68766E`

## Typography
- Brand font: **DIN Next Arabic / DIN Next LT Arabic** is now first in the global font stack on every page via `assets/signature.css`.
- Licensing status: the repository has **no licensed DIN webfont files or an Adobe Fonts web project embed**. Therefore browsers without DIN installed currently fall back to Tajawal; configuring the CSS stack is **not proof of universal DIN rendering**.
- Production fallback: `@fontsource/tajawal@5.3.0` is packaged as same-origin WOFF2 (400/700/800, Arabic/Latin), with its upstream OFL 1.1 license notice. This is an open-source fallback **not** a licensed DIN Next replacement.
- Production requirement: provide a licensed web-use font package or the official Adobe Fonts web project embed for this domain, then verify actual `document.fonts` rendering in desktop/mobile browsers. Adobe Fonts may not be self-hosted without a separate license.
- English and Arabic: the same preferred DIN Next Arabic stack where available, with self-hosted open-licensed Tajawal as the consistent production fallback; no separate DM Sans request.
- Desktop hero: responsive `clamp(44px, 6vw, 78px)`.
- Section titles: responsive `clamp(30px, 3.45vw, 46px)`.
- Descriptions: approximately 16–19px, with generous line height.
- Bold, succinct page titles; at most one `h1` per page.

## Information architecture
The homepage leads to the business pages; it is not a duplicate of their entire content.

Primary navigation: Home, About, **Our Businesses** (Restaurant, Diwaniya, Roasteries & Mills), Products, Locations, Contact. FAQ, gallery, gifting and commercial proposals remain available through contextual pages and supporting links.

## Image handling
All current stock/remote images are **illustrative only**. They are not verified photographs of Majalis Al Arab. The category catalog uses illustrative icon artwork instead of invented product imagery.

### Production photography still needed
1. Approved official logo in SVG or high-quality PNG.
2. Restaurant: exterior, seating, representative approved dishes.
3. Diwaniya: actual gathering space and hospitality setup.
4. Roasteries: real coffee products, equipment, packaging.
5. Individual product photos and approved item names.
6. Branch exterior and accurate navigation pin.

Do not remove the imagery disclaimer until all actual photography is approved and deployed.

## Responsive QA
GitHub Actions `Visual QA - desktop and mobile` captures browser screenshots at 390px and 1440px, checks horizontal overflow, navigation and language switching. Screenshot artifacts are attached to the workflow run. The automated viewport check complements but **does not replace** human review on real mobile devices and browsers.

## Launch approvals outstanding
- Brand logo and imagery
- Official contact channel, branch phone, business hours, exact map
- Approved menu, product prices, packaging, stock statuses and service availability
- Final privacy/legal notices
- Human visual acceptance review on desktop and mobile


## Current redesign — Majalis Atelier (15 November 2026)

The latest visual layer is `assets/atelier.css`, applied on top of the existing `assets/signature.css` across all 14 pages. It retains the three user-selectable palettes, bilingual language behavior and navigation. This update is a genuine code-level redesign (hero, layout rhythm, navigation, photography presentation, cards and detail-page patterns), not a flattened image.

Visual directions available through the existing theme switcher:
- **Royal Heritage / المجلس المعاصر** — deep green `#19352e`, warm ivory `#faf8f2`, quiet brass `#b69a6b`.
- **Warm Sand / رملي دافئ** — sandstone `#4a382b` with natural paper `#fbf5ec`.
- **Modern Noir / فحمي معاصر** — charcoal `#252c2b` with pale stone `#f6f6f3`.

Reference websites and transferable principles (without copying text, logos or artwork):
- [Aesop](https://www.aesop.com/) — editorial negative space and restrained palette.
- [Di Milano](https://dimilano-cafe.com/) — Saudi-context café storytelling.
- [Element8 hospitality](https://www.element8.sa/industries/hospitality-fb) — bilingual hospitality information architecture.

Deployment: [GitHub Pages success](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43739267518). [Live Lighthouse](https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43739394550): mobile home **99**, desktop home **89**, catalog mobile **100**; all three accessibility, SEO and best practices **100**. Desktop performance was **90** in a previous measurement; Lighthouse variability means no sustained performance improvement should be assumed.

Imagery is still illustrative. Final commercial readiness requires the approved brand logo, official media, validated contact and location data and a licensed DIN Next Arabic webfont.
