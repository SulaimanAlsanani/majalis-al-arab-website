(()=>{'use strict';
const translations=[...document.querySelectorAll('[data-ar][data-en]')];
const languageButton=document.getElementById('langBtn');
const menuButton=document.getElementById('menuBtn');
const menu=document.getElementById('navlinks');
const originalCanonical=document.querySelector('link[rel="canonical"]')?.href||location.origin+location.pathname;
const updateSeoLanguage=value=>{
 const canonical=document.querySelector('link[rel="canonical"]');
 const target=value==='en'?originalCanonical+(originalCanonical.includes('?')?'&':'?')+'lang=en':originalCanonical;
 if(canonical)canonical.href=target;
 const socialUrl=document.querySelector('meta[property="og:url"]');
 if(socialUrl)socialUrl.content=target;
 const socialLocale=document.querySelector('meta[property="og:locale"]');
 if(socialLocale)socialLocale.content=value==='en'?'en_US':'ar_SA';
};
const read=(key)=>{try{return localStorage.getItem(key)}catch(_){return null}};
const save=(key,value)=>{try{localStorage.setItem(key,value)}catch(_){}};
let language='ar';
const closeMenu=()=>{if(!menu||!menuButton)return;menu.classList.remove('open');menuButton.setAttribute('aria-expanded','false')};
const setLanguage=(value)=>{if(!['ar','en'].includes(value))return;language=value;document.documentElement.lang=value;document.documentElement.dir=value==='ar'?'rtl':'ltr';document.body.classList.toggle('en',value==='en');translations.forEach(element=>{const t=element.dataset[value];if(t!==undefined)element.innerHTML=t});if(languageButton)languageButton.textContent=value==='ar'?'EN':'عربي';document.title=value==='ar'?'مجالس العرب | أصالة الضيافة وروعة اللقاء':'Majalis Al Arab | Authentic Hospitality';updateSeoLanguage(value);save('majalis-language',value);const status=document.getElementById('status');if(status)status.textContent=''};
const updateLanguageUrl=()=>{
 const url=new URL(location.href);
 if(language==='en')url.searchParams.set('lang','en');else url.searchParams.delete('lang');
 history.replaceState(null,'',url.pathname+url.search+url.hash);
};
languageButton?.addEventListener('click',()=>{setLanguage(language==='ar'?'en':'ar');updateLanguageUrl()});
menuButton?.addEventListener('click',()=>{const active=menu?.classList.toggle('open')||false;menuButton.setAttribute('aria-expanded',String(active))});
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.classList.contains('open')){closeMenu();menuButton?.focus()}});
document.addEventListener('click',event=>{if(menu?.classList.contains('open')&&!menu.contains(event.target)&&!menuButton?.contains(event.target))closeMenu()});
const form=document.getElementById('contactForm');
const enquiryStatus=document.getElementById('status');
const getEnquiry=()=>{
 const ids=['name','contactMethod','type','message'];
 const labels=language==='ar'?['الاسم','وسيلة التواصل','نوع الاستفسار','الرسالة']:['Name','Contact','Enquiry type','Message'];
 return ids.map((id,index)=>{
  const field=document.getElementById(id);
  const value=id==='type'?(field?.selectedOptions[0]?.text||''):(field?.value||'').trim();
  return `${labels[index]}: ${value}`;
 }).join('\n');
};
const nameField=document.getElementById('name');
const contactField=document.getElementById('contactMethod');
const messageField=document.getElementById('message');
const requiredFields=[nameField,contactField,messageField].filter(Boolean);
requiredFields.forEach(field=>field.addEventListener('input',()=>{
 field.setCustomValidity('');
 field.removeAttribute('aria-invalid');
 if(enquiryStatus)enquiryStatus.textContent='';
}));
const valid=()=>{
 if(!form)return false;
 requiredFields.forEach(field=>{field.setCustomValidity('');field.removeAttribute('aria-invalid')});
 const ar=language==='ar';
 if(!nameField?.value.trim())
  nameField?.setCustomValidity(ar?'أدخل الاسم.':'Enter your name.');
 const contact=contactField?.value.trim()||'';
 if(contact){
  const email=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/u.test(contact);
  const digits=(contact.match(/[0-9\\u0660-\\u0669\\u06f0-\\u06f9]/gu)||[]).length;
  const phone=/^\\+?[0-9\\u0660-\\u0669\\u06f0-\\u06f9\\s().-]+$/u.test(contact)&&digits>=7&&digits<=15;
  if(!email&&!phone)contactField?.setCustomValidity(ar?'أدخل بريدًا إلكترونيًا صالحًا أو رقم هاتف من 7 إلى 15 رقمًا.':'Enter a valid email address or a phone number with 7–15 digits.');
 }else contactField?.setCustomValidity(ar?'أدخل البريد الإلكتروني أو رقم الهاتف.':'Enter an email address or phone number.');
 if(!messageField?.value.trim())
  messageField?.setCustomValidity(ar?'اكتب نص الاستفسار.':'Enter your enquiry message.');
 const result=form.reportValidity();
 if(!result){
  requiredFields.forEach(field=>{if(!field.validity.valid)field.setAttribute('aria-invalid','true')});
  if(enquiryStatus)enquiryStatus.textContent=ar?'تحقق من الحقول المطلوبة وصحة وسيلة التواصل. لم تُرسل أي بيانات.':'Check the required fields and contact details. No data has been sent.';
 }
 return result;
};
document.getElementById('clearEnquiry')?.addEventListener('click',()=>{
 form?.reset();
 requiredFields.forEach(field=>{field.setCustomValidity('');field.removeAttribute('aria-invalid')});
 if(enquiryStatus)enquiryStatus.textContent=language==='ar'?'تم مسح حقول النموذج من هذه الصفحة.':'Form fields cleared from this page.';
 nameField?.focus();
});
form?.addEventListener('submit',async event=>{event.preventDefault();if(!valid())return;try{await navigator.clipboard.writeText(getEnquiry());if(enquiryStatus)enquiryStatus.textContent=language==='ar'?'تم نسخ الاستفسار إلى الحافظة، ولم تُرسل بياناتك إلى أي خادم.':'Enquiry copied to the clipboard. No data has been sent to a server.'}catch(_){if(enquiryStatus)enquiryStatus.textContent=language==='ar'?'تعذر النسخ تلقائيًا. يمكنك تنزيله كملف نصي.':'Automatic copy is unavailable. You can download a text file instead.'}});
document.getElementById('downloadEnquiry')?.addEventListener('click',()=>{if(!valid())return;const blob=new Blob(['\uFEFF'+getEnquiry()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='majalis-al-arab-enquiry.txt';document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);if(enquiryStatus)enquiryStatus.textContent=language==='ar'?'تم إنشاء ملف الاستفسار على جهازك. لم تُرسل البيانات إلى خادم.':'Your enquiry file was created on this device. Nothing was sent to a server.'});
const businessDropdown=menu?.querySelector('.nav-dropdown');
document.addEventListener('click',event=>{if(businessDropdown?.open&&!businessDropdown.contains(event.target))businessDropdown.open=false});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&businessDropdown?.open){businessDropdown.open=false;businessDropdown.querySelector('summary')?.focus()}});
menu?.querySelectorAll('.nav-sub a').forEach(a=>a.addEventListener('click',()=>{if(businessDropdown)businessDropdown.open=false}));
const requestedLanguage=new URL(location.href).searchParams.get('lang');
setLanguage(['ar','en'].includes(requestedLanguage)?requestedLanguage:(read('majalis-language')==='en'?'en':'ar'));
})();