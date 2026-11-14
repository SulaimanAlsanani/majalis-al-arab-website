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
- Production requirement: provide a licensed web-use font package or the official Adobe Fonts web project embed for this domain, then verify actual `document.fonts` rendering in desktop/mobile browsers. Adobe Fonts may not be self-hosted without a separate license.
- English: DM Sans.
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
