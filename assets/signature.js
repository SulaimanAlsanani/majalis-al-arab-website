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
const update=()=>{
const en=document.documentElement.lang==='en';
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