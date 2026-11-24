/* Local storefront preview. The demo never creates an order in Odoo or reserves a table. */
const PREVIEW_EXPERIENCE_KEY = 'majalis_preview_experience_v1';
const PREVIEW_DISCOUNT_CODE = 'MAJALIS10';
const PREVIEW_GUEST_LIMIT = 20;
const DRINK_CATEGORIES = ['القهوة المختصة', 'المشروبات', 'الحلا'];
const storedExperience = readPreviewExperience();
let previewOrderTab = 'current';
let previewPayment = 'pickup';
const PREVIEW_PAYMENT_LABELS = {pickup:'عند الاستلام', card:'مدى (محاكاة)', apple:'Apple Pay (محاكاة)'};

function readPreviewExperience() {
  try {
    const data = JSON.parse(localStorage.getItem(PREVIEW_EXPERIENCE_KEY));
    if (data && Array.isArray(data.orders) && Array.isArray(data.addresses)) return data;
  } catch {}
  return {orders: [], addresses: [], coupon: false, booking: null};
}

function storePreviewExperience() {
  try {
    localStorage.setItem(PREVIEW_EXPERIENCE_KEY, JSON.stringify(storedExperience));
    return true;
  } catch {
    notify('حفظ المعاينة على هذا الجهاز غير متاح. ستبقى التغييرات حتى إغلاق الصفحة.');
    return false;
  }
}

function previewEnabled() {
  return !approvedCatalog && !catalogLoading;
}

function orderingServiceBar() {
  return '<section class="experience-panel service-bar" aria-label="الفرع وطريقة الطلب">'+
    '<div><strong>'+PREVIEW_PICKUP_BRANCH+'</strong><p>'+escapeHtml(modeText())+'</p></div>'+
    '<div class="experience-actions" role="group" aria-label="طريقة استلام الطلب">'+
      ['pickup','delivery'].map(mode=>'<button type="button" class="outlined" data-service-mode="'+mode+'" aria-pressed="'+(state.fulfillment===mode)+'">'+(mode==='pickup'?'استلام من الفرع':'توصيل')+'</button>').join('')+
    '</div></section>';
}

function previewDiscount(subtotal = total()) {
  return previewEnabled() && storedExperience.coupon ? Math.round(subtotal * 10) / 100 : 0;
}

function checkoutOfferForm() {
  if (!previewEnabled()) return '';
  return '<form id="previewCouponForm" class="experience-form"><label for="previewCoupon">رمز الخصم التجريبي</label><div class="experience-actions">'+
    '<input id="previewCoupon" name="code" dir="ltr" maxlength="20" autocomplete="off" value="'+(storedExperience.coupon?PREVIEW_DISCOUNT_CODE:'')+'">'+
    '<button class="outlined" type="submit">تطبيق</button>'+
    (storedExperience.coupon?'<button class="outlined" type="button" data-experience="remove-coupon">إزالة</button>':'')+
    '</div><small>جرّب '+PREVIEW_DISCOUNT_CODE+' لمعاينة خصم 10٪ على الأصناف.</small></form>';
}

function previewOrderStatuses(order) {
  return order.mode === 'delivery'
    ? ['استُلِم الطلب','قيد التجهيز','خرج للتوصيل','تم التسليم']
    : ['استُلِم الطلب','قيد التجهيز','جاهز للاستلام','تم الاستلام'];
}

function previewPaymentOptions() {
  if (!previewEnabled()) return '';
  const paymentOptions = Object.entries(PREVIEW_PAYMENT_LABELS);
  return '<div class="experience-form"><label for="previewPayment">طريقة الدفع في المعاينة</label><select id="previewPayment">'+
    paymentOptions.map(([value,label])=>'<option value="'+value+'"'+(previewPayment===value?' selected':'')+'>'+label+'</option>').join('')+
    '</select><small>لا يُحصّل مبلغ ولا تُطلب بيانات البطاقة.</small></div>';
}

function savePreviewOrder() {
  if (!previewEnabled() || el('checkoutPreview')?.hidden !== false || !state.cart.length) return;
  const items = cartDetails();
  if (!items.length) return;
  const subtotal = total();
  const order = {
    id: 'MX-' + Date.now().toString(36).toUpperCase(),
    mode: state.fulfillment,
    status: 0,
    payment: previewPayment,
    items,
    total: subtotal - previewDiscount(subtotal)
  };
  storedExperience.orders = [order, ...storedExperience.orders].slice(0, 20);
  state.cart = [];
  state.generalNote = '';
  state.checkout = {coords:null, addressText:''};
  state.customer.phone = '';
  storedExperience.coupon = false;
  previewPayment = 'pickup';
  storePreviewExperience();
  save();
  previewOrderTab = 'current';
  route('/orders');
}

function previewOrderCard(order) {
  const statuses = previewOrderStatuses(order);
  return '<article class="experience-panel preview-order-card">'+
    '<div class="experience-heading"><h2 dir="ltr">'+escapeHtml(order.id)+'</h2><span>'+escapeHtml(statuses[order.status]||statuses[0])+'</span></div>'+
    '<p>'+(order.mode==='delivery'?'توصيل تجريبي':'استلام تجريبي من فرع أبها')+' · '+money(order.total)+' · '+escapeHtml(PREVIEW_PAYMENT_LABELS[order.payment]||'معاينة الدفع')+'</p>'+
    '<ol class="preview-statuses" aria-label="حالة الطلب التجريبي">'+statuses.map((label,index)=>'<li'+(order.status===index?' aria-current="step"':'')+'>'+label+'</li>').join('')+'</ol>'+
    '<ul class="preview-order-items">'+order.items.map(item=>'<li>'+escapeHtml(item.name)+' × '+item.qty+(item.note?' <small>· '+escapeHtml(item.note)+'</small>':'')+'</li>').join('')+'</ul>'+
    '<div class="experience-actions">'+
    (order.status<3?'<button type="button" class="outlined" data-experience="advance" data-id="'+escapeHtml(order.id)+'">محاكاة المرحلة التالية</button>':'')+
    '<button type="button" class="solid-action" data-experience="reorder" data-id="'+escapeHtml(order.id)+'">أعد الطلب</button>'+
    '</div></article>';
}

function renderPreviewOrders() {
  const orders = storedExperience.orders.filter(order => previewOrderTab==='current' ? order.status<3 : order.status===3);
  el('app').innerHTML = commonPageHead('معاينة المتجر','طلباتي','السجل محفوظ على هذا الجهاز ويعرض محاكاة لحالات الطلب.')+
    '<div class="experience-actions order-view-switch" role="group" aria-label="عرض الطلبات">'+
    '<button type="button" class="outlined" data-experience="orders-current" aria-pressed="'+(previewOrderTab==='current')+'">الطلبات الحالية</button>'+
    '<button type="button" class="outlined" data-experience="orders-previous" aria-pressed="'+(previewOrderTab==='previous')+'">الطلبات السابقة</button></div>'+
    (orders.length?'<div class="experience-stack">'+orders.map(previewOrderCard).join('')+'</div>':
    '<div class="experience-panel"><p>لا توجد طلبات في هذه القائمة.</p><button class="solid-action" data-go="/menu">تصفّح المنيو</button></div>');
}

function reorderPreview(order) {
  if (!previewEnabled()) {
    notify('إعادة الطلب التجريبي متاحة في وضع المعاينة.');
    return;
  }
  const restored = normalizeSavedCart(order.items);
  const lines = normalizeSavedCart([...state.cart, ...restored]);
  if (!restored.length) {
    notify('الأصناف محفوظة في السجل لكنها غير متاحة في القائمة الحالية.');
    return;
  }
  state.cart = lines;
  save();
  route('/cart');
  const changed = restored.reduce((sum,item)=>sum+item.qty,0) !== order.items.reduce((sum,item)=>sum+item.qty,0);
  notify(changed?'أضيفت الأصناف المتوفرة بأسعار القائمة الحالية.':'أضيفت الأصناف إلى سلتك بأسعار القائمة الحالية، بحد 99 قطعة لكل صنف وملاحظة.');
}

function savedAddressOptions() {
  if (!storedExperience.addresses.length) return '';
  return '<label class="experience-saved-address">عنوان محفوظ<select id="previewSavedAddress"><option value="">اختر عنوانًا محفوظًا</option>'+
    storedExperience.addresses.map(address=>'<option value="'+escapeHtml(address.id)+'">'+escapeHtml(address.label)+'</option>').join('')+
    '</select></label>';
}

function renderPreviewAddresses() {
  el('app').innerHTML = commonPageHead('حسابي','عناويني','احفظ عنوانًا لاستخدامه في المعاينة على هذا الجهاز.')+
    '<div class="experience-stack">'+storedExperience.addresses.map(address=>'<article class="experience-panel"><div class="experience-heading">'+
    '<h2>'+escapeHtml(address.label)+'</h2><button class="outlined" data-experience="remove-address" data-id="'+escapeHtml(address.id)+'">حذف</button>'+
    '</div><p>'+escapeHtml(address.value)+'</p></article>').join('')+
    '<form id="previewAddressForm" class="experience-panel experience-form"><h2>أضف عنوانًا</h2>'+
    '<label>اسم العنوان<input name="label" maxlength="40" placeholder="البيت أو العمل" required></label>'+
    '<label>العنوان<textarea name="address" maxlength="250" rows="3" placeholder="المدينة، الحي، الشارع ورقم المبنى" required></textarea></label>'+
    '<button class="solid-action" type="submit">حفظ على هذا الجهاز</button></form></div>';
}

function riyadhToday() {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}

function renderSeatingPreview() {
  const draft = storedExperience.booking || {};
  const choices = PRODUCTS.filter(product=>product.available!==false && DRINK_CATEGORIES.includes(product.category)).slice(0,12);
  el('app').innerHTML = commonPageHead('ديوانية مجالس العرب','احجز جلسة وأضف ضيافتك','نسّق تفاصيل الجلسة والضيافة في مسودة واحدة للمعاينة.')+
    '<form id="previewBookingForm" class="experience-panel experience-form">'+
    '<div class="experience-field-grid">'+
    '<label>نوع الجلسة<select name="type"><option>جلسة خاصة</option><option>مشاهدة مباراة</option><option>بلايستيشن</option></select></label>'+
    '<label>عدد الضيوف<input name="guests" type="number" min="1" max="'+PREVIEW_GUEST_LIMIT+'" value="'+(draft.guests || 2)+'" required></label>'+
    '<label>تاريخ الجلسة<input name="date" type="date" min="'+riyadhToday()+'" value="'+escapeHtml(draft.date||'')+'" required></label>'+
    '<label>الوقت بتوقيت السعودية<input name="time" type="time" value="'+escapeHtml(draft.time||'')+'" required></label></div>'+
    '<label>الضيافة<select name="hospitality"><option value="">بدون إضافة</option>'+
      choices.map(p=>'<option value="'+p.id+'">'+escapeHtml(p.name)+' · '+money(p.price)+'</option>').join('')+'</select></label>'+
    '<button type="submit" class="solid-action">حفظ مسودة الجلسة</button></form>'+
    (draft.date?'<article class="experience-panel experience-booking-summary" aria-label="مسودة الجلسة"><h2>مسودة جلستك</h2><p>'+
    escapeHtml(draft.type)+' · '+draft.guests+' ضيوف · '+escapeHtml(draft.date)+' · '+escapeHtml(draft.time)+'</p>'+
    (draft.hospitality?'<p>الضيافة · '+escapeHtml(draft.hospitality)+'</p>':'')+
    '<p>يؤكد الفرع التوفر والتكلفة.</p><a class="outlined" target="_blank" rel="noopener noreferrer" href="https://wa.me/966549792477?text='+encodeURIComponent(
    'مرحبًا، أود الاستفسار عن توفر '+draft.type+' لـ'+draft.guests+' ضيوف يوم '+draft.date+' الساعة '+draft.time+(draft.hospitality?' مع '+draft.hospitality:'')
    )+'">الاستفسار من الفرع عبر واتساب</a></article>':'');
  const bookingForm=el('previewBookingForm');
  if (draft.type) bookingForm.elements.type.value=draft.type;
  if (draft.hospitalityId && choices.some(product=>product.id===draft.hospitalityId)) bookingForm.elements.hospitality.value=draft.hospitalityId;
}

document.addEventListener('click', event => {
  const serviceMode = event.target.closest('[data-service-mode]');
  if (serviceMode) {
    state.fulfillment = serviceMode.dataset.serviceMode;
    const panel = serviceMode.closest('.service-bar');
    panel.outerHTML = orderingServiceBar();
    document.querySelector('[data-service-mode][aria-pressed="true"]')?.focus({preventScroll:true});
    return;
  }
  const button = event.target.closest('[data-experience]');
  if (!button) return;
  const action = button.dataset.experience;
  if (action==='save-order') savePreviewOrder();
  if (action==='orders-current'||action==='orders-previous') {
    previewOrderTab = action.split('-')[1];
    renderPreviewOrders();
    updateCounts();
    document.querySelector('[data-experience="'+action+'"]')?.focus({preventScroll:true});
  }
  if (action==='advance'||action==='reorder') {
    const order = storedExperience.orders.find(item=>item.id===button.dataset.id);
    if (!order) return;
    if (action==='reorder') reorderPreview(order);
    else if (order.status<3) {
      order.status += 1;
      storePreviewExperience();
      renderPreviewOrders();
      updateCounts();
    }
  }
  if (action==='remove-address') {
    storedExperience.addresses = storedExperience.addresses.filter(address=>address.id!==button.dataset.id);
    storePreviewExperience();
    renderPreviewAddresses();
    updateCounts();
  }
  if (action==='remove-coupon') {
    storedExperience.coupon = false;
    storePreviewExperience();
    checkoutPage();
    updateCounts();
    el('previewCoupon')?.focus();
  }
});

document.addEventListener('change', event => {
  if (event.target.id==='previewPayment') {
    previewPayment=event.target.value;
    closeCheckoutPreview();
    return;
  }
  if (event.target.id!=='previewSavedAddress'||!event.target.value) return;
  const saved = storedExperience.addresses.find(address=>address.id===event.target.value);
  if (!saved) return;
  state.checkout.addressText=saved.value;
  el('checkoutAddress').value=saved.value;
  clearCheckoutFeedback();
  closeCheckoutPreview();
});

document.addEventListener('submit', event => {
  const form = event.target;
  if (!['previewCouponForm','previewAddressForm','previewBookingForm'].includes(form.id)) return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.id==='previewCouponForm') {
    if (!previewEnabled()) return;
    if (data.get('code').trim().toUpperCase()!==PREVIEW_DISCOUNT_CODE) {
      notify('رمز الخصم التجريبي غير صحيح.');
      el('previewCoupon').focus();
      return;
    }
    storedExperience.coupon=true;
    storePreviewExperience();
    checkoutPage();
    updateCounts();
    notify('تم تطبيق الخصم التجريبي.');
    el('previewCoupon')?.focus();
  } else if (form.id==='previewAddressForm') {
    const label=data.get('label').trim().slice(0,40), value=data.get('address').trim().slice(0,250);
    if (!label||!value) { notify('أدخل اسم العنوان وتفاصيله.'); return; }
    storedExperience.addresses=[{id:String(Date.now()),label,value}, ...storedExperience.addresses].slice(0,8);
    storePreviewExperience();
    renderPreviewAddresses();
    updateCounts();
  } else {
    if (data.get('date')<riyadhToday()) { notify('اختر تاريخ اليوم أو يومًا لاحقًا.'); return; }
    const product=productById(data.get('hospitality'));
    storedExperience.booking={
      type:data.get('type'), guests:Number(data.get('guests')), date:data.get('date'), time:data.get('time'),
      hospitalityId:product?.id||null, hospitality:product?.name||''
    };
    storePreviewExperience();
    renderSeatingPreview();
    updateCounts();
    document.querySelector('.experience-booking-summary')?.scrollIntoView({block:'nearest'});
  }
});
