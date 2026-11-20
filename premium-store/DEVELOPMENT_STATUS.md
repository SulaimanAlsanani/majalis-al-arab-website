# Majalis Al Arab — Premium Storefront (experimental branch)

## Preview

Open `premium-store/index.html` in a browser, or inspect this commit-based preview:
`https://raw.githack.com/SulaimanAlsanani/majalis-al-arab-website/preview/odoo18-luxe-store/premium-store/index.html`

This is a responsive, Arabic RTL **design prototype**, not a production ecommerce checkout. The branch does not modify `main` or the hosted Odoo installation.

## Implemented

- Premium landing page, Saudi-oriented restaurant copy and a compact hero.
- Category navigation and independent full-catalog view with text search.
- Five-column desktop product grid, responsive tablet/mobile behavior.
- Ten editorial, split-layout banners; curated product rows with quick add.
- Dedicated cards for private seating, PlayStation gaming and football viewing; each links to a relevant WhatsApp inquiry.
- Local preview cart with quantity updates, empty-cart action, stored cart contents, and synchronized state across the page.
- Localized placeholder data from the photographed menu. Data and prices require independent verification.
- A dedicated image asset for PlayStation, and a locally included match-viewing image.
- Reduced-motion preferences, visible keyboard focus and alternate font fallback.

## Important limitations

1. No live Odoo products, variants, price lists, taxes, stock, cart or checkout are connected.
2. No real reservation service is connected. All booking calls are WhatsApp inquiries.
3. Photos are illustrative and some category/product photographs do not accurately match actual dishes.
4. DIN Next Arabic must be supplied with appropriate **web font licensing**. The CSS prefers locally installed DIN Next Arabic and otherwise falls back to Tajawal.
5. The "recommended" products on the landing page are editorial selections, **not** ranked from actual purchase data.
6. The cart is stored locally in the visitor's own browser and is not an order.
7. Full Chrome/mobile visual and functional QA is still required before production adoption.

## Odoo 18 integration plan

### Stage 1 — Staging theme package
- Build an Odoo 18 addon that depends on `website` and `website_sale` and registers appropriate website assets and QWeb templates.
- Namespace every theme rule to minimize interference with Odoo editor, POS, backend and checkout.
- Preserve native `website_sale` cart endpoints and Odoo's tax, pricing, inventory and payment logic.
- Keep the homepage unpublished until staging review.

### Stage 2 — Catalog and marketing data
- Map category cards and promotional groups to actual `product.public.category` and `product.template` entities.
- Read published products and their price/availability at runtime; never duplicate prices in frontend source.
- Replace prototype images with verified and licensed product images.
- Configure curated collection banners through website-editable content rather than hardcoded product IDs.

### Stage 3 — Acceptance
- Test Arabic RTL on desktop, tablet and mobile.
- Test add-to-cart, variants, quantity, taxes, discounts, abandoned cart behavior and payment redirect using staging-only data.
- Validate contact links and permissions for booking inquiries.
- Review performance, accessibility, SEO and legal pages.
- Back up production and deploy only after explicit approval.

## Safety

No change to the live Odoo database, main branch, payments, checkout configuration or production hosting is authorized by this branch.


## Generated product photography integration — 19 Nov 2026

- The storefront now expects `premium-store/assets/products/01.webp` through `28.webp`, indexed by the product's fixed numeric ID.
- The complete 28-image bundle was generated in a separate downloadable archive with a JSON mapping. Images are 600×600 WebP.
- **Critical:** the binary image files are not committed to this GitHub branch yet. Until the `assets/products` folder is uploaded, frontend image-error handling deliberately loads the old illustrative fallback photos. Do not describe the live preview as having all 28 new photos.
- The archive is named `majalis_28_product_images.zip`; unzip its `assets/products` folder into `premium-store/assets/products/` on this preview branch before visual verification.
- Generated images are illustrative and must be approved against each real dish. Variants made from contact sheets are not photographs of food served at the restaurant.
- Every product photo call (catalog cards, homepage story products, detailed product view and cart lines) uses the same ID-to-asset function, ensuring consistent mapping once the files are installed.

## Resumed development — 19 Nov 2026

- Added an Arabic catalog search toolbar, sorting by price (ascending/descending) or name, and a reset-filters action.
- Improved navigation between home, shop and seating, including cases where the full catalog was open.
- Added a local, non-transactional order summary with copy-to-clipboard, explicitly warning that no order is sent.
- Improved cart open/close focus behavior for keyboard navigation.
- Verified the single-file prototype JavaScript parses successfully after the changes.
- **Photo integration is incomplete:** 28 generated product images exist in the downloadable ZIP, but the 28 WebP binaries have not been added to the GitHub branch; the browser uses fallback photography. Upload `assets/products/*.webp` under `premium-store/` before treating this task as delivered.
- Still pending: run end-to-end Chrome interaction testing, check RTL at all device sizes, verify actual restaurant menu/prices and approve generated images against real dishes, test Odoo 18 staging module.


## Delivery-style redesign — 20 November 2026

The storefront at \`premium-store/index.html\` has been rebuilt as a **Majalis-branded, mobile-first restaurant ordering prototype**. The experience uses commonly recognizable delivery-commerce patterns. It is not a reproduction of HungerStation proprietary software, imagery, logos, or services.

### Implemented
- Responsive restaurant header and menu-first landing page, with mobile bottom navigation.
- 28 existing catalog items, searchable by name, categorized and sortable by price/name.
- Product cards with favorites; favorites stay in local browser storage.
- **Dedicated full product detail route** at \`#/product/:id\` showing a product image, price, detail information, kitchen notes and quantity controls.
- One or more cart lines per product depending on distinct kitchen notes, synchronized cart totals, quantity adjustment, line removal and clear-cart.
- Fulfillment preference mockup (pickup/delivery) with explicit warnings that store logistics are not configured.
- Copyable order summary, deliberately not submitted to Odoo or any payment provider.
- Three seating/gaming/football inquiry cards linking to the Majalis WhatsApp number.
- Compatible with web browser and mobile layouts. JavaScript syntax validation completed.

### Must be completed before release
- The WebP images for \`assets/products/01.webp\` … \`28.webp\` are still uncommitted to GitHub; the frontend uses fallback images when files are absent.
- Product photos and prototype prices require real restaurant approval.
- Real product variants, toppings, allergies, calories and inventory must be supplied by Odoo 18.
- Delivery zones, branch selection, pickup availability, taxes, fees and payments require native integration; no placeholder amounts should be presented as guaranteed.
- Full interactive browser QA, responsive visual QA, accessibility audit and Odoo integration tests remain outstanding.
- Existing Odoo staging theme addon is still a separate basic prototype, **not** an installation of this rebuilt web store.

### Suggested QA checklist
1. Open the main page on desktop and mobile; change category and sort.
2. Open a product card, adjust quantity and add kitchen notes.
3. Add the same product with a different note; verify separate cart lines.
4. Refresh the browser; verify persisted cart and favorites.
5. Change cart quantities, remove an item and inspect the total.
6. Toggle pickup/delivery; verify **no fabricated fees or ETA**.
7. Preview an order and copy its summary; verify **no order is sent**.
8. Test all external WhatsApp inquiry links.


## Expanded demonstration menu and font — 20 November 2026

- Kept the original 28 catalogue records with their original numeric IDs, names, prices and existing browser-cart compatibility.
- Added 97 explicitly **fictional/demo** menu entries in additional categories, for 125 total records in 12 categories. New IDs start at 29.
- The demo menu includes additional breakfasts, arika/masoub, stews/salads, desserts, drinks, grilled meals, sandwiches, starters, sharing platters, specialty coffee, sides and imaginary offers.
- New demo product cards display "تجريبي" and detail pages explicitly state demo products/prices are not approved restaurant menu items.
- Added a six-tile quick collection explorer; category filters, global search, favorites, cart and detail routes operate on the expanded catalog.
- Font stack prefers locally installed **DIN Next Arabic** followed by **Tajawal** (loaded from Google Fonts), IBM Plex Sans Arabic and a system fallback. A licensed, hosted DIN Next Arabic web font must be obtained to ensure all visitors see the actual DIN font.
- New demo product photos are category-related generic illustrative imagery, **not item-specific photography**. Original 28 image assets are still not uploaded to this branch, so their fallback images remain active.
- No new menu entries were created in Odoo, and the frontend preview is neither a live menu nor a functioning checkout.
