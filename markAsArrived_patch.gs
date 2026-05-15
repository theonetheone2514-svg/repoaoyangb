    function markAsArrived(params) {
      try {
        var row = parseInt(params.row);
        if (isNaN(row)) { return jsonResponse({ success: false, message: "ข้อมูลไม่ถูกต้อง" }); }
        
        var sheetOrder = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ออเดอร์');
        sheetOrder.getRange(row, 6).setValue('กำลังส่งมอบ');
        
        return jsonResponse({ success: true, message: "แจ้งเตือนลูกค้าว่าถึงแล้วเรียบร้อยค่ะ!" });
      } catch (err) { return jsonResponse({ success: false, message: err.toString() }); }
    }
