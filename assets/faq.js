(()=>{'use strict';
const search=document.getElementById('faqSearch');
const filters=[...document.querySelectorAll('[data-faq-filter]')];
const entries=[...document.querySelectorAll('.faq-item[data-faq-category]')];
const empty=document.getElementById('faqEmpty');
const count=document.getElementById('faqResultCount');
const reset=document.getElementById('faqReset');
if(!search||!entries.length)return;
const allowed=new Set(['all','locations','services','products','contact']);
const normalize=text=>String(text||'').normalize('NFKC').toLocaleLowerCase().replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').trim();
const params=new URL(location.href).searchParams;
let category=allowed.has(params.get('category'))?params.get('category'):'all';
search.value=(params.get('q')||'').slice(0,120);
function syncUrl(){
 const u=new URL(location.href);
 if(search.value.trim())u.searchParams.set('q',search.value.trim());else u.searchParams.delete('q');
 if(category!=='all')u.searchParams.set('category',category);else u.searchParams.delete('category');
 history.replaceState(null,'',u.pathname+u.search+u.hash);
}
function display(sync=false){
 const query=normalize(search.value);
 let visible=0;
 for(const entry of entries){
  const haystack=[...entry.querySelectorAll('[data-ar][data-en]')].map(el=>el.dataset.ar+' '+el.dataset.en).join(' ');
  const match=(category==='all'||entry.dataset.faqCategory===category)&&(!query||normalize(haystack).includes(query));
  entry.hidden=!match;
  if(!match)entry.open=false;
  if(match)visible++;
 }
 if(empty)empty.hidden=visible!==0;
 if(count){const en=document.documentElement.lang==='en';count.textContent=en?`${visible} of ${entries.length} answers shown`:`عرض ${visible} من ${entries.length} إجابات`;}
 search.placeholder=document.documentElement.lang==='en'?search.dataset.placeholderEn:search.dataset.placeholderAr;
 for(const item of filters)item.setAttribute('aria-pressed',String(item.dataset.faqFilter===category));
 if(reset)reset.disabled=!query&&category==='all';
 if(sync)syncUrl();
}
search.addEventListener('input',()=>display(true));
filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.faqFilter;display(true)}));
reset?.addEventListener('click',()=>{search.value='';category='all';display(true);search.focus()});
const observer=new MutationObserver(()=>display(false));
observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.addEventListener('popstate',()=>{const p=new URL(location.href).searchParams;search.value=(p.get('q')||'').slice(0,120);category=allowed.has(p.get('category'))?p.get('category'):'all';display(false)});
display(false);
})();