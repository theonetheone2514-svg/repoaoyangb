// ============================================
// ตั้งค่า LINE Messaging API
// ============================================
const LINE_CHANNEL_ACCESS_TOKEN = "Os5VH3rTdnTBoyQjexdnynvDFhvU3KeE1cllneXwtE7z3JRabyiOOqbvrC3Gk4+ECcmNPzMQxVPzQpPyIEmIWKC6p9fBmGPiOn4cAU/Z6vmVCq2Fa+jCTMrqrUWHf23tEp9Gx9xmgeTVO5VWNzZhWgdB04t89/1O/w1cDnyilFU=";
const LINE_USER_ID = "U7b110706f02076a3af601c4e79f70b39";

// ============================================
// ร้านค้าพิกัด (แก้ไขพิกัดร้านของคุณที่นี่)
// ============================================
const SHOP_LOCATION = {
  lat: 13.7563,  // ละติจูดร้าน
  lng: 100.5018, // ลองจิจูดร้าน
  name: "เอาหยังบ่",
  address: "กรุงเทพมหานคร"
};

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
  
  // ดึงข้อมูลพิกัดร้านค้า
  if (action === 'getShopLocation') {
    return getShopLocation();
  }
  
  // บันทึกพิกัดลูกค้า
  if (action === 'saveLocation') {
    return saveCustomerLocation(e.parameter);
  }
  
  // ดึงข้อมูล Statement ของร้านค้า
  if (action === 'getMerchantStatement') {
    return getMerchantStatement(e);
  }
  
  // ดึงหรือบันทึกการตั้งค่าระบบ
  if (action === 'getSettings') {
    return getSettings();
  }
  if (action === 'updateSettings') {
    return updateSettings(e.parameter);
  }
  
  // ดึงข้อมูลเมนู (ค่าเริ่มต้น)
  return getMenu();
}

// ============================================
// ดึงข้อมูลพิกัดร้านค้า
// ============================================
function getShopLocation() {
  return jsonResponse({
    success: true,
    location: SHOP_LOCATION
  });
}

// ============================================
// บันทึกพิกัดลูกค้า
// ============================================
function saveCustomerLocation(params) {
  try {
    const phone = params.phone || 'ไม่ระบุ';
    const lat = parseFloat(params.lat);
    const lng = parseFloat(params.lng);
    const address = params.address || 'ไม่ระบุ';
    
    if (!lat || !lng) {
      return jsonResponse({ 
        success: false, 
        message: 'พิกัดไม่ถูกต้อง' 
      });
    }
    
    // บันทึกไปยังชีท "ตำแหน่งลูกค้า"
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ตำแหน่งลูกค้า');
    
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('ตำแหน่งลูกค้า');
      sheet.appendRow(['วันที่', 'เบอร์โทร', 'ชื่อ', 'ละติจูด', 'ลองจิจูด', 'ที่อยู่', 'Google Maps Link']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }
    
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    
    sheet.appendRow([
      new Date(),
      phone,
      params.name || 'ไม่ระบุ',
      lat,
      lng,
      address,
      mapsLink
    ]);
    
    return jsonResponse({
      success: true,
      message: 'บันทึกตำแหน่งแล้ว',
      mapsLink: mapsLink
    });
    
  } catch (err) {
    console.log("Save location error:", err);
    return jsonResponse({ 
      success: false, 
      message: err.toString() 
    });
  }
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
    const customerLat = params.lat ? parseFloat(params.lat) : null;
    const customerLng = params.lng ? parseFloat(params.lng) : null;
    const customerAddress = params.address || 'ไม่ระบุ';
    
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
      items: items,
      lat: customerLat,
      lng: customerLng,
      address: customerAddress
    };
    saveOrder(orderData);
    
    // 3. เพิ่ม/อัพเดทสมาชิก + สะสมแต้ม
    const pointsEarned = Math.floor(total / 100);
    const memberResult = addMemberPoints(phone, name, pointsEarned);
    
    // 4. ส่งแจ้งเตือน LINE (เปลี่ยนเป็น Messaging API)
    sendLineMessage(orderData, pointsEarned);
    
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
    
    // 4. ส่งแจ้งเตือน LINE (เปลี่ยนเป็น Messaging API)
    sendLineMessage(data, pointsEarned);
    
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
      sheet.appendRow(['วันที่', 'เบอร์โทร', 'ชื่อ', 'รายการ', 'ยอดรวม', 'สถานะ', 'ละติจูด', 'ลองจิจูด', 'ที่อยู่', 'Google Maps Link']);
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
    }
    
    const itemsText = data.items.map(i => `${i.name} x${i.qty}`).join(', ');
    
    // สร้าง Google Maps Link ถ้ามีพิกัด
    let mapsLink = '';
    if (data.lat && data.lng) {
      mapsLink = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
    }
    
    sheet.appendRow([
      new Date(),
      data.phone,
      data.customerName,
      itemsText,
      data.total,
      'รอดำเนินการ',
      data.lat || '',
      data.lng || '',
      data.address || '',
      mapsLink
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
        
        sheet.getRange(i + 1, 3).setValue(newPoints); // อัพเดทแต้ม
        sheet.getRange(i + 1, 5).setValue(new Date()); // อัพเดทออเดอร์ล่าสุด
        
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
// ฟังก์ชันส่ง LINE Messaging API (Push Message)
// ============================================
function sendLineMessage(data, pointsEarned) {
  try {
    // ตรวจสอบการตั้งค่า
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      console.log("LINE Channel Access Token ยังไม่ได้ตั้งค่า");
      return;
    }
    
    if (!LINE_USER_ID) {
      console.log("LINE User ID ยังไม่ได้ตั้งค่า");
      return;
    }
    
    // สร้างข้อความ
    let itemsText = data.items.map(i => `- ${i.name} x${i.qty}`).join('\n');
    
    let locationText = '';
    if (data.lat && data.lng) {
      const mapsLink = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
      locationText = `\n\n📍 ตำแหน่งจัดส่ง: ${data.address || 'ไม่ระบุ'}\n🗺️ <a href="${mapsLink}">ดูบน Google Maps</a>`;
    }
    
    const message = `🔔 มีออเดอร์ใหม่!

📱 เบอร์ลูกค้า: ${data.phone}
👤 ชื่อ: ${data.customerName}

📋 รายการ:
${itemsText}

💰 ยอดรวม: ${data.total} บาท
⭐ ได้รับ ${pointsEarned} แต้ม
${locationText}

🕐 ${new Date().toLocaleString('th-TH')}`;

    // LINE Messaging API endpoint สำหรับ Push Message
    const url = "https://api.line.me/v2/bot/message/push";
    
    // สร้าง payload
    const payload = {
      to: LINE_USER_ID,
      messages: [
        {
          type: "text",
          text: message
        }
      ]
    };
    
    // ตั้งค่า options สำหรับ UrlFetchApp
    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + LINE_CHANNEL_ACCESS_TOKEN
      },
      payload: JSON.stringify(payload)
    };
    
    // ส่งข้อความ
    const response = UrlFetchApp.fetch(url, options);
    console.log("LINE API Response:", response.getResponseCode(), response.getContentText());
    
  } catch (err) {
    console.log("LINE Messaging API error:", err);
  }
}

// ============================================
// ฟังก์ชันตั้งค่าระบบ (Settings Sheet)
// ============================================
function getSettingsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.appendRow(['key', 'value']);
    sheet.appendRow(['delivery_fee', '10']);
    sheet.appendRow(['radius', '4.5']);
    sheet.appendRow(['markup', '15']);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  return sheet;
}

function getSetting(key, defaultValue) {
  try {
    var sheet = getSettingsSheet();
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1];
      }
    }
  } catch (e) {}
  return defaultValue;
}

function setSetting(key, value) {
  var sheet = getSettingsSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function getSettings() {
  try {
    var deliveryFee = parseFloat(getSetting('delivery_fee', '10')) || 10;
    var radius = parseFloat(getSetting('radius', '4.5')) || 4.5;
    var markup = parseFloat(getSetting('markup', '15')) || 15;
    
    return jsonResponse({
      success: true,
      del_fee: deliveryFee,
      radius: radius,
      markup: markup
    });
  } catch (err) {
    return jsonResponse({
      success: true,
      del_fee: 10,
      radius: 4.5,
      markup: 15
    });
  }
}

function updateSettings(params) {
  try {
    var fee = params.fee;
    var radius = params.radius;
    var markup = params.markup;
    
    if (fee) setSetting('delivery_fee', fee);
    if (radius) setSetting('radius', radius);
    if (markup) setSetting('markup', markup);
    
    return jsonResponse({ success: true, message: 'บันทึกการตั้งค่าเรียบร้อย' });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

function getDeliveryFee() {
  return parseFloat(getSetting('delivery_fee', '10')) || 10;
}

// ============================================
// Helper: JSON Response
// ============================================
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
