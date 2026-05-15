// ============================================================
// Service Worker — เอาหยังบ่
// ============================================================
// เปลี่ยนเลข version เมื่อไหร่ก็ตามที่อัปเดตไฟล์
// เพื่อให้ผู้ใช้ได้รับโค้ดใหม่อัตโนมัติ
// ============================================================

const CACHE_VERSION = 'v3';
const CACHE_NAME    = `aoyangbor-cache-${CACHE_VERSION}`;

// ไฟล์ที่ cache ไว้ใช้ตอน offline
const STATIC_ASSETS = [
  '/index.html',
  '/merchant.html',
  '/rider.html',
  '/admin.html',
  '/manifest.json',
  '/merchant-manifest.json',
  '/sw.js'
];

// CDN ที่ cache ไว้ด้วย (fonts + icons)
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Itim&display=swap',
  'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// URL ที่ไม่ cache — Apps Script ต้องดึงข้อมูลสดเสมอ
const NO_CACHE_PATTERNS = [
  'script.google.com',
  'googleapis.com/macros'
];

// ============================================================
// INSTALL — cache ไฟล์ทั้งหมด
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // cache static assets ก่อน (ต้องสำเร็จทุกไฟล์)
      return cache.addAll(STATIC_ASSETS)
        .then(() => {
          // cache CDN assets แยก (ถ้า fail ไม่หยุด install)
          return Promise.allSettled(
            CDN_ASSETS.map(url => cache.add(url).catch(() => {}))
          );
        });
    }).then(() => self.skipWaiting()) // activate ทันทีไม่รอ tab เก่าปิด
  );
});

// ============================================================
// ACTIVATE — ลบ cache version เก่าออก
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('aoyangbor-cache-') && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] ลบ cache เก่า:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim()) // ควบคุม tab ที่เปิดอยู่ทันที
  );
});

// ============================================================
// FETCH — กลยุทธ์การดึงข้อมูล
// ============================================================
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Apps Script / Google API → ดึงสดเสมอ ไม่ cache
  if (NO_CACHE_PATTERNS.some(pattern => url.includes(pattern))) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'offline', message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 2. HTML pages → Network First (ได้ไฟล์ใหม่เสมอ, fallback ไป cache ถ้า offline)
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // อัปเดต cache ด้วยเวอร์ชันใหม่
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)
          .then(cached => cached || offlinePage())
        )
    );
    return;
  }

  // 3. ทรัพยากรอื่น (CSS, JS, fonts, images) → Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      // ไม่มีใน cache → ดึงจาก network แล้ว cache ไว้
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => new Response('', { status: 503 }));
    })
  );
});

// ============================================================
// OFFLINE PAGE — แสดงเมื่อไม่มี cache และออฟไลน์
// ============================================================
function offlinePage() {
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>เอาหยังบ่ — ออฟไลน์</title>
  <style>
    body { font-family: 'Itim', cursive, sans-serif; background: #fdfbf7; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; padding: 40px 30px; background: white; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 320px; width: 90%; }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    h2 { color: #2c3e50; margin-bottom: 10px; font-size: 1.4rem; }
    p { color: #888; font-size: 1rem; line-height: 1.6; margin-bottom: 24px; }
    button { padding: 12px 28px; background: #2c3e50; color: white; border: none; border-radius: 12px; font-size: 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">📡</div>
    <h2>ไม่มีการเชื่อมต่อ</h2>
    <p>กรุณาตรวจสอบอินเทอร์เน็ต<br>แล้วลองใหม่อีกครั้งค่ะ</p>
    <button onclick="location.reload()">ลองใหม่</button>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ============================================================
// MESSAGE — รับคำสั่งจาก app (เช่น force update)
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.source.postMessage('CACHE_CLEARED');
    });
  }
});
