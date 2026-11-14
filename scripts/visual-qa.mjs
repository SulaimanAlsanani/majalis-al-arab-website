import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const origin='http://127.0.0.1:4173';
const pages=['index.html','about.html','restaurant.html','diwaniya.html','roasteries.html','catalog.html','faq.html','gallery.html','locations.html','gifts.html','hospitality.html','business.html','privacy.html','404.html'];
const sizes=[{name:'mobile',width:390,height:844},{name:'tablet',width:820,height:1180},{name:'desktop',width:1440,height:900}];
const errors=[];
await fs.mkdir('visual-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for (const size of sizes){
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(`${size.name}: JS: ${error.message}`));
  for (const pathname of pages){
   const response=await page.goto(`${origin}/${pathname}`,{waitUntil:'domcontentloaded',timeout:20000});
   if (!response?.ok()) errors.push(`${size.name}: HTTP ${response?.status()} on ${pathname}`);
   await page.waitForTimeout(150);
   const result=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    viewport:window.innerWidth,
    h1:document.querySelectorAll('h1').length,
    nav:!!document.querySelector('#navlinks'),
    footer:!!document.querySelector('footer'),
    signature:!!document.querySelector('link[href="assets/signature.css"]'),
    backButton:!!document.querySelector('.back-to-top')
   }));
   if(result.scrollWidth>result.viewport+2)errors.push(`${size.name}: horizontal overflow on ${pathname}: ${result.scrollWidth} > ${result.viewport}`);
   if(result.h1!==1||!result.nav||!result.footer||!result.signature||!result.backButton)errors.push(`${size.name}: missing page landmarks in ${pathname}`);
   const access=await page.evaluate(()=>({
    skip:!!document.querySelector('a.skip[href="#main"]'),
    mainFocus:document.querySelector('#main')?.getAttribute('tabindex'),
    fontRequest:[...document.querySelectorAll('link[href*="fonts.googleapis.com/css2"]')].map(el=>el.href)
   }));
   if(!access.skip||access.mainFocus!=='-1')errors.push(`${size.name}: skip/main keyboard access is missing on ${pathname}`);
   if(access.fontRequest.some(url=>url.includes('DM+Sans')))errors.push(`${size.name}: duplicate external web font on ${pathname}`);

   if(['index.html','catalog.html','restaurant.html'].includes(pathname)){
    await page.screenshot({path:`visual-artifacts/${pathname.replace('.html','')}-${size.name}.png`,fullPage:true,animations:'disabled'});
   }
  }
  await page.goto(`${origin}/index.html`,{waitUntil:'domcontentloaded'});
  if(size.width<=1180){
   await page.locator('#menuBtn').click();
   if(!await page.locator('#navlinks').evaluate(el=>el.classList.contains('open')))errors.push('Mobile menu did not open');
   await page.locator('.nav-dropdown summary').click();
   if(!await page.locator('.nav-dropdown').evaluate(el=>el.open))errors.push('Mobile business submenu did not open');
   await page.keyboard.press('Escape');
   if(await page.locator('.nav-dropdown').evaluate(el=>el.open))errors.push('Escape failed to close submenu');
  }else{
   await page.locator('.nav-dropdown summary').click();
   if(!await page.locator('.nav-dropdown').evaluate(el=>el.open))errors.push('Desktop business submenu did not open');
   await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,1000)});
  await page.waitForTimeout(120);
  const backVisible=await page.locator('.back-to-top').getAttribute('data-visible');
  if(backVisible!=='true')errors.push(`${size.name}: back-to-top is not visible when scrolling`);
  await page.locator('.back-to-top').click();
  await page.waitForTimeout(600);
  if(await page.evaluate(()=>window.scrollY)>800)errors.push(`${size.name}: back-to-top did not scroll upwards`);
  await page.locator('#langBtn').click();
  const lng=await page.locator('html').getAttribute('lang');
  if(lng!=='en')errors.push(`${size.name}: language switching failed`);
  // Homepage category shortcuts must deep-link to one matching catalog result.
  await page.goto(`${origin}/index.html`,{waitUntil:'domcontentloaded'});
  await page.locator('.spotlight-card').first().click();
  await page.waitForTimeout(200);
  const coffeeRoute=await page.evaluate(()=>({
   path:location.pathname,query:new URLSearchParams(location.search).get('q'),
   visible:[...document.querySelectorAll('.catalog-card')].filter(el=>!el.hidden).length
  }));
  if(!coffeeRoute.path.endsWith('/catalog.html')||coffeeRoute.query!=='القهوة'||coffeeRoute.visible!==1)
   errors.push(`${size.name}: homepage coffee shortcut did not filter catalog correctly: ${JSON.stringify(coffeeRoute)}`);
  await page.locator('#catalogReset').click();
  if(await page.locator('.catalog-card:visible').count()!==6)
   errors.push(`${size.name}: catalog reset did not reveal all categories`);
  await page.locator('[data-filter="food"]').click();
  const foodRoute=await page.evaluate(()=>new URLSearchParams(location.search).get('category'));
  if(foodRoute!=='food'||await page.locator('.catalog-card:visible').count()!==2)
   errors.push(`${size.name}: catalog category filter or URL sync failed`);
  // FAQ filters must support direct links and a reversible reset.
  await page.goto(`${origin}/faq.html?category=locations`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(100);
  const faqLocationCount=await page.locator('.faq-item:visible').count();
  if(faqLocationCount!==2)errors.push(`${size.name}: FAQ direct filter expected two location questions, got ${faqLocationCount}`);
  await page.locator('#faqReset').click();
  if(await page.locator('.faq-item:visible').count()!==10)
   errors.push(`${size.name}: FAQ reset did not restore ten questions`);
  await page.locator('#faqSearch').fill('coffee');
  if(await page.locator('.faq-item:visible').count()===0)
   errors.push(`${size.name}: English FAQ search returned no coffee results`);


  await context.close();
 }
}finally{await browser.close()}
await fs.writeFile('visual-artifacts/qa-results.json',JSON.stringify({pages:pages.length,viewports:sizes,errors},null,2));
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('Visual QA passed: 14 pages, mobile + tablet + desktop, no overflow, navigation, catalog deep links, back-to-top and language checked.');
