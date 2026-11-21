/**
 * Majalis Al Arab storefront API adapter.
 * No Odoo API keys, private credentials, payment credentials or demo prices are sent to a third party.
 * Production requires a separately deployed, authenticated server-side Odoo gateway.
 * All switches disabled by default. Merely including this file NEVER enables real orders or payments.
 */
(function(root){
  'use strict';
  const config=Object.freeze({
    enabled:false,
    apiBase:'',
    catalogEnabled:false,
    checkoutEnabled:false,
    ...((root.MAJALIS_STORE_CONFIG&&typeof root.MAJALIS_STORE_CONFIG==='object')?root.MAJALIS_STORE_CONFIG:{})
  });
  function endpoint(path){
    if(!config.enabled||!config.apiBase)throw new Error('ODDO_GATEWAY_NOT_CONFIGURED');
    const url=new URL(path,config.apiBase.endsWith('/')?config.apiBase:config.apiBase+'/');
    if(url.protocol!=='https:'&&url.hostname!=='localhost')throw new Error('GATEWAY_MUST_USE_HTTPS');
    return url;
  }
  async function request(path,options={}){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const res=await fetch(endpoint(path),{
        ...options,mode:'cors',credentials:'omit',redirect:'error',signal:controller.signal,
        headers:{Accept:'application/json',...(options.headers||{})}
      });
      if(!res.ok)throw new Error('GATEWAY_HTTP_'+res.status);
      const type=res.headers.get('content-type')||'';
      if(!type.includes('application/json'))throw new Error('GATEWAY_NOT_JSON');
      return await res.json();
    }finally{clearTimeout(timeout)}
  }
  const finitePrice=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<1000000;
  function normalizeProducts(items){
    if(!Array.isArray(items)||!items.length||items.length>5000)throw new Error('INVALID_CATALOG');
    const ids=new Set();
    return items.map(x=>{
      if(!x||!Number.isSafeInteger(x.id)||x.id<=0||ids.has(x.id)
        ||typeof x.name!=='string'||!x.name.trim()||x.name.length>160
        ||typeof x.category!=='string'||!x.category.trim()||x.category.length>100
        ||!finitePrice(x.price))throw new Error('INVALID_PRODUCT');
      ids.add(x.id);
      const url=(typeof x.image_url==='string'&&/^https:\/\//i.test(x.image_url))?x.image_url:null;
      return {id:x.id,name:x.name.trim(),category:x.category.trim(),price:x.price,
        imageUrl:url,photo:'photo-1547592180-85f173990554',
        demo:false,available:x.available===true,
        options:Array.isArray(x.options)?x.options:[]};
    });
  }
  async function fetchCatalog(){
    if(!config.enabled||!config.catalogEnabled)return null;
    const json=await request('api/storefront/v1/catalog');
    if(json?.source!=='odoo'||json?.currency!=='SAR'||json?.approved!==true)
      throw new Error('CATALOG_NOT_APPROVED');
    return {items:normalizeProducts(json.products),revision:String(json.revision||'')};
  }
  async function capabilities(){
    if(!config.enabled)return {catalog:false,orders:false,payment:false};
    const data=await request('api/storefront/v1/capabilities');
    return {catalog:data?.catalog===true,orders:data?.orders===true,payment:data?.payment===true};
  }
  async function quote(payload){
    if(!config.enabled||!config.checkoutEnabled)throw new Error('CHECKOUT_NOT_CONFIGURED');
    const caps=await capabilities();
    if(!caps.orders)throw new Error('ORDERS_NOT_ENABLED');
    return request('api/storefront/v1/quote',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
  }
  // The backend must create the order transactionally and return the payment-provider URL.
  // The static site must never treat a local cart total as authoritative.
  async function submitOrder(payload,quoteId,requestId){
    if(!config.enabled||!config.checkoutEnabled)throw new Error('CHECKOUT_NOT_CONFIGURED');
    const caps=await capabilities();
    if(!caps.orders||!caps.payment)throw new Error('PAYMENT_NOT_ENABLED');
    if(typeof quoteId!=='string'||!quoteId||typeof requestId!=='string'||!requestId)
      throw new Error('MISSING_QUOTE_OR_IDEMPOTENCY_KEY');
    return request('api/storefront/v1/orders',{
      method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestId},
      body:JSON.stringify({...payload,quote_id:quoteId})
    });
  }
  root.MajalisApi=Object.freeze({config,fetchCatalog,capabilities,quote,submitOrder});
})(window);
