import lighthouse from 'lighthouse';
import { launch as launchChrome } from 'chrome-launcher';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const origin=(process.env.SITE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const enforceBudgets=process.env.LIGHTHOUSE_ENFORCE_BUDGETS!=='0';
const scenarios=[
  {name:'home-mobile',path:'/index.html',formFactor:'mobile'},
  {name:'home-desktop',path:'/index.html',formFactor:'desktop'},
  {name:'catalog-mobile',path:'/catalog.html',formFactor:'mobile'},
];
await mkdir('performance-reports',{recursive:true});
const results=[];
for(const scenario of scenarios){
 const desktop=scenario.formFactor==='desktop';
 const chrome=await launchChrome({
  chromePath:chromium.executablePath(),
  chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage'],
  port:0
 });
 try{
  const config={extends:'lighthouse:default',settings:{
    formFactor:desktop?'desktop':'mobile',
    screenEmulation:desktop?{mobile:false,width:1440,height:900,deviceScaleFactor:1,disabled:false}:{mobile:true,width:390,height:844,deviceScaleFactor:1,disabled:false},
    throttlingMethod:'simulate',
    onlyCategories:['performance','accessibility','best-practices','seo']
  }};
  const result=await lighthouse(origin+scenario.path,{port:chrome.port,output:'json',logLevel:'error'},config);
  if(!result?.lhr)throw new Error('Lighthouse failed to produce a report for '+scenario.name);
  const lhr=result.lhr;
  const categories=Object.fromEntries(Object.entries(lhr.categories).map(([key,value])=>[key,Math.round((value.score??0)*100)]));
  const metrics={};
  for(const [label,id] of [['fcp','first-contentful-paint'],['lcp','largest-contentful-paint'],['cls','cumulative-layout-shift'],['tbt','total-blocking-time']])metrics[label]={displayValue:lhr.audits[id]?.displayValue,value:lhr.audits[id]?.numericValue};
  const topIssues=Object.values(lhr.audits)
    .filter(a=>a.score!==null&&a.score!==undefined&&a.score<.9&&a.details?.type==='opportunity')
    .map(a=>({title:a.title,displayValue:a.displayValue,score:a.score}))
    .sort((a,b)=>a.score-b.score).slice(0,10);
  results.push({name:scenario.name,url:origin+scenario.path,categories,metrics,topIssues});
  await writeFile('performance-reports/'+scenario.name+'.json',JSON.stringify(lhr));
  console.log(scenario.name,JSON.stringify({categories,metrics,topIssues}));
 }finally{await chrome.kill()}
}
await writeFile('performance-reports/summary.json',JSON.stringify({measuredAt:new Date().toISOString(),results},null,2));
// Conservative guardrails catch meaningful regressions without expecting stable 100s.
const minimums={
 'home-mobile':{performance:70,accessibility:92,'best-practices':95,seo:95},
 'home-desktop':{performance:60,accessibility:92,'best-practices':95,seo:95},
 'catalog-mobile':{performance:75,accessibility:95,'best-practices':95,seo:95}
};
const failures=[];
for(const result of results){
 const limits=minimums[result.name];
 for(const [metric,min] of Object.entries(limits)){
  const measured=result.categories[metric];
  if(measured<min)failures.push(`${result.name}: ${metric}=${measured} (minimum ${min})`);
 }
}
if(enforceBudgets&&failures.length){
 console.error('Lighthouse performance budget regressions:\n'+failures.join('\n'));
 process.exitCode=1;
}else console.log(enforceBudgets?'Lighthouse regression budgets passed for all three scenarios.':'Live website audit complete (informational; no lab score thresholds applied).');
