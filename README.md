# Majalis Al Arab Trading Group — Website

Premium bilingual (Arabic/English) static website for **Majalis Al Arab Trading Group**.

## Included
- Arabic RTL and English LTR
- Mobile responsive layout
- Royal Heritage, Warm Sand, and Modern Noir themes
- Restaurant, diwaniya, roasteries, products, values, and branch sections
- Demonstration enquiry form (copies text only; does **not** send messages)
- Automated deployment to GitHub Pages via GitHub Actions

## Publication
1. Go to **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Open **Actions → Deploy static website to GitHub Pages** and run the workflow if it hasn't run automatically.
4. The expected website URL is https://sulaimanalsanani.github.io/majalis-al-arab-website/

## Before official launch
- Replace all external demo photography with authorized images of the actual locations and products.
- Add official logo, approved restaurant menu and prices, branch phone numbers, map links, business hours.
- Connect a compliant contact provider or official contact channel; currently no enquiries are transmitted.
- Confirm service availability before mentioning reservations, delivery, shopping or commercial packages.
- Add real legal disclosures, privacy policy and product details as required.

## Project structure
```
index.html
assets/
  styles.css
  app.js
.github/workflows/pages.yml
.nojekyll
```


## Current build progress
- Dedicated bilingual pages: `about.html`, `restaurant.html`, `diwaniya.html`, `roasteries.html`.
- Shared interior styles and language/theme scripts under `assets/detail.*`.
- `python3 scripts/check_site.py` checks local links, anchor targets, and bilingual markup before deployment.
- The CI validation step passed on 2026-11-12.
- GitHub Pages has now been enabled. An actual deployment succeeded for commit `ac8f64c` on 2026-11-14: https://github.com/SulaimanAlsanani/majalis-al-arab-website/actions/runs/43595067862
- New commits trigger the Pages workflow automatically. Each release should be confirmed by a successful **Deploy static website to GitHub Pages** run and a live-URL smoke test; transient GitHub artifact-metadata failures should not be mistaken for content validation failures.
- The published preview URL remains https://sulaimanalsanani.github.io/majalis-al-arab-website/ until an official domain is approved.

## Known launch constraints
- Sample photography is illustrative, not documentary imagery of Majalis Al Arab.
- The contact form is client-side copy-only; there is no server or email connection.
- Prices, menu items, exact branch map, hours, and service availability require confirmation.
