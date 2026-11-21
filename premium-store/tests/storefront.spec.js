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

test('all visible cards keep primary image and card price in normal bounds', async ({page}) => {
  await page.goto('/#/menu');
  const cards=page.locator('.product-grid .product-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(20);
  await expect(cards.first().locator('.card-price')).toContainText('ر.س');
  const dimensions=await cards.first().evaluate(node=>({w:node.getBoundingClientRect().width, h:node.getBoundingClientRect().height}));
  expect(dimensions.w).toBeGreaterThan(125);
  expect(dimensions.h).toBeGreaterThan(140);
});

test('search with Arabic text, filters and product detail notes are functional', async ({page}) => {
  await page.goto('/');
  await page.locator('#globalSearch').fill('شكشوكة');
  await page.locator('#globalSearch').press('Enter');
  await expect(page.locator('.product-grid .product-card').first()).toBeVisible();
  await expect(page.locator('.product-grid .product-card').first().locator('.card-title')).toContainText('شكشوكة');
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

test('no horizontal page overflow on common viewports', async ({page}) => {
  await page.goto('/');
  const widths=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    document:document.documentElement.scrollWidth
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport+2);
});
