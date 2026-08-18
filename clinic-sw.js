self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let data={title:'מערכת המרפאה',body:'יש עדכון חדש במערכת'};
  try{data={...data,...event.data.json()}}catch{}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/clinic-app-icon.svg',badge:'/clinic-app-icon.svg',tag:data.tag||'clinic-push',data:data.data||{}}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{const list=await clients.matchAll({type:'window',includeUncontrolled:true});for(const c of list){if('focus'in c){await c.focus();return}}if(clients.openWindow)await clients.openWindow('/')} )());
});
