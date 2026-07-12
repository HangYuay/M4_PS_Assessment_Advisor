const CACHE = 'ps-m4-v3';
const BASE = '/M4_PS_Assessment_Advisor';

// Assets ที่ cache ไว้ (ไม่รวม index.html — ใช้ network-first แทน)
const STATIC_ASSETS = [
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
  BASE + '/icons/icon-180.png',
  BASE + '/apple-touch-icon.png',
  BASE + '/logoPsพื้นใส-01 (1).png',
  BASE + '/PS_Sttudy_Programs/Slide10.jpeg',
  BASE + '/PS_Sttudy_Programs/Slide11.jpeg',
  BASE + '/PS_Sttudy_Programs/Slide12.jpeg',
  BASE + '/PS_Sttudy_Programs/Slide13.jpeg',
  BASE + '/PS_Sttudy_Programs/Slide15.jpeg',
];

// รับคำสั่ง SKIP_WAITING จาก app เมื่อผู้ใช้กด "อัปเดตเลย"
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network-first สำหรับ HTML — ดึงเวอร์ชั่นใหม่จาก server เสมอ
  if (e.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // อัปเดต cache ด้วยเวอร์ชั่นล่าสุด
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // fallback เมื่อ offline
    );
    return;
  }

  // Cache-first สำหรับ assets (รูปภาพ, manifest, icons)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
