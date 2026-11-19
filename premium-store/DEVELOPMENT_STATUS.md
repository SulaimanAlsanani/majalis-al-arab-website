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
