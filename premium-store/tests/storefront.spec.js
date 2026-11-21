const { test, expect } = require('@playwright/test');

test('homepage shows visible search, active banner, categories, and usable cart control', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#heroSlider')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'وش حاب تطلب اليوم؟' })).toBeVisible();
  await expect(page.locator('#globalSearch')).toBeVisible();
  await expect(page.locator('#headerCart')).toBeVisible();
  await expect(page.locator('#heroSlider .hero-slide').first()).toHaveAttribute('aria-hidden','false');
  await page.screenshot({path: 'test-results/home-' + test.info().project.name + '.png', fullPage: true});
});

test('meal cards show the full-width photo above the product details and controls', async ({page}) => {
  await page.goto('/#/menu');
  const cards=page.locator('.product-grid .product-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(20);
  const first = cards.first();
  const photo = first.locator('.card-photo');
  await expect(photo).toHaveAccessibleName(/تفاصيل.*ر\.س/);
  await expect(first.locator('.card-title')).toBeVisible();
  await expect(first.locator('.card-price')).toContainText('ر.س');
  await expect(first.locator('.card-fav svg')).toBeVisible();
  await expect(first.locator('.add-button svg')).toBeVisible();
  await expect(first.locator('.add-button')).toContainText('أضف للسلة');
  const dimensions = await photo.evaluate(node => {
    const image = node.getBoundingClientRect();
    const card = node.closest('.product-card');
    const details = [...card.querySelectorAll('.card-title, .card-fav, .card-price, .add-button')];
    return {
      ratio: image.width / image.height,
      horizontalInset: card.getBoundingClientRect().width - image.width,
      detailsBelowPhoto: details.every(element => element.getBoundingClientRect().top >= image.bottom)
    };
  });
  expect(dimensions.ratio).toBeCloseTo(16 / 9, 1);
  expect(dimensions.horizontalInset).toBeLessThanOrEqual(2);
  expect(dimensions.detailsBelowPhoto).toBe(true);
});

test('search with Arabic text, filters and product detail notes are functional', async ({page}) => {
  await page.goto('/');
  await page.locator('#globalSearch').fill('شكشوكة');
  await page.locator('#globalSearch').press('Enter');
  await expect(page.locator('.product-grid .product-card').first()).toBeVisible();
  await expect(page.locator('.product-grid .product-card').first().locator('.card-photo')).toHaveAccessibleName(/شكشوكة/);
  await page.locator('#globalSearch').fill('');
  await page.goto('/#/menu');
  await page.locator('#priceFilter').selectOption('under20');
  await expect(page.locator('.product-grid .product-card').first()).toBeVisible();
  await page.locator('.product-grid .product-card').first().locator('[data-product]').first().click();
  await expect(page.locator('#itemNote')).toBeVisible();
  await page.locator('#itemNote').fill('بدون فلفل');
  await expect(page.locator('#addSelected')).toBeVisible();
});

test('cart remains a preview; no real payment can be initiated', async ({page}) => {
  await page.goto('/#/product/1');
  await page.locator('#addSelected').click();
  await expect(page.locator('.basket-banner')).toBeVisible();
  await expect(page.locator('#headerCount')).not.toHaveText('0');
  await page.goto('/#/checkout');
  await expect(page.getByText('إتمام الطلب',{exact:false}).first()).toBeVisible();
  await expect(page.getByText('لم يتم تفعيله بعد',{exact:false}).first()).toBeVisible();
});

test('manual banner navigation moves the active banner', async ({page}) => {
  await page.goto('/');
  const slides=page.locator('#heroSlider .hero-slide');
  const before=await slides.first().getAttribute('aria-hidden');
  expect(before).toBe('false');
  await page.locator('#heroSlider [data-hero-move="1"]').click();
  await expect(slides.nth(1)).toHaveAttribute('aria-hidden','false');
});

test('no horizontal page overflow across storefront routes and viewport widths', async ({page}) => {
  const paths=['/','/#/menu','/#/offers','/#/seating','/#/product/1','/#/cart','/#/account','/#/help'];
  const sizes=test.info().project.name.includes('mobile')
    ? [320,360,390,430,520]
    : [768,900,1024,1280,1440,1920];
  for(const width of sizes){
    await page.setViewportSize({width,height:900});
    for(const route of paths){
      await page.goto(route);
      await expect(page.locator('#app')).toBeVisible();
      const measured=await page.evaluate(()=>{
        const viewport=document.documentElement.clientWidth;
        const documentWidth=document.documentElement.scrollWidth;
        const offenders=[...document.body.querySelectorAll('*')]
          .filter(el=>{
            const s=getComputedStyle(el);
            if(s.position==='fixed'||s.display==='none'||s.visibility==='hidden')return false;
            const r=el.getBoundingClientRect();
            // Ignore intentional contained horizontal category and product scroll rails.
            if(el.closest('.product-rail,.quick-nav,.hs-catalog-entry-actions'))return false;
            return r.width>0&&(r.left < -3 || r.right>viewport+3);
          })
          .slice(0,8).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,85)}));
        return {viewport,documentWidth,offenders};
      });
      expect(measured.documentWidth,'Overflow at '+route+' / '+width+': '+JSON.stringify(measured.offenders)).toBeLessThanOrEqual(measured.viewport+2);
      const main=await page.locator('#app').boundingBox();
      expect(main,'Main content clipped at '+route+' / '+width).not.toBeNull();
      expect(main.x,'Main content shifted outside left at '+route+' / '+width).toBeGreaterThanOrEqual(-2);
      expect(main.x+main.width,'Main content shifted outside right at '+route+' / '+width).toBeLessThanOrEqual(width+2);
    }
  }
});
