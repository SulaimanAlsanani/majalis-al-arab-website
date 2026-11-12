(()=>{'use strict';
const translated=[...document.querySelectorAll('[data-ar][data-en]')];
const btn=document.querySelector('#langBtn'),menuBtn=document.querySelector('#menuBtn'),menu=document.querySelector('#navlinks');
const themes=['heritage','sand','noir'];
const read=(k)=>{try{return localStorage.getItem(k)}catch(_){return null}};
const write=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};
let lang='ar';
function setLang(v){if(!['ar','en'].includes(v))return;lang=v;document.documentElement.lang=v;document.documentElement.dir=v==='ar'?'rtl':'ltr';document.body.classList.toggle('en',v==='en');translated.forEach(el=>{el.textContent=el.dataset[v]});if(btn)btn.textContent=v==='ar'?'EN':'عربي';const heading=document.querySelector('h1');if(heading)document.title=heading.textContent+' | '+(v==='ar'?'مجالس العرب':'Majalis Al Arab');write('majalis-language',v)}
function close(){menu?.classList.remove('open');menuBtn?.setAttribute('aria-expanded','false')}
btn?.addEventListener('click',()=>setLang(lang==='ar'?'en':'ar'));
menuBtn?.addEventListener('click',()=>{const open=menu?.classList.toggle('open')||false;menuBtn.setAttribute('aria-expanded',String(open))});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('open')){close();menuBtn?.focus()}});
document.addEventListener('click',e=>{if(menu?.classList.contains('open')&&!menu.contains(e.target)&&!menuBtn?.contains(e.target))close()});
document.querySelectorAll('[data-set-theme]').forEach(b=>b.addEventListener('click',()=>{const theme=b.dataset.setTheme;if(themes.includes(theme)){document.body.dataset.theme=theme;write('majalis-theme',theme)}}));
const saved=read('majalis-theme');if(themes.includes(saved))document.body.dataset.theme=saved;
const businessDropdown=menu?.querySelector('.nav-dropdown');
document.addEventListener('click',event=>{if(businessDropdown?.open&&!businessDropdown.contains(event.target))businessDropdown.open=false});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&businessDropdown?.open){businessDropdown.open=false;businessDropdown.querySelector('summary')?.focus()}});
menu?.querySelectorAll('.nav-sub a').forEach(a=>a.addEventListener('click',()=>{if(businessDropdown)businessDropdown.open=false}));
setLang(read('majalis-language')==='en'?'en':'ar')
})();