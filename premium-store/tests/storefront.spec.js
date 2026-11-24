const { test, expect } = require('@playwright/test');
const { readFile } = require('node:fs/promises');

test('homepage shows visible search, active banner, categories, and usable cart control', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#heroSlider')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'وش حاب تطلب اليوم؟' })).toBeVisible();
  await expect(page.locator('#globalSearch')).toBeVisible();
  await expect(page.locator('#headerCart')).toBeVisible();
  await expect(page.locator('#heroSlider .hero-slide').first()).toHaveAttribute('aria-hidden','false');
  await page.screenshot({path: 'test-results/home-' + test.info().project.name + '.png', fullPage: true});
});

test('meal cards inset the complete photo above the product details', async ({page}) => {
  await page.goto('/#/menu');
  const cards=page.locator('.product-grid .product-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(20);
  const first = cards.first();
  const photo = first.locator('.card-photo');
  await expect(photo).toHaveAccessibleName(/تفاصيل.*ر\.س/);
  await expect(photo).toHaveCSS('background-color', 'rgb(247, 243, 241)');
  await expect(photo.locator('img')).toHaveCSS('object-fit', 'contain');
  await expect(first.locator('.card-title')).toBeVisible();
  await expect(first.locator('.card-price')).toContainText('ر.س');
  await expect(first.locator('.add-button svg')).toBeVisible();
  await expect(first.locator('.add-button')).toHaveAccessibleName(/أضف .* إلى السلة/);
  await expect(first.locator('.add-button')).toHaveText('');
  const dimensions = await photo.evaluate(node => {
    const image = node.getBoundingClientRect();
    const artwork = node.querySelector('img').getBoundingClientRect();
    const card = node.closest('.product-card');
    const cardRect = card.getBoundingClientRect();
    const title = card.querySelector('.card-title').getBoundingClientRect();
    const price = card.querySelector('.card-price').getBoundingClientRect();
    const add = card.querySelector('.add-button').getBoundingClientRect();
    return {
      ratio: image.width / image.height,
      frameInset: image.left > cardRect.left && image.right < cardRect.right && image.top > cardRect.top,
      artworkInset: artwork.width < image.width && artwork.height < image.height,
      detailsBelowPhoto: [title, price, add].every(rect => rect.top >= image.bottom),
      priceBelowTitle: price.top >= title.bottom,
      addOnLeft: add.right <= title.left
    };
  });
  expect(dimensions.ratio).toBeCloseTo(21 / 10, 1);
  expect(dimensions.frameInset).toBe(true);
  expect(dimensions.artworkInset).toBe(true);
  expect(dimensions.detailsBelowPhoto).toBe(true);
  expect(dimensions.priceBelowTitle).toBe(true);
  expect(dimensions.addOnLeft).toBe(true);
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

test('checkout reviews pickup and delivery with localized phone numbers and current details', async ({page, context, baseURL}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:18.2167, longitude:42.5041});
  const checkoutRequests = [];
  page.on('request', request => {
    if (request.url().startsWith(baseURL) && request.method() !== 'GET') checkoutRequests.push(request.url());
  });
  await page.goto('/#/product/1');
  await page.locator('#itemNote').fill('بدون فلفل');
  await page.locator('#qtyPlus').click();
  await page.locator('#addSelected').click();
  await expect(page.locator('.basket-item')).toContainText('بدون فلفل');
  await page.reload();
  await expect(page.locator('#headerCount')).toHaveText('2');

  const continueButton = page.locator('[data-mobile-continue]');
  const mobile = await continueButton.isVisible();
  await (mobile ? continueButton : page.locator('#goCheckout')).click();
  await expect(page).toHaveURL(/#\/checkout$/);
  const review = mobile ? continueButton : page.locator('#checkoutReview');
  const panel = page.locator('#checkoutPreview');
  const phone = page.locator('#checkoutPhone');
  const address = page.locator('#checkoutAddress');
  await review.click();
  await expect(phone).toBeFocused();
  await expect(phone).toHaveAttribute('aria-invalid', 'true');

  await phone.fill('٠٥٠ ١٢٣ ٤٥٦٧');
  await review.click();
  await expect(panel).toContainText('+966501234567');
  await expect(panel).toContainText('طريق المطار، أبها');
  await expect(panel).toContainText('بدون فلفل');

  await page.locator('[data-checkout-mode="delivery"]').click();
  await review.click();
  await expect(address).toHaveAttribute('aria-invalid', 'true');
  await address.fill('أبها، حي المنسك، شارع <تجريبي>');
  await review.click();
  await expect(panel).toContainText('أبها، حي المنسك، شارع <تجريبي>');
  const pendingDownload = page.waitForEvent('download');
  await panel.locator('[data-download-order-summary]').click();
  const download = await pendingDownload;
  const summary = await readFile(await download.path(), 'utf8');
  expect(download.suggestedFilename()).toBe('majalis-demo-order-summary.txt');
  expect(summary).toContain('أبها، حي المنسك، شارع <تجريبي>');
  expect(summary).toContain('\nرقم التواصل: +966501234567');
  await address.fill('');
  await expect(panel).toBeHidden();

  await page.locator('#locateMe').click();
  await expect(page.locator('#clearCheckoutLocation')).toBeVisible();
  await review.click();
  await expect(panel).toContainText('18.21670, 42.50410');
  await page.locator('#clearCheckoutLocation').click();
  await review.click();
  await expect(address).toHaveAttribute('aria-invalid', 'true');
  await expect(panel).toBeHidden();
  expect(checkoutRequests).toEqual([]);
});

test('demo order flow applies saved address and discount, tracks status and reorders', async ({page}) => {
  await page.goto('/#/addresses');
  await page.locator('[name="label"]').fill('البيت');
  await page.locator('[name="address"]').fill('أبها، عنوان للمعاينة');
  await page.locator('#previewAddressForm [type="submit"]').click();
  await expect(page.getByRole('heading', {name:'البيت'})).toBeVisible();
  await page.goto('/#/menu');
  await page.locator('[data-service-mode="delivery"]').click();
  await expect(page.locator('[data-service-mode="delivery"]')).toHaveAttribute('aria-pressed','true');
  await page.goto('/#/product/1');
  await page.locator('#addSelected').click();
  await expect(page).toHaveURL(/#\/cart$/);
  await page.goto('/#/checkout');
  await page.locator('#previewSavedAddress').selectOption({label:'البيت'});
  await expect(page.locator('#checkoutAddress')).toHaveValue('أبها، عنوان للمعاينة');
  await page.locator('#checkoutPhone').fill('0500000000');
  await page.locator('#previewCoupon').fill('MAJALIS10');
  await page.locator('#previewCouponForm [type="submit"]').click();
  await expect(page.getByText('الخصم التجريبي',{exact:true})).toBeVisible();
  await page.locator('#previewPayment').selectOption('card');
  await page.locator('#checkoutReview').click();
  await expect(page.locator('#checkoutPreview')).toContainText('مدى (محاكاة)');
  await page.locator('[data-experience="save-order"]').click();
  await expect(page).toHaveURL(/#\/orders$/);
  await expect(page.locator('.preview-statuses [aria-current="step"]')).toHaveText('استُلِم الطلب');
  await page.locator('[data-experience="advance"]').click();
  await expect(page.locator('.preview-statuses [aria-current="step"]')).toHaveText('قيد التجهيز');
  await page.reload();
  await expect(page.locator('.preview-statuses [aria-current="step"]')).toHaveText('قيد التجهيز');
  await page.locator('[data-experience="reorder"]').click();
  await expect(page.locator('#headerCount')).toHaveText('1');
});

test('seating draft saves date, party size and hospitality without making a reservation', async ({page}) => {
  await page.goto('/#/seating');
  await page.locator('[name="guests"]').fill('4');
  const date = page.locator('[name="date"]');
  await date.fill(await date.getAttribute('min'));
  await page.locator('[name="time"]').fill('19:00');
  await page.locator('[name="hospitality"]').selectOption({index:1});
  await page.locator('#previewBookingForm [type="submit"]').click();
  const summary = page.locator('.experience-booking-summary');
  await expect(summary).toContainText('4 ضيوف');
  await expect(summary).toContainText('19:00');
  await expect(summary.getByRole('link')).toHaveAttribute('href', /^https:\/\/wa\.me\//);
  await page.reload();
  await expect(summary).toBeVisible();
});
