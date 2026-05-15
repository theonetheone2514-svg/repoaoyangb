# 🗺️ Google Maps Pinning Setup Guide

## Overview
เพิ่มฟีเจอร์ปักหมุดตำแหน่งใน Google Maps สำหรับร้านค้าและตำแหน่งจัดส่งลูกค้า

---

## 📋 สิ่งที่ต้องทำ

### 1. ขอ Google Maps API Key

1. ไปที่: https://console.cloud.google.com/
2. สร้างโปรเจกต์ใหม่ (หรือใช้โปรเจกต์ที่มี)
3. เปิดใช้งาน API:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API** (ถ้าต้องการ)
4. สร้าง Credentials → API Key
5. คัดลอก API Key

⚠️ **สำคัญ:** ตั้งค่า_quota และ billing limit เพื่อป้องกันค่าใช้จ่ายเกิน

---

### 2. แก้ไขไฟล์ HTML

เปิดไฟล์ `index-with-member-updated.html` และหาบรรทัดนี้:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
```

เปลี่ยน `YOUR_GOOGLE_MAPS_API_KEY` เป็น API Key ของคุณ

---

### 3. ตั้งค่าพิกัดร้านค้า

ในไฟล์ `maps-integration.js` แก้ไขพิกัดร้านค้าของคุณ:

```javascript
// บรรทัดที่ 9-10
const shopLocation = { lat: 13.7563, lng: 100.5018 }; // ← เปลี่ยนเป็นพิกัดร้านคุณ
```

**วิธีหาพิกัด:**
1. เปิด Google Maps
2. คลิกขวาที่ตำแหน่งร้านคุณ
3. คัดลอกตัวเลข (เช่น 13.7563, 100.5018)
4. วางในโค้ด

---

### 4. อัพเดท Apps Script

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

4. บันทึกและ Deploy ใหม่ (ถ้าจำเป็น)

---

### 5. รวมไฟล์ JavaScript

ในไฟล์ HTML ให้เพิ่ม script tag ก่อนปิด `</body>`:

```html
<script src="maps-integration.js"></script>
```

และเปลี่ยนฟังก์ชัน `sendOrder()` เป็น `sendOrderWithLocation()` ในปุ่มสั่งซื้อ:

```html
<button class="confirm-btn" id="confirmBtn" onclick="sendOrderWithLocation()">
```

---

## 🎯 ฟีเจอร์ที่ได้

### หน้า "เกี่ยวกับเรา"
- ✅ แสดงแผนที่ร้านค้า
- ✅ ปุ่ม "นำทางไปยังร้าน" เปิด Google Maps

### หน้า "ตำแหน่ง" (ใหม่)
- ✅ แผนที่ให้ลูกค้าปักหมุดตำแหน่งจัดส่ง
- ✅ ลากหมุดหรือคลิกเพื่อระบุตำแหน่ง
- ✅ แสดงที่อยู่โดยอัตโนมัติ (Reverse Geocoding)
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

## ⚠️ หมายเหตุสำคัญ

1. **API Key ต้องเปิดใช้งาน:**
   - Maps JavaScript API
   - Geocoding API

2. **Billing:** Google Maps มีฟรี tier (200$/เดือน) แต่ต้องผูกบัตร

3. **ทางเลือกฟรี:** ถ้าไม่ต้องการใช้ API Key:
   - ใช้ iframe embed แทน (แต่ไม่มี reverse geocoding)
   - หรือให้ลูกค้ากรอกที่อยู่เอง

4. **Security:** จำกัด API Key ด้วย HTTP referrers

---

## 📞 ติดต่อสอบถาม

หากมีปัญหาในการตั้งค่า:
- ตรวจสอบ Console (F12) สำหรับ error
- ตรวจสอบว่า API Key ถูกต้อง
- ตรวจสอบว่าเปิดใช้งาน API แล้ว

---

**สร้างโดย:** mogkuu 🦊
**วันที่:** 2026-03-24
