/* 501LIVE – offline application shell. Does NOT queue match results. */
const CACHE = '501live-shell-2026-11-15-v1';
const SHELL = ['/', '/index.html',
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'];
self.addEventListener('install', event => {
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.allSettled(SHELL.map(async url=>{
   const response=await fetch(url,{cache:'reload'});
   if(response.ok || response.type==='opaque') await cache.put(url,response);
  }));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys()) if(key.startsWith('501live-shell-') && key!==CACHE) await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET') return;
 const url=new URL(req.url);
 // Never cache API/auth/DB requests.
 if(url.hostname.includes('supabase.co') || url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return;
 const isShell=(url.origin===self.location.origin && (url.pathname==='/' || url.pathname==='/index.html'));
 const isDependency=(url.hostname==='cdn.jsdelivr.net' && url.pathname.startsWith('/npm/@supabase/supabase-js@2')) ||
  (url.hostname==='cdnjs.cloudflare.com' && url.pathname==='/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
 if(!isShell && !isDependency) return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(req);
   if(response.ok) await cache.put(req,response.clone());
   return response;
  }catch(err){
   const saved=await cache.match(req,{ignoreSearch:isShell});
   if(saved)return saved;
   if(isShell){const fallback=await cache.match('/index.html');if(fallback)return fallback;}
   throw err;
  }
 })());
});
