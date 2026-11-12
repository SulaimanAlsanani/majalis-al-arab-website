(()=>{'use strict';
const search=document.getElementById('faqSearch');
const filters=[...document.querySelectorAll('[data-faq-filter]')];
const entries=[...document.querySelectorAll('.faq-item[data-faq-category]')];
const empty=document.getElementById('faqEmpty');
const count=document.getElementById('faqResultCount');
if(!search||!entries.length)return;
let category='all';
function normalize(text){return String(text||'').normalize('NFKC').toLocaleLowerCase().replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').trim()}
function display(){
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
if(count){const english=document.documentElement.lang==='en';count.textContent=english?visible+' of '+entries.length+' answers shown':'عرض '+visible+' من '+entries.length+' إجابات'}
search.placeholder=document.documentElement.lang==='en'?search.dataset.placeholderEn:search.dataset.placeholderAr;
}
search.addEventListener('input',display);
filters.forEach(button=>button.addEventListener('click',()=>{
category=button.dataset.faqFilter;
for(const item of filters)item.setAttribute('aria-pressed',String(item===button));
display();
}));
const observer=new MutationObserver(display);
observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
display();
})();