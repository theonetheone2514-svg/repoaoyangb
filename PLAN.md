# 📋 แผนการพัฒนาโปรเจกต์: เอาหยังบ่ (Ao-Yang-Bor)
**สถานะโครงการ:** กำลังพัฒนา (In Development)
**เป้าหมาย:** ระบบสั่งอาหารและส่งอาหารท้องถิ่นแบบ Low-cost โดยใช้ Google Apps Script และ PWA

---

## ✅ สิ่งที่ทำสำเร็จแล้ว (Completed)
- [x] **Rider Module:**
    - ระบบ Login ด้วยเบอร์โทรศัพท์ (แก้ไข Syntax Error เรื่อง Backticks แล้ว)
    - ระบบดึงข้อมูลไรเดอร์และรายได้สะสม
    - ระบบรับงาน (`acceptJob`) และจำกัดงานสูงสุด 3 งาน
    - ระบบแจ้งเตือนเมื่อถึงจุดส่ง (`markAsArrived`) อัปเดตสถานะเป็น 'กำลังส่งมอบ'
    - ระบบยืนยันการรับเงินและปิดงาน (`completeJob`) คำนวณรายได้แบบ Dynamic: ค่าส่ง + 20% ของ Markup (15%)
- [x] **PWA Upgrade:**
    - ติดตั้ง `manifest.json` และลงทะเบียน `sw.js` (Service Worker) ในทุกหน้า (`index`, `merchant`, `admin`, `rider`)
    - รองรับการ "Install App" ลงบนหน้าจอมือถือ
- [x] **System Optimization:**
    - ตั้งค่า Auto-Refresh ทุก 30 วินาทีสำหรับหน้าไรเดอร์และร้านค้า
    - จัดการ CORS Policy โดยแนะนำการใช้ Live Server ในการพัฒนา
- [x] **Backend (GAS):**
    - วางโครงสร้าง API ใน `doGet` และ `doPost`
    - เชื่อมต่อกับ Google Sheets (ชีท ออเดอร์, ไรเดอร์, สมาชิก, Stores)

---

## ⏳ สิ่งที่ต้องทำต่อ (Next Steps)
- [ ] **Visual & Asset Upgrade:** 
    - จัดหารูปภาพประกอบเมนูอาหาร (แนะนำถ่ายรูปจริง + ลบพื้นหลัง หรือใช้ AI Generate)
    - ปรับแต่ง UI/UX ให้มีความเป็น "Isan Mood & Tone" มากขึ้น
- [ ] **End-to-End Testing:**
    - ทดสอบ Flow ทั้งหมด: ลูกค้าสั่ง $\rightarrow$ ร้านค้าได้รับ/ปรุง $\rightarrow$ ไรเดอร์รับงาน $\rightarrow$ ไรเดอร์ส่ง $\rightarrow$ ปิดงานรับเงิน
- [ ] **Admin Control Center:**
    - ตรวจสอบความสมบูรณ์ของหน้า `admin.html` ในการตั้งค่าค่าส่งและ Markup
- [ ] **Deployment:**
    - ย้ายจาก Local (Live Server) ไปยัง Hosting จริง (เช่น Netlify หรือ Vercel) เพื่อการใช้งานจริงของไรเดอร์และลูกค้า

---

## 📝 บันทึกเพิ่มเติม (Notes)
- **SOP:** เมื่อมีการแก้ไขโค้ดใน `.gs` ต้องทำการ Deploy เป็น `New Version` ทุกครั้งเพื่อให้หน้าเว็บเห็นการเปลี่ยนแปลง
- **Rider Earnings:** ค่าส่ง 15 บาท (ไรเดอร์ได้ 12, แอดมินได้ 3)
- **Product Markup:** +15% ของราคาสินค้า
