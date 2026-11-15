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
   if(pathname==='404.html'){
    const base=await page.evaluate(()=>document.baseURI);
    if(base!=='https://sulaimanalsanani.github.io/majalis-al-arab-website/')
     errors.push(`${size.name}: 404 base URL does not support unknown nested routes`);
   }
   if(result.scrollWidth>result.viewport+2)errors.push(`${size.name}: horizontal overflow on ${pathname}: ${result.scrollWidth} > ${result.viewport}`);
   if(result.h1!==1||!result.nav||!result.footer||!result.signature||!result.backButton)errors.push(`${size.name}: missing page landmarks in ${pathname}`);
   if(pathname!=='404.html'){
     const seo=await page.evaluate(()=>({
       canonical:document.querySelector('link[rel="canonical"]')?.href,
       alternates:[...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(el=>({lang:el.hreflang,href:el.href}))
     }));
     const canonical='https://sulaimanalsanani.github.io/majalis-al-arab-website/'+(pathname==='index.html'?'':pathname);
     if(seo.canonical!==canonical||seo.alternates.length!==3||
       !seo.alternates.some(el=>el.lang==='ar-SA'&&el.href===canonical)||
       !seo.alternates.some(el=>el.lang==='en'&&el.href===canonical+'?lang=en')||
       !seo.alternates.some(el=>el.lang==='x-default'&&el.href===canonical)){
       errors.push(`${size.name}: bilingual SEO alternate tags are inconsistent on ${pathname}`);
     }
   }

   if(pathname==='index.html'){
     const cards=await page.locator('.editorial-businesses .editorial-card-photo').evaluateAll(images=>images.map(img=>({loading:img.loading,decoding:img.decoding,width:img.width,height:img.height,alt:img.alt,sizes:img.sizes,srcset:img.srcset})));
     if(cards.length!==2||cards.some(img=>img.loading!=='lazy'||img.decoding!=='async'||img.width===0||img.height===0||img.alt!==''||!img.sizes.includes('370px')||!img.srcset.includes('480w')||!img.srcset.includes('800w')||!img.srcset.includes('1200w')))
       errors.push(`${size.name}: editorial photo lazy loading or reserved image geometry is missing`);
   }


   const access=await page.evaluate(()=>({
    skip:!!document.querySelector('a.skip[href="#main"]'),
    navLabel:document.querySelector('#navlinks')?.getAttribute('aria-label'),
    catalogFilterLabel:document.querySelector('#filters')?.getAttribute('aria-label'),
    faqFilterLabel:document.querySelector('#faqFilters')?.getAttribute('aria-label'),
    mainFocus:document.querySelector('#main')?.getAttribute('tabindex'),
    fontRequest:[...document.querySelectorAll('link[href*="fonts.googleapis.com/css2"]')].map(el=>el.href)
   }));
   if(!access.skip||access.mainFocus!=='-1')errors.push(`${size.name}: skip/main keyboard access is missing on ${pathname}`);
   if(access.navLabel!=='القائمة الرئيسية')errors.push(`${size.name}: Arabic navigation landmark label is incorrect on ${pathname}`);
   if(pathname==='catalog.html'&&access.catalogFilterLabel!=='تصنيفات المنتجات')errors.push(`${size.name}: catalog filters lack Arabic accessible group label`);
   if(pathname==='faq.html'&&access.faqFilterLabel!=='تصنيفات الأسئلة الشائعة')errors.push(`${size.name}: FAQ filters lack Arabic accessible group label`);
   if(access.fontRequest.some(url=>url.includes('DM+Sans')))errors.push(`${size.name}: duplicate external web font on ${pathname}`);

   if(['index.html','catalog.html','restaurant.html'].includes(pathname)){
    await page.screenshot({path:`visual-artifacts/${pathname.replace('.html','')}-${size.name}.png`,fullPage:true,animations:'disabled'});
   }
  }
  await page.goto(`${origin}/index.html`,{waitUntil:'domcontentloaded'});
  const initiallyHidden=await page.locator('.back-to-top').evaluate(el=>({tabIndex:el.tabIndex,ariaHidden:el.getAttribute('aria-hidden')}));
  if(initiallyHidden.tabIndex!==-1||initiallyHidden.ariaHidden!=='true')errors.push(`${size.name}: hidden back-to-top is reachable by keyboard or accessibility tree`);
  if(await page.locator('#menuBtn').getAttribute('aria-controls')!=='navlinks')errors.push(`${size.name}: menu toggle missing aria-controls reference`);
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
  const visibleState=await page.locator('.back-to-top').evaluate(el=>({tabIndex:el.tabIndex,ariaHidden:el.getAttribute('aria-hidden')}));
  if(visibleState.tabIndex!==0||visibleState.ariaHidden!=='false')errors.push(`${size.name}: visible back-to-top cannot be reached by keyboard`);
  await page.locator('.back-to-top').click();
  if(await page.evaluate(()=>document.activeElement?.id)!=='main')errors.push(`${size.name}: back-to-top did not return focus to main content`);
  await page.waitForTimeout(600);
  if(await page.evaluate(()=>window.scrollY)>800)errors.push(`${size.name}: back-to-top did not scroll upwards`);
  await page.locator('#langBtn').click();
  const lng=await page.locator('html').getAttribute('lang');
  if(lng!=='en')errors.push(`${size.name}: language switching failed`);
  const englishSeo=await page.evaluate(()=>({
    canonical:document.querySelector('link[rel="canonical"]')?.href,
    locale:document.querySelector('meta[property="og:locale"]')?.content,
    title:document.querySelector('meta[property="og:title"]')?.content,
    summary:document.querySelector('meta[name="description"]')?.content,
    socialSummary:document.querySelector('meta[property="og:description"]')?.content
  }));
  if(!englishSeo.canonical?.endsWith('?lang=en')||englishSeo.locale!=='en_US'||
     !englishSeo.title?.includes('Majalis Al Arab')||
     !englishSeo.summary?.includes('Saudi')||
     englishSeo.summary!==englishSeo.socialSummary)
    errors.push(`${size.name}: English canonical, title or social description is inconsistent`);

  if(await page.locator('#navlinks').getAttribute('aria-label')!=='Main navigation')errors.push(`${size.name}: navigation landmark did not change to English`);
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
  if(await page.locator('#filters').getAttribute('aria-label')!=='Product category filters')errors.push(`${size.name}: Catalog filter label did not change to English`);
  await page.locator('#catalogReset').click();
  if(await page.locator('.catalog-card:visible').count()!==6)
   errors.push(`${size.name}: catalog reset did not reveal all categories`);
  await page.locator('[data-filter="food"]').click();
  const foodRoute=await page.evaluate(()=>new URLSearchParams(location.search).get('category'));
  if(foodRoute!=='food'||await page.locator('.catalog-card:visible').count()!==2)
   errors.push(`${size.name}: catalog category filter or URL sync failed`);
  await page.goBack({waitUntil:'domcontentloaded'});
  if(new URL(page.url()).searchParams.has('category')||await page.locator('.catalog-card:visible').count()!==6)
   errors.push(`${size.name}: browser Back failed to restore previous Catalog filter`);
  await page.goForward({waitUntil:'domcontentloaded'});
  if(new URL(page.url()).searchParams.get('category')!=='food'||await page.locator('.catalog-card:visible').count()!==2)
   errors.push(`${size.name}: browser Forward failed to restore Catalog food category`);
  await page.locator('#catalogReset').click();
  await page.locator('#search').fill('قهوه');
  if(await page.locator('.catalog-card:visible').count()!==1)
   errors.push(`${size.name}: Arabic Catalog search should match قهوه with القهوة`);

  // FAQ filters must support direct links and a reversible reset.
  await page.goto(`${origin}/faq.html?category=locations`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(100);
  if(await page.locator('#faqFilters').getAttribute('aria-label')!=='FAQ categories')errors.push(`${size.name}: FAQ filter label did not change to English`);
  const faqLocationCount=await page.locator('.faq-item:visible').count();
  if(faqLocationCount!==2)errors.push(`${size.name}: FAQ direct filter expected two location questions, got ${faqLocationCount}`);
  await page.locator('#faqReset').click();
  if(await page.locator('.faq-item:visible').count()!==10)
   errors.push(`${size.name}: FAQ reset did not restore ten questions`);
  await page.locator('#faqSearch').fill('coffee');
  if(await page.locator('.faq-item:visible').count()===0)
   errors.push(`${size.name}: English FAQ search returned no coffee results`);
  await page.locator('[data-faq-filter="products"]').click();
  const productRoute=await page.evaluate(()=>new URLSearchParams(location.search).get('category'));
  if(productRoute!=='products')errors.push(`${size.name}: FAQ category selection missing from URL`);
  await page.goBack({waitUntil:'domcontentloaded'});
  if(new URL(page.url()).searchParams.get('category')!==null||new URL(page.url()).searchParams.get('q')!=='coffee')
   errors.push(`${size.name}: browser Back did not restore FAQ keyword-only search`);
  await page.goForward({waitUntil:'domcontentloaded'});
  if(new URL(page.url()).searchParams.get('category')!=='products')
   errors.push(`${size.name}: browser Forward did not restore FAQ product category`);
  await page.locator('#faqReset').click();
  await page.locator('#faqSearch').fill('قهوه');
  if(await page.locator('.faq-item:visible').count()===0)
   errors.push(`${size.name}: Arabic FAQ search should match قهوه with القهوة`);

  // Contact enquiry export must have human-readable field labels and stay local.
  await page.goto(`${origin}/index.html`,{waitUntil:'domcontentloaded'});
  await page.locator('#name').fill('Sample Visitor');
  await page.locator('#contactMethod').fill('example@example.com');
  await page.locator('#message').fill('Sample enquiry for a product');
  const enquiryFields=await page.evaluate(()=>({
    nameMax:document.querySelector('#name')?.maxLength,
    contactMax:document.querySelector('#contactMethod')?.maxLength,
    messageMax:document.querySelector('#message')?.maxLength,
    naturalDirection:['name','contactMethod','message'].every(id=>document.getElementById(id)?.getAttribute('dir')==='auto'),
    nameAutocomplete:document.querySelector('#name')?.getAttribute('autocomplete')
  }));
  if(enquiryFields.nameMax!==100||enquiryFields.contactMax!==160||enquiryFields.messageMax!==2000||!enquiryFields.naturalDirection||enquiryFields.nameAutocomplete!=='name')
   errors.push(`${size.name}: enquiry field length and bilingual typing settings are invalid`);
  await page.locator('#contactMethod').fill('invalid contact');
  await page.locator('#downloadEnquiry').click();
  if(await page.locator('#contactMethod').getAttribute('aria-invalid')!=='true')
   errors.push(`${size.name}: invalid email/phone was not rejected`);
  await page.locator('#contactMethod').fill('example@example.com');
  if(await page.locator('#contactMethod').getAttribute('aria-invalid')!==null)
   errors.push(`${size.name}: correcting contact details did not clear error state`);
  const [enquiryDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadEnquiry').click()]);
  const enquiryText=await fs.readFile(await enquiryDownload.path(),'utf8');
  if(!enquiryText.includes('Name: Sample Visitor')||!enquiryText.includes('Contact: example@example.com')||!enquiryText.includes('Message: Sample enquiry'))
   errors.push(`${size.name}: downloaded enquiry is missing readable English field labels`);
  if(!await page.locator('#status').textContent().then(text=>text.includes('Nothing was sent to a server.')))
   errors.push(`${size.name}: client-side contact download disclosure is missing`);
  await page.locator('#clearEnquiry').click();
  const cleared=await page.evaluate(()=>({
    name:document.getElementById('name').value,
    contact:document.getElementById('contactMethod').value,
    message:document.getElementById('message').value,
    active:document.activeElement?.id
  }));
  if(cleared.name||cleared.contact||cleared.message||cleared.active!=='name')
   errors.push(`${size.name}: clear form did not reset all fields and focus the name input`);
  if(!String(await page.locator('#status').textContent()).includes('Form fields cleared'))
   errors.push(`${size.name}: clear form confirmation is missing`);
  // Required fields must reject whitespace-only entries instead of exporting blanks.
  await page.locator('#name').fill('   ');
  await page.locator('#contactMethod').fill('support@example.com');
  await page.locator('#message').fill('   ');
  await page.locator('#downloadEnquiry').click();
  if(await page.locator('#name').getAttribute('aria-invalid')!=='true'||await page.locator('#message').getAttribute('aria-invalid')!=='true')
   errors.push(`${size.name}: whitespace-only enquiry fields were accepted`);
  // Arabic-Indic digits, RTL text, and the Arabic export must work together.
  await page.goto(`${origin}/index.html?lang=ar`,{waitUntil:'domcontentloaded'});
  await page.locator('#name').fill('أحمد');
  await page.locator('#contactMethod').fill('٠٥٠١٢٣٤٥٦٧');
  await page.locator('#message').fill('استفسار عن القهوة');
  const [arabicDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadEnquiry').click()]);
  const arabicEnquiry=await fs.readFile(await arabicDownload.path(),'utf8');
  if(!arabicEnquiry.includes('الاسم: أحمد')||!arabicEnquiry.includes('وسيلة التواصل: ٠٥٠١٢٣٤٥٦٧')||!arabicEnquiry.includes('الرسالة: استفسار عن القهوة'))
   errors.push(`${size.name}: Arabic phone enquiry download is missing expected data`);
  if(await page.locator('#contactMethod').getAttribute('aria-invalid')!==null)
   errors.push(`${size.name}: valid Arabic-Indic phone number was marked invalid`);

  // Theme selection must remain active and accessible after navigating between pages.
  await page.locator('[data-set-theme="sand"]').click();
  const selectedSand=await page.locator('[data-set-theme="sand"]').getAttribute('aria-pressed');
  if(selectedSand!=='true'||await page.locator('body').getAttribute('data-theme')!=='sand'||await page.locator('meta[name="theme-color"]').getAttribute('content')!=='#4a382b')
   errors.push(`${size.name}: Warm Sand theme and browser chrome color did not activate`);
  if(!String(await page.locator('[data-set-theme="sand"]').getAttribute('aria-label')).includes('Warm Sand'))
   errors.push(`${size.name}: theme accessible label does not match the current English language`);
  await page.goto(`${origin}/about.html`,{waitUntil:'domcontentloaded'});
  if(await page.locator('body').getAttribute('data-theme')!=='sand'||await page.locator('[data-set-theme="sand"]').getAttribute('aria-pressed')!=='true')
   errors.push(`${size.name}: selected theme did not persist to About page`);
  await page.locator('[data-set-theme="noir"]').click();
  await page.goto(`${origin}/catalog.html`,{waitUntil:'domcontentloaded'});
  if(await page.locator('body').getAttribute('data-theme')!=='noir'||await page.locator('meta[name="theme-color"]').getAttribute('content')!=='#252c2b')
   errors.push(`${size.name}: Modern Noir theme and browser chrome color did not persist to Catalog page`);
  await page.locator('[data-set-theme="heritage"]').click();
  if(await page.locator('[data-set-theme="heritage"]').getAttribute('aria-pressed')!=='true')
   errors.push(`${size.name}: returning to Royal Heritage did not update aria-pressed`);
  // URL language overrides stored preference and preserves search/filter parameters.
  await page.goto(`${origin}/about.html?lang=ar`,{waitUntil:'domcontentloaded'});
  if(await page.locator('html').getAttribute('lang')!=='ar'||await page.locator('html').getAttribute('dir')!=='rtl')
   errors.push(`${size.name}: explicit Arabic language deep link did not override saved English`);
  await page.goto(`${origin}/faq.html?category=products&lang=en`,{waitUntil:'domcontentloaded'});
  if(await page.locator('html').getAttribute('lang')!=='en'||await page.locator('html').getAttribute('dir')!=='ltr')
   errors.push(`${size.name}: English language deep link did not switch layout direction`);
  await page.locator('#langBtn').click();
  const localeUrl=new URL(page.url());
  if(localeUrl.searchParams.has('lang')||localeUrl.searchParams.get('category')!=='products'||await page.locator('html').getAttribute('lang')!=='ar')
   errors.push(`${size.name}: language toggle did not preserve FAQ filter URL and return to Arabic`);




  // Preferences can be removed without sending data to any server.
  await page.goto(`${origin}/privacy.html?lang=en`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-set-theme="sand"]').click();
  await page.locator('#clearPreferences').click();
  const preferences=await page.evaluate(()=>({
    locale:localStorage.getItem('majalis-language'),
    theme:localStorage.getItem('majalis-theme')
  }));
  if(preferences.locale!==null||preferences.theme!==null)
   errors.push(`${size.name}: clearing stored preferences did not remove language/theme keys`);
  if(!String(await page.locator('#clearPreferencesStatus').textContent()).includes('Saved preferences were cleared'))
   errors.push(`${size.name}: preference reset confirmation was not announced`);
  await page.goto(`${origin}/about.html`,{waitUntil:'domcontentloaded'});
  if(await page.locator('html').getAttribute('lang')!=='ar'||await page.locator('body').getAttribute('data-theme')!=='heritage')
   errors.push(`${size.name}: defaults were not restored after clearing site preferences`);

  await context.close();
 }
}finally{await browser.close()}
await fs.writeFile('visual-artifacts/qa-results.json',JSON.stringify({pages:pages.length,viewports:sizes,errors},null,2));
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('Visual QA passed: 14 pages, mobile + tablet + desktop, no overflow, navigation, catalog deep links, back-to-top and language checked.');
