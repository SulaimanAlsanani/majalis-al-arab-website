(()=>{'use strict';
const search=document.querySelector('#search');
const buttons=[...document.querySelectorAll('[data-filter]')];
const cards=[...document.querySelectorAll('.catalog-card')];
const empty=document.querySelector('#emptyResults');
const count=document.querySelector('#catalogResultCount');
const reset=document.querySelector('#catalogReset');
if(!search||!cards.length)return;
const allowed=new Set(['all','beverages','food','herbs']);
const normalise=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').trim();
const url=new URL(location.href);
let filter=allowed.has(url.searchParams.get('category'))?url.searchParams.get('category'):'all';
search.value=(url.searchParams.get('q')||'').slice(0,120);
function syncUrl(){
 const u=new URL(location.href);
 if(search.value.trim())u.searchParams.set('q',search.value.trim());else u.searchParams.delete('q');
 if(filter!=='all')u.searchParams.set('category',filter);else u.searchParams.delete('category');
 history.replaceState(null,'',u.pathname+u.search+u.hash);
}
function update(sync=false){
 const q=normalise(search.value),isEn=document.documentElement.lang==='en';
 let visible=0;
 for(const card of cards){
  const text=normalise((card.dataset.nameAr||'')+' '+(card.dataset.nameEn||'')+' '+[...card.querySelectorAll('[data-ar][data-en]')].map(e=>e.dataset.ar+' '+e.dataset.en).join(' '));
  const match=(filter==='all'||card.dataset.category===filter)&&(!q||text.includes(q));
  card.hidden=!match;
  if(match)visible++;
 }
 if(empty)empty.hidden=visible>0;
 if(count)count.textContent=isEn?`${visible} of ${cards.length} categories shown`:`عرض ${visible} من ${cards.length} تصنيفات`;
 search.placeholder=isEn?search.dataset.placeholderEn:search.dataset.placeholderAr;
 buttons.forEach(button=>{
  const active=button.dataset.filter===filter;
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
 });
 if(reset)reset.disabled=!q&&filter==='all';
 if(sync)syncUrl();
}
search.addEventListener('input',()=>update(true));
buttons.forEach(button=>button.addEventListener('click',()=>{
 const value=button.dataset.filter;if(!allowed.has(value))return;
 filter=value;update(true);
}));
reset?.addEventListener('click',()=>{
 search.value='';filter='all';update(true);search.focus();
});
const observer=new MutationObserver(()=>update(false));
observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.addEventListener('popstate',()=>{
 const u=new URL(location.href);
 filter=allowed.has(u.searchParams.get('category'))?u.searchParams.get('category'):'all';
 search.value=(u.searchParams.get('q')||'').slice(0,120);
 update(false);
});
update(false);
})();