# 🗺️ Leaflet.js + OpenStreetMap Setup Guide

## ✅ ข้อดีของการใช้ Leaflet

- **ฟรี 100%** - ไม่ต้องใช้ API Key
- **ไม่ต้องผูกบัตร** - ไม่มีค่าใช้จ่ายแฝง
- **Open Source** - ชุมชนใหญ่ รองรับดี
- **เบาและเร็ว** - โหลดเร็วกว่า Google Maps
- **Privacy-friendly** - ไม่ติดตามผู้ใช้

---

## 📋 สิ่งที่ต้องทำ

### 1. ตั้งค่าพิกัดร้านค้า

เปิดไฟล์ `leaflet-maps.js` และแก้ไขพิกัดร้านของคุณ:

```javascript
// บรรทัด 13-17
const SHOP_LOCATION = {
  lat: 13.7563,  // ← ใส่ละติจูดร้านคุณ
  lng: 100.5018  // ← ใส่ลองจิจูดร้านคุณ
};
```

**วิธีหาพิกัด:**
1. เปิด [OpenStreetMap.org](https://www.openstreetmap.org/)
2. ค้นหาตำแหน่งร้านคุณ
3. คลิกขวาที่ตำแหน่ง → จะเห็นพิกัด
4. หรือดูที่ URL หลังจากค้นหา
5. คัดลอกตัวเลข (เช่น 13.7563, 100.5018)

---

### 2. อัพเดท Apps Script

1. เปิด Google Apps Script ของคุณ
2. แทนที่โค้ดทั้งหมดด้วยเนื้อหาจาก `apps-script-updated.gs`
3. แก้ไขพิกัดร้านค้าในส่วน:

```javascript
const SHOP_LOCATION = {
  lat: 13.7563,  // ← พิกัดร้านคุณ
  lng: 100.5018,
  name: "เอาหยังบ่",
  address: "กรุงเทพมหานคร"
};
```

4. บันทึกและ Deploy ใหม่

---

### 3. ใช้งานไฟล์ HTML

ใช้ไฟล์ `index-with-member-leaflet.html` แทนไฟล์เดิม

หรือถ้าต้องการใช้ไฟล์เดิม ให้เพิ่ม:

```html
<!-- ใน <head> -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- ก่อนปิด </body> -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="leaflet-maps.js"></script>
```

---

## 🎯 ฟีเจอร์ที่ได้

### หน้า "เกี่ยวกับเรา"
- ✅ แสดงแผนที่ร้านค้า (OpenStreetMap)
- ✅ ปุ่ม "นำทางไปยังร้าน" เปิด Google Maps สำหรับนำทาง

### หน้า "ตำแหน่ง" (ใหม่)
- ✅ แผนที่ให้ลูกค้าปักหมุดตำแหน่งจัดส่ง
- ✅ ลากหมุดหรือคลิกเพื่อระบุตำแหน่ง
- ✅ แสดงพิกัด GPS และที่อยู่ (ผ่าน Nominatim API)
- ✅ บันทึกตำแหน่งสำหรับออเดอร์

### ระบบออเดอร์
- ✅ ส่งพิกัดลูกค้าไปกับออเดอร์
- ✅ แสดงลิงก์ Google Maps ในข้อความ LINE
- ✅ บันทึกพิกัดลง Google Sheets

---

## 📊 Google Sheets ที่สร้างอัตโนมัติ

ชีทใหม่ที่จะถูกสร้าง:

### "ตำแหน่งลูกค้า"
| วันที่ | เบอร์โทร | ชื่อ | ละติจูด | ลองจิจูด | ที่อยู่ | Google Maps Link |
|--------|---------|------|---------|----------|--------|------------------|

### "ออเดอร์" (อัพเดท)
เพิ่มคอลัมน์:
- ละติจูด
- ลองจิจูด
- ที่อยู่
- Google Maps Link

---

## 🔧 การใช้งาน

### สำหรับลูกค้า:
1. เปิดเว็บ → หน้า "📍 ตำแหน่ง"
2. ลากหมุดไปยังจุดที่ต้องการจัดส่ง
3. กด "บันทึกตำแหน่ง"
4. สั่งซื้อตามปกติ → ตำแหน่งจะส่งไปกับออเดอร์

### สำหรับร้านค้า:
1. เปิด LINE จะเห็นข้อความออเดอร์พร้อมลิงก์ Maps
2. เปิด Google Sheets ดูชีท "ตำแหน่งลูกค้า" หรือ "ออเดอร์"
3. คลิกลิงก์ Google Maps เพื่อดูตำแหน่ง

---

## 🌍 Reverse Geocoding (แปลงพิกัดเป็นที่อยู่)

ใช้ **Nominatim API** จาก OpenStreetMap:

```javascript
fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
```

**ข้อจำกัด:**
- ฟรี แต่มี rate limit (1 request/วินาที)
- ห้ามใช้สำหรับ batch processing
- ต้องมี User-Agent header (Leaflet จัดการให้)

---

## 🎨 Custom Marker Style

ในไฟล์ `leaflet-maps.js` สามารถปรับสไตล์หมุดได้:

```javascript
const markerIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #e74c3c; ..."></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});
```

เปลี่ยนสีโดยแก้ `background-color`

---

## 📱 Responsive

แผนที่ปรับขนาดอัตโนมัติตามหน้าจอ:
- Desktop: 400px (shop), 300px (delivery)
- Mobile: 300px ทั้งคู่

---

## 🔗 ลิงก์ที่เป็นประโยชน์

- [Leaflet.js Documentation](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim Reverse Geocoding](https://nominatim.org/release-docs/develop/api/Reverse/)
- [Leaflet Marker Examples](https://leafletjs.com/examples/custom-markers/)

---

## ⚠️ หมายเหตุ

1. **Geolocation:** บราวเซอร์จะขอ permission ใช้ตำแหน่งผู้ใช้
2. **HTTPS:** Geolocation ทำงานเฉพาะบน HTTPS (หรือ localhost)
3. **Fallback:** ถ้าผู้ใช้ปฏิเสธ permission จะใช้พิกัดร้านเป็นค่าเริ่มต้น

---

## 🎉 เสร็จแล้ว!

ไม่ต้องตั้งค่าอะไรเพิ่ม เปิดไฟล์ HTML และใช้งานได้เลย!

---

**สร้างโดย:** mogkuu 🦊
**วันที่:** 2026-03-24
**เวอร์ชัน:** Leaflet.js 1.9.4
