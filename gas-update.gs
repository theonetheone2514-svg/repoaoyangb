// ============================================
// 🔧 วางไฟล์นี้ใน GAS Project (Add file → Script)
// แล้วลบฟังก์ชัน getMerchantStatement() ตัวเก่าทิ้ง
// ============================================

// ============================================
// อ่านค่าส่งจาก Sheet "Settings" (key = del_fee)
// ============================================
function getDeliveryFee() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
    if (!sheet) return 10;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'del_fee') {
        var val = parseFloat(data[i][1]);
        return (val > 0) ? val : 10;
      }
    }
    return 10;
  } catch(e) {
    return 10;
  }
}

// ============================================
// 💰 Merchant Statement — หัก 15% จากค่าอาหารเท่านั้น
// ============================================
function getMerchantStatement(params) {
  try {
    var storeId = params.storeId ? params.storeId.toString().trim() : "";
    var targetDate = params.date ? params.date.toString().trim() : "";
    if (!storeId) return jsonResponse({ success: false, message: "ERROR: ขาด storeId" });
    if (!targetDate) return jsonResponse({ success: false, message: "ERROR: ขาด targetDate" });

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ออเดอร์');
    if (!sheet) return jsonResponse({ success: false, message: "ERROR: ไม่พบชีท 'ออเดอร์'" });

    var data = sheet.getDataRange().getValues();
    var statement = [];
    // ✅ อ่านค่าส่งจาก Settings แทน hardcode
    var deliveryFee = getDeliveryFee();

    for (var i = 1; i < data.length; i++) {
      var rowDateValue = data[i][0];
      var formattedDate = "";

      try {
        if (rowDateValue instanceof Date) {
          formattedDate = Utilities.formatDate(rowDateValue, "GMT+7", "yyyy-MM-dd");
        } else if (typeof rowDateValue === 'string' && rowDateValue !== "") {
          var dateStr = rowDateValue.trim();
          if (dateStr.includes('/')) {
            var parts = dateStr.split(',')[0].trim().split('/');
            if(parts.length === 3) {
              var day = parts[0].padStart(2, '0');
              var month = parts[1].padStart(2, '0');
              var year = parts[2];
              if (year.length === 2) year = "20" + year;
              formattedDate = year + '-' + month + '-' + day;
            }
          } else if (dateStr.includes('-')) {
            formattedDate = dateStr.split(' ')[0].trim();
          }
        }
      } catch (e) { formattedDate = ""; }

      var status = data[i][5] ? data[i][5].toString().trim() : "";
      var storeIdInSheet = data[i][10] ? data[i][10].toString().trim() : "";

      if (storeIdInSheet === storeId && formattedDate === targetDate && status === 'ส่งสำเร็จ') {
        var totalAmount = parseFloat(data[i][4]) || 0;

        // ✅ แยกค่าอาหารออกจากค่าส่ง
        var foodPrice = Math.max(0, totalAmount - deliveryFee);

        // ✅ หัก 15% จากค่าอาหารเท่านั้น แล้วบวกค่าส่งคืนให้ร้าน
        var netIncome = Math.round((foodPrice * 0.85 + deliveryFee) * 100) / 100;

        statement.push({
          time: (rowDateValue instanceof Date)
            ? Utilities.formatDate(rowDateValue, "GMT+7", "HH:mm")
            : (rowDateValue.toString().split(',')[1] || '--:--').trim(),
          items: data[i][3] || 'ไม่ระบุรายการ',
          foodPrice: Math.round(foodPrice * 100) / 100,
          deliveryFee: deliveryFee,
          netIncome: netIncome
        });
      }
    }
    return jsonResponse({ success: true, data: statement });
  } catch (err) {
    return jsonResponse({ success: false, message: "CRITICAL ERROR: " + err.toString() });
  }
}
