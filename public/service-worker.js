// Remove old offline copies containing school data. Version 39 requires the server.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('bilal-'))await caches.delete(key);await self.clients.claim();await self.registration.unregister();})()));
