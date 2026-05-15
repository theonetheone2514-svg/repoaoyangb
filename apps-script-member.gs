// ============================================
// ตั้งค่า LINE Notify Token
// ============================================
const LINE_NOTIFY_TOKEN = "วาง_TOKEN_ของคุณตรงนี้";

// ============================================
// GET - ดึงข้อมูลเมนู / สมาชิก / สั่งซื้อ
// ============================================
function doGet(e) {
  const action = e.parameter?.action;
  
  // รับออเดอร์ผ่าน GET
  if (action === 'order') {
    return processOrderGet(e.parameter);
  }
  
  // ดึงข้อมูลสมาชิก
  if (action === 'getMember') {
    return getMember(e.parameter.phone);
  }
  
  // ดึงข้อมูลเมนู (ค่าเริ่มต้น)
  return getMenu();
}

// ============================================
// ฟังก์ชันประมวลผลออเดอร์ (GET)
// ============================================
function processOrderGet(params) {
  try {
    const phone = params.phone || 'ไม่ระบุ';
    const name = params.name || 'ลูกค้าทั่วไป';
    const total = parseInt(params.total) || 0;
    const items = JSON.parse(params.items || '[]');
    
    // 1. ตัดสต็อกสินค้า
    const stockResult = updateStock(items);
    if (!stockResult.success) {
      return jsonResponse({ status: "error", message: stockResult.message });
    }
    
    // 2. บันทึกประวัติออเดอร์
    const orderData = {
      phone: phone,
      customerName: name,
      total: total,
      items: items
    };
    saveOrder(orderData);
    
    // 3. เพิ่ม/อัพเดทสมาชิก + สะสมแต้ม
    const pointsEarned = Math.floor(total / 100);
    const memberResult = addMemberPoints(phone, name, pointsEarned);
    
    // 4. ส่งแจ้งเตือน LINE
    sendLineNotify(orderData, pointsEarned);
    
    return jsonResponse({
      status: "success",
      message: "Order processed",
      points: pointsEarned,
      totalPoints: memberResult.totalPoints,
      isNewMember: memberResult.isNewMember
    });
    
  } catch (err) {
    console.log("Error:", err);
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ============================================
// POST - รับออเดอร์ + สะสมแต้ม
// ============================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. ตัดสต็อกสินค้า
    const stockResult = updateStock(data.items);
    if (!stockResult.success) {
      return jsonResponse({ status: "error", message: stockResult.message });
    }
    
    // 2. บันทึกประวัติออเดอร์
    saveOrder(data);
    
    // 3. เพิ่ม/อัพเดทสมาชิก + สะสมแต้ม
    const pointsEarned = Math.floor(data.total / 100);
    const memberResult = addMemberPoints(data.phone, data.customerName, pointsEarned);
    
    // 4. ส่งแจ้งเตือน LINE
    sendLineNotify(data, pointsEarned);
    
    return jsonResponse({
      status: "success",
      message: "Order processed",
      points: pointsEarned,
      totalPoints: memberResult.totalPoints,
      isNewMember: memberResult.isNewMember
    });
    
  } catch (err) {
    console.log("Error:", err);
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ============================================
// ฟังก์ชันดึงข้อมูลเมนู
// ============================================
function getMenu() {
  // ใช้ชีท aoyangbor_DB (ชีทเมนู)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('aoyangbor_DB');
  if (!sheet) {
    // ถ้าไม่เจอ ใช้ชีทแรก
    const firstSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    return getMenuFromSheet(firstSheet);
  }
  return getMenuFromSheet(sheet);
}

function getMenuFromSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== "") {
      result.push({
        name: data[i][0],
        price: data[i][1],
        img: data[i][2],
        category: data[i][4],
        stock: data[i][5]
      });
    }
  }
  
  return jsonResponse(result);
}

// ============================================
// ฟังก์ชันตัดสต็อก
// ============================================
function updateStock(items) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('aoyangbor_DB') 
                  || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    for (let orderItem of items) {
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === orderItem.name) {
          let currentStock = data[i][5];
          if (currentStock < orderItem.qty) {
            return { success: false, message: `${orderItem.name} มีสต็อกไม่พอ` };
          }
          sheet.getRange(i + 1, 6).setValue(currentStock - orderItem.qty);
          found = true;
          break;
        }
      }
      if (!found) {
        return { success: false, message: `ไม่พบสินค้า ${orderItem.name}` };
      }
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ============================================
// ฟังก์ชันบันทึกประวัติออเดอร์
// ============================================
function saveOrder(data) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ออเดอร์');
    
    // ถ้ายังไม่มีชีท สร้างใหม่
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('ออเดอร์');
      sheet.appendRow(['วันที่', 'เบอร์โทร', 'ชื่อ', 'รายการ', 'ยอดรวม', 'สถานะ']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    }
    
    const itemsText = data.items.map(i => `${i.name} x${i.qty}`).join(', ');
    
    sheet.appendRow([
      new Date(),
      data.phone,
      data.customerName,
      itemsText,
      data.total,
      'รอดำเนินการ'
    ]);
    
  } catch (err) {
    console.log("Save order error:", err);
  }
}

// ============================================
// ฟังก์ชันสมาชิก + แต้ม
// ============================================
function getMember(phone) {
  try {
    if (!phone) return jsonResponse({ found: false });
    
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('สมาชิก');
    
    // ถ้ายังไม่มีชีทสมาชิก
    if (!sheet) {
      return jsonResponse({ found: false });
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === phone) {
        return jsonResponse({
          found: true,
          name: data[i][1],
          points: data[i][2],
          joinDate: data[i][3],
          lastOrder: data[i][4]
        });
      }
    }
    
    return jsonResponse({ found: false });
    
  } catch (err) {
    return jsonResponse({ found: false, error: err.toString() });
  }
}

function addMemberPoints(phone, name, points) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('สมาชิก');
    let isNewMember = false;
    
    // สร้างชีทถ้ายังไม่มี
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('สมาชิก');
      sheet.appendRow(['เบอร์โทร', 'ชื่อ', 'แต้มสะสม', 'วันที่สมัคร', 'ออเดอร์ล่าสุด']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // หาเบอร์ในระบบ
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === phone) {
        let currentPoints = data[i][2] || 0;
        let newPoints = currentPoints + points;
        
        sheet.getRange(i + 1, 3).setValue(newPoints);      // อัพเดทแต้ม
        sheet.getRange(i + 1, 5).setValue(new Date());      // อัพเดทออเดอร์ล่าสุด
        
        return { totalPoints: newPoints, isNewMember: false };
      }
    }
    
    // สมาชิกใหม่ - รับ 50 แต้มฟรี + แต้มจากการสั่งซื้อ
    let totalPoints = points + 50; // 50 แต้ม welcome bonus
    sheet.appendRow([phone, name, totalPoints, new Date(), new Date()]);
    isNewMember = true;
    
    return { totalPoints: totalPoints, isNewMember: true };
    
  } catch (err) {
    console.log("Add member error:", err);
    return { totalPoints: points, isNewMember: false };
  }
}

// ============================================
// ฟังก์ชันส่ง LINE Notify
// ============================================
function sendLineNotify(data, pointsEarned) {
  try {
    if (!LINE_NOTIFY_TOKEN || LINE_NOTIFY_TOKEN === "วาง_TOKEN_ของคุณตรงนี้") {
      return;
    }
    
    let itemsText = data.items.map(i => `- ${i.name} x${i.qty}`).join('\n');
    
    const msg = `🔔 มีออเดอร์ใหม่!

📱 เบอร์ลูกค้า: ${data.phone}
👤 ชื่อ: ${data.customerName}

📋 รายการ:
${itemsText}

💰 ยอดรวม: ${data.total} บาท
⭐ ได้รับ ${pointsEarned} แต้ม

🕐 ${new Date().toLocaleString('th-TH')}`;

    UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
      method: "post",
      headers: { "Authorization": "Bearer " + LINE_NOTIFY_TOKEN },
      payload: { "message": msg }
    });
    
  } catch (err) {
    console.log("LINE notify error:", err);
  }
}

// ============================================
// Helper: JSON Response
// ============================================
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
