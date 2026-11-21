# Majalis Al Arab — Odoo 18 storefront preview

This directory contains a standalone, Arabic RTL, responsive storefront demonstration. It is not yet an installable Odoo theme. Product data, imagery and prices are demonstration-only. Checkout deliberately does not submit live orders.

## Local preview (Chrome)

```bash
git clone --branch preview/odoo18-luxe-store --single-branch https://github.com/SulaimanAlsanani/majalis-al-arab-website.git
cd majalis-al-arab-website/odoo18-store-preview
python -m http.server 8000
```

Open http://localhost:8000 in Chrome. Alternatively double click `index.html`.

## Next technical phase

1. Package Odoo 18 module with `__manifest__.py`, views and frontend assets.
2. Replace demonstration items with published Odoo website products and real categories.
3. Integrate `website_sale` native cart and checkout routes, with CSRF handling, pricing, tax, and stock.
4. Validate in isolated Docker/staging database. No production deployment without approval.

The frontend uses remotely hosted images and Google Tajawal. DIN Next Arabic must be provided under a suitable font license before embedding.
