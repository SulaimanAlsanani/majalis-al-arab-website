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
- GitHub Pages **has not yet been enabled** in the repository, so the deployment workflow fails at `actions/configure-pages@v5` with `Get Pages site failed / Not Found`.
- To unblock deployment, select **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then re-run the workflow under Actions.

## Known launch constraints
- Sample photography is illustrative, not documentary imagery of Majalis Al Arab.
- The contact form is client-side copy-only; there is no server or email connection.
- Prices, menu items, exact branch map, hours, and service availability require confirmation.
