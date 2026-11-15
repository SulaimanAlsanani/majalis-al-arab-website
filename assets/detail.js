(()=>{'use strict';
const translated=[...document.querySelectorAll('[data-ar][data-en]')];
const btn=document.querySelector('#langBtn'),menuBtn=document.querySelector('#menuBtn'),menu=document.querySelector('#navlinks');
const originalCanonical=document.querySelector('link[rel="canonical"]')?.href||location.origin+location.pathname;
const arabicMetaDescription=document.querySelector('meta[name="description"]')?.content||'';
const arabicSocialDescription=document.querySelector('meta[property="og:description"]')?.content||'';
const updateSeoLanguage=value=>{
 const canonical=document.querySelector('link[rel="canonical"]');
 const target=value==='en'?originalCanonical+(originalCanonical.includes('?')?'&':'?')+'lang=en':originalCanonical;
 if(canonical)canonical.href=target;
 const socialUrl=document.querySelector('meta[property="og:url"]');
 if(socialUrl)socialUrl.content=target;
 const socialLocale=document.querySelector('meta[property="og:locale"]');
 if(socialLocale)socialLocale.content=value==='en'?'en_US':'ar_SA';
 const socialTitle=document.querySelector('meta[property="og:title"]');
 if(socialTitle)socialTitle.content=document.title;
 const description=document.querySelector('meta[name="description"]');
 const socialDescription=document.querySelector('meta[property="og:description"]');
 const englishText=document.querySelector('main p[data-en]')?.dataset.en?.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,160);
 if(description)description.content=value==='en'?(englishText||arabicMetaDescription):arabicMetaDescription;
 if(socialDescription)socialDescription.content=value==='en'?(englishText||arabicSocialDescription):arabicSocialDescription;

};
const read=(k)=>{try{return localStorage.getItem(k)}catch(_){return null}};
const write=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};
let lang='ar';
function setLang(v){if(!['ar','en'].includes(v))return;lang=v;document.documentElement.lang=v;document.documentElement.dir=v==='ar'?'rtl':'ltr';document.body.classList.toggle('en',v==='en');translated.forEach(el=>{el.textContent=el.dataset[v]});if(btn)btn.textContent=v==='ar'?'EN':'عربي';const heading=document.querySelector('h1');if(heading)document.title=heading.textContent+' | '+(v==='ar'?'مجالس العرب':'Majalis Al Arab');updateSeoLanguage(v);write('majalis-language',v)}
function close(){menu?.classList.remove('open');menuBtn?.setAttribute('aria-expanded','false')}
function updateLanguageUrl(){
 const url=new URL(location.href);
 if(lang==='en')url.searchParams.set('lang','en');else url.searchParams.delete('lang');
 history.replaceState(null,'',url.pathname+url.search+url.hash);
}
btn?.addEventListener('click',()=>{setLang(lang==='ar'?'en':'ar');updateLanguageUrl()});
menuBtn?.addEventListener('click',()=>{const open=menu?.classList.toggle('open')||false;menuBtn.setAttribute('aria-expanded',String(open))});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('open')){close();menuBtn?.focus()}});
document.addEventListener('click',e=>{if(menu?.classList.contains('open')&&!menu.contains(e.target)&&!menuBtn?.contains(e.target))close()});
const businessDropdown=menu?.querySelector('.nav-dropdown');
document.addEventListener('click',event=>{if(businessDropdown?.open&&!businessDropdown.contains(event.target))businessDropdown.open=false});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&businessDropdown?.open){businessDropdown.open=false;businessDropdown.querySelector('summary')?.focus()}});
menu?.querySelectorAll('.nav-sub a').forEach(a=>a.addEventListener('click',()=>{if(businessDropdown)businessDropdown.open=false}));
const requestedLanguage=new URL(location.href).searchParams.get('lang');
setLang(['ar','en'].includes(requestedLanguage)?requestedLanguage:(read('majalis-language')==='en'?'en':'ar'))
})();