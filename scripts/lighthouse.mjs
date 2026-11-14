import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const origin='http://127.0.0.1:4173';
const scenarios=[
  {name:'home-mobile',path:'/index.html',formFactor:'mobile'},
  {name:'home-desktop',path:'/index.html',formFactor:'desktop'},
  {name:'catalog-mobile',path:'/catalog.html',formFactor:'mobile'},
];
await mkdir('performance-reports',{recursive:true});
const results=[];
for(const scenario of scenarios){
 const desktop=scenario.formFactor==='desktop';
 const chrome=await chromeLauncher.launch({
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
// Informational baseline only; new thresholds should be set from observed results after first run.
