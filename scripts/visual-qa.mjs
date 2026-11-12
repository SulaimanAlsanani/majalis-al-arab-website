import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const origin='http://127.0.0.1:4173';
const pages=['index.html','about.html','restaurant.html','diwaniya.html','roasteries.html','catalog.html','faq.html','gallery.html','locations.html','gifts.html','hospitality.html','business.html','privacy.html'];
const sizes=[{name:'mobile',width:390,height:844},{name:'desktop',width:1440,height:900}];
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
    footer:!!document.querySelector('footer')
   }));
   if(result.scrollWidth>result.viewport+2)errors.push(`${size.name}: horizontal overflow on ${pathname}: ${result.scrollWidth} > ${result.viewport}`);
   if(result.h1!==1||!result.nav||!result.footer)errors.push(`${size.name}: missing page landmarks in ${pathname}`);
   if(['index.html','catalog.html','restaurant.html'].includes(pathname)){
    await page.screenshot({path:`visual-artifacts/${pathname.replace('.html','')}-${size.name}.png`,fullPage:true,animations:'disabled'});
   }
  }
  await page.goto(`${origin}/index.html`,{waitUntil:'domcontentloaded'});
  if(size.name==='mobile'){
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
  await page.locator('#langBtn').click();
  const lng=await page.locator('html').getAttribute('lang');
  if(lng!=='en')errors.push(`${size.name}: language switching failed`);
  await context.close();
 }
}finally{await browser.close()}
await fs.writeFile('visual-artifacts/qa-results.json',JSON.stringify({pages:pages.length,viewports:sizes,errors},null,2));
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('Visual QA passed: 13 pages, mobile + desktop, no overflow, navigation and language checked.');
