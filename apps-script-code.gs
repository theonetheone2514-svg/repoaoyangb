// ============================================
// ตั้งค่า LINE Notify Token ตรงนี้
// ============================================
const LINE_NOTIFY_TOKEN = "วาง_TOKEN_ของคุณตรงนี้"; 

// ============================================
// ดึงข้อมูลเมนู + รับออเดอร์ (GET)
// ============================================
function doGet(e) {
  // ✅ ถ้าเป็นการสั่งซื้อ (มี action=order)
  if (e.parameter && e.parameter.action === 'order') {
    return processOrder(e.parameter);
  }
  
  // ดึงข้อมูลเมนูปกติ
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    if(data[i][0] !== "") {
      result.push({
        name: data[i][0],
        price: data[i][1],
        img: data[i][2],
        category: data[i][4],
        stock: data[i][5]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// ฟังก์ชันตัดสต็อก (ใช้กับ GET)
// ============================================
function processOrder(params) {
  try {
    const customerName = params.customer || "ลูกค้า";
    const total = params.total || "0";
    const items = JSON.parse(params.items || "[]");
    
    // ตัดสต็อก
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const sheetData = sheet.getDataRange().getValues();
    
    if (items.length > 0) {
      items.forEach(orderItem => {
        for (let i = 1; i < sheetData.length; i++) {
          if (sheetData[i][0] === orderItem.name) {
            let currentStock = sheetData[i][5];
            let newStock = currentStock - orderItem.qty;
            sheet.getRange(i + 1, 6).setValue(newStock);
            break;
          }
        }
      });
    }
    
    // ส่ง LINE
    const msg = `🔔 มีออเดอร์ใหม่!\n👤 ลูกค้า: ${customerName}\n💰 ยอดรวม: ${total} บาท`;
    
    if (LINE_NOTIFY_TOKEN && LINE_NOTIFY_TOKEN !== "วาง_TOKEN_ของคุณตรงนี้") {
      UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
        "method": "post",
        "headers": { "Authorization": "Bearer " + LINE_NOTIFY_TOKEN },
        "payload": { "message": msg }
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Order processed"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// รับออเดอร์ + ตัดสต็อก + แจ้ง LINE (POST)
// ============================================
function doPost(e) {
  try {
    // รับข้อมูล JSON จากหน้าเว็บ
    const data = JSON.parse(e.postData.contents);
    
    // ========================================
    // 1. ตัดสต็อกใน Google Sheet
    // ========================================
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const sheetData = sheet.getDataRange().getValues();
    
    // วนลูปเช็ครายการที่สั่งเพื่อไปลดจำนวนใน Sheet
    if (data.items && data.items.length > 0) {
      data.items.forEach(orderItem => {
        for (let i = 1; i < sheetData.length; i++) {
          // ถ้าชื่อเมนูตรงกัน → ลดสต็อก
          if (sheetData[i][0] === orderItem.name) {
            let currentStock = sheetData[i][5]; // คอลัมน์ F (index 5)
            let newStock = currentStock - orderItem.qty;
            
            // อัปเดตค่าใน Sheet (แถว i+1, คอลัมน์ 6)
            sheet.getRange(i + 1, 6).setValue(newStock);
            console.log(`ตัดสต็อก: ${orderItem.name} เหลือ ${newStock} (จาก ${currentStock})`);
            break;
          }
        }
      });
    }
    
    // ========================================
    // 2. ส่งแจ้งเตือน LINE Notify
    // ========================================
    const msg = `
🔔 มีออเดอร์ใหม่!
👤 ลูกค้า: ${data.customerName}
📋 รายการ:
${data.orderDetails}
💰 ยอดรวม: ${data.total} บาท`;

    const options = {
      "method": "post",
      "headers": { 
        "Authorization": "Bearer " + LINE_NOTIFY_TOKEN 
      },
      "payload": { 
        "message": msg 
      }
    };
    
    // ส่งข้อความไป LINE (ถ้ามี Token)
    if (LINE_NOTIFY_TOKEN && LINE_NOTIFY_TOKEN !== "วาง_TOKEN_ของคุณตรงนี้") {
      UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
    }
    
    // ส่งผลลัพธ์กลับไปหน้าเว็บ
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Order processed"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    console.log("Error:", err);
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
