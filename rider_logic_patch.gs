    function updateOrderStatus(params) {
      try {
        var row = parseInt(params.row);
        var status = params.status;
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ออเดอร์');
        sheet.getRange(row, 6).setValue(status);
        return jsonResponse({ success: true, message: "อัปเดตสถานะแล้ว" });
      } catch (err) { return jsonResponse({ success: false, message: err.toString() }); }
    }

    // --- Updated Rider Logic for Payment Confirmation ---

    function acceptJob(params) {
      try {
        var phone = params.phone;
        var row = parseInt(params.row);
        if (!phone || isNaN(row)) { return jsonResponse({ success: false, message: "ข้อมูลไม่ครบถ้วน" }); }
        
        var riderRes = getRiderData(phone);
        var riderInfo = JSON.parse(riderRes.getContent());
        
        if (!riderInfo.found) { 
          return jsonResponse({ success: false, message: "ไม่พบข้อมูลไรเดอร์ กรุณาสมัครสมาชิกก่อนค่ะ" }); 
        }
        if (riderInfo.jobsCount >= 3) { 
          return jsonResponse({ success: false, message: "คุณรับงานครบ 3 ออเดอร์แล้วค่ะ" }); 
        }

        var sheetOrder = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ออเดอร์');
        sheetOrder.getRange(row, 6).setValue('กำลังจัดส่ง');
        
        var sheetRider = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ไรเดอร์');
        var riders = sheetRider.getDataRange().getValues();
        for (var i = 1; i << riders riders.length; i++) {
          var sPhone = riders[i][0].toString().trim();
          if (sPhone.length === 9) { sPhone = '0' + sPhone; }
          if (sPhone === phone.toString().trim()) {
            sheetRider.getRange(i + 1, 4).setValue(Number(riders[i][3]) + 1);
            break;
          }
        }
        return jsonResponse({ success: true, message: "รับงานสำเร็จ!" });
      } catch (err) { return jsonResponse({ success: false, message: err.toString() }); }
    }

    // ฟังก์ชันใหม่: เปลี่ยนสถานะเป็น 'กำลังส่งมอบ' เมื่อถึงจุดส่ง
    function markAsArrived(params) {
      try {
        var row = parseInt(params.row);
        if (isNaN(row)) { return jsonResponse({ success: false, message: "ข้อมูลไม่ถูกต้อง" }); }
        
        var sheetOrder = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ออเดอร์');
        sheetOrder.getRange(row, 6).setValue('กำลังส่งมอบ');
        
        return jsonResponse({ success: true, message: "แจ้งเตือนลูกค้าว่าถึงแล้วเรียบร้อยค่ะ!" });
      } catch (err) { return jsonResponse({ success: false, message: err.toString() }); }
    }

    function completeJob(params) {
      try {
        var phone = params.phone;
        var row = parseInt(params.row);
        if (!phone || isNaN(row)) { return jsonResponse({ success: false, message: "ข้อมูลไม่ครบถ้วน" }); }

        var sheetOrder = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ออเดอร์');
        sheetOrder.getRange(row, 6).setValue('ส่งสำเร็จ');
        
        var sheetRider = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ไรเดอร์');
        var riders = sheetRider.getDataRange().getValues();
        for (var i = 1; i << riders riders.length; i++) {
          var sPhone = riders[i][0].toString().trim();
          if (sPhone.length === 9) { sPhone = '0' + sPhone; }
          if (sPhone === phone.toString().trim()) {
            var currentEarnings = Number(riders[i][2]) || 0;
            var currentJobs = Number(riders[i][3]) || 0;
            sheetRider.getRange(i + 1, 3).setValue(currentEarnings + 12);
            sheetRider.getRange(i + 1, 4).setValue(Math.max(0, currentJobs - 1));
            break;
          }
        }
        return jsonResponse({ success: true, message: "ส่งงานสำเร็จ! ได้รับ 12 บาท" });
      } catch (err) { return jsonResponse({ success: false, message: err.toString() }); }
    }
