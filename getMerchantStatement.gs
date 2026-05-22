// ============================================
// ฟังก์ชันดึงข้อมูล Statement ของร้านค้า
// ============================================
function getMerchantStatement(e) {
  try {
    const storeId = e.parameter?.storeId;
    const dateStr = e.parameter?.date; // รูปแบบ YYYY-MM-DD
    
    if (!dateStr) {
      return jsonResponse({ 
        success: false, 
        message: "กรุณาเลือกวันที่" 
      });
    }
    
    // แปลงวันที่จาก string เป็น Date object
    const selectedDate = new Date(dateStr);
    if (isNaN(selectedDate.getTime())) {
      return jsonResponse({ 
        success: false, 
        message: "รูปแบบวันที่ไม่ถูกต้อง" 
      });
    }
    
    // ตั้งค่าเวลาเป็น 00:00:00 ของวันนั้น
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
    // สิ้นสุดวันคือ 23:59:59.999
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);
    
    // ดึงข้อมูลจากชีท "ออเดอร์"
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ออเดอร์');
    
    if (!sheet) {
      return jsonResponse({ 
        success: false, 
        message: "ไม่พบชีทข้อมูลออเดอร์" 
      });
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0]; // แถวแรกเป็นหัวตาราง
    
    // หาตำแหน่งคอลัมน์ที่ต้องการ
    const dateColIndex = headers.indexOf('วันที่');
    const itemsColIndex = headers.indexOf('รายการ');
    const totalColIndex = headers.indexOf('ยอดรวม');
    const statusColIndex = headers.indexOf('สถานะ');
    
    if (dateColIndex === -1 || itemsColIndex === -1 || totalColIndex === -1) {
      return jsonResponse({ 
        success: false, 
        message: "โครงสร้างชีทออเดอร์ไม่ถูกต้อง" 
      });
    }
    
    // กรองข้อมูลตามวันที่
    const filteredData = [];
    let grossTotal = 0;
    let netTotal = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowDate = row[dateColIndex];
      
      // ตรวจสอบว่าเป็นวันที่ถูกต้องและอยู่ในช่วงที่ต้องการ
      if (rowDate instanceof Date) {
        const rowTime = rowDate.getTime();
        if (rowTime >= startOfDay.getTime() && rowTime <= endOfDay.getTime()) {
          // แปลงข้อมูลเป็นรูปแบบที่ต้องการ
          const items = row[itemsColIndex] || 'ไม่ระบุ';
          const totalPrice = parseFloat(row[totalColIndex]) || 0;
          const status = row[statusColIndex] || '';
          
            // คำนวณยอดสุทธิ (หักค่าธรรมเนียม 15% จากค่าอาหารเท่านั้น ไม่รวมค่าส่ง)
            var deliveryFee = getDeliveryFee();
            var foodPrice = Math.max(0, totalPrice - deliveryFee);
            var netIncome = foodPrice * 0.85 + deliveryFee;
            
            grossTotal += totalPrice;
            netTotal += netIncome;
            
            filteredData.push({
              time: rowDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              items: items,
              foodPrice: foodPrice,
              deliveryFee: deliveryFee,
              netIncome: netIncome,
              status: status
            });
          }
        }
      }
    
    // ส่งข้อมูลกลับ
    return jsonResponse({
      success: true,
      data: filteredData,
      summary: {
        gross: grossTotal,
        net: netTotal,
        fee: grossTotal - netTotal // ค่าธรรมเนียม 15%
      }
    });
    
  } catch (err) {
    console.log("getMerchantStatement error:", err);
    return jsonResponse({ 
      success: false, 
      message: err.toString() 
    });
  }
}

// === การนำไปใช้ใน doGet ===
// ต้องเพิ่ม action ใน doGet และ import ฟังก์ชัน getDeliveryFee() จาก apps-script-updated.gs
// (หรือก็อป getSetting / getSettingsSheet / getDeliveryFee มาไว้ในไฟล์นี้ด้วย)
//
// function doGet(e) {
//   const action = e.parameter?.action;
//   
//   // ... ส่วนที่มีอยู่เดิม ...
//   
//   // ดึงข้อมูล Statement ของร้านค้า
//   if (action === 'getMerchantStatement') {
//     return getMerchantStatement(e);
//   }
//   if (action === 'getSettings') {
//     return getSettings();  // อยู่ใน apps-script-updated.gs
//   }
//   // ... ส่วนที่เหลือ ...
// }
//   
//   // ... ส่วนที่เหลือ ...
// }