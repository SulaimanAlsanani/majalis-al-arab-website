(()=>{'use strict';
const button=document.createElement('button');
button.type='button';
button.className='back-to-top';
button.setAttribute('aria-label','العودة إلى أعلى الصفحة');
button.setAttribute('title','العودة إلى أعلى الصفحة');
button.setAttribute('data-visible','false');
button.tabIndex=-1;
button.setAttribute('aria-hidden','true');
button.textContent='↑';
document.body.appendChild(button);
// One site-wide, accessible theme preference shared by every route.
const themeButtons=[...document.querySelectorAll('[data-set-theme]')];
const allowedThemes=new Set(['heritage','sand','noir']);
const themeNames={
  heritage:{ar:'الطابع التراثي الملكي',en:'Royal Heritage'},
  sand:{ar:'الطابع الرملي الدافئ',en:'Warm Sand'},
  noir:{ar:'الطابع الفحمي البرونزي',en:'Modern Noir'}
};
const readTheme=()=>{try{return localStorage.getItem('majalis-theme')}catch(_){return null}};
const applyTheme=(name,persist=false)=>{
  if(!allowedThemes.has(name))return;
  document.body.dataset.theme=name;
  const colors={heritage:'#172d27',sand:'#4a382b',noir:'#252725'};
  const browserChrome=document.querySelector('meta[name="theme-color"]');
  if(browserChrome)browserChrome.setAttribute('content',colors[name]);
  themeButtons.forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.setTheme===name)));
  if(persist){try{localStorage.setItem('majalis-theme',name)}catch(_){}}
};
const savedTheme=readTheme();
applyTheme(allowedThemes.has(savedTheme)?savedTheme:'heritage');
themeButtons.forEach(item=>item.addEventListener('click',()=>applyTheme(item.dataset.setTheme,true)));
const update=()=>{
const en=document.documentElement.lang==='en';
// Dynamic ARIA names follow the actual language of the visible interface.
const nav=document.getElementById('navlinks');
if(nav)nav.setAttribute('aria-label',en?'Main navigation':'القائمة الرئيسية');
const catalogFilters=document.getElementById('filters');
if(catalogFilters)catalogFilters.setAttribute('aria-label',en?'Product category filters':'تصنيفات المنتجات');
const faqFilters=document.getElementById('faqFilters');
if(faqFilters)faqFilters.setAttribute('aria-label',en?'FAQ categories':'تصنيفات الأسئلة الشائعة');
themeButtons.forEach(item=>{
  const label=themeNames[item.dataset.setTheme]?.[en?'en':'ar'];
  if(label){item.setAttribute('aria-label',label);item.title=label;}
});
const label=en?'Back to top':'العودة إلى أعلى الصفحة';
const skip=document.querySelector('a.skip[href="#main"]');
if(skip)skip.textContent=en?'Skip to main content':'تجاوز إلى المحتوى';
button.setAttribute('aria-label',label);button.title=label;
const visible=window.scrollY>650;
button.dataset.visible=String(visible);
button.tabIndex=visible?0:-1;
button.setAttribute('aria-hidden',String(!visible));
const langButton=document.getElementById('langBtn');
if(langButton){const visible=langButton.textContent.trim();langButton.setAttribute('aria-label',en?`${visible} — Switch to Arabic`:`${visible} — Switch to English`)}
const menuButton=document.getElementById('menuBtn');
if(menuButton){menuButton.setAttribute('aria-label',en?'Toggle navigation menu':'فتح أو إغلاق القائمة الرئيسية');menuButton.setAttribute('aria-controls','navlinks')}
};
button.addEventListener('click',()=>{
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  document.getElementById('main')?.focus({preventScroll:true});
});
window.addEventListener('scroll',update,{passive:true});
const observer=new MutationObserver(update);
observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
update();
})();