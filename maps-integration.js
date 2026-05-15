// ============================================
// Google Maps Integration
// ============================================

let shopMap;
let deliveryMap;
let deliveryMarker;
let selectedLocation = { lat: null, lng: null, address: '' };

// ============================================
// Initialize Maps (called when page loads)
// ============================================
function initMaps() {
  // Shop location map (default: Bangkok - update to your shop location)
  const shopLocation = { lat: 13.7563, lng: 100.5018 };
  
  // Initialize shop map
  const shopMapElement = document.getElementById('shopMap');
  if (shopMapElement) {
    shopMap = new google.maps.Map(shopMapElement, {
      zoom: 15,
      center: shopLocation,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false
    });
    
    new google.maps.Marker({
      position: shopLocation,
      map: shopMap,
      title: 'เอาหยังบ่',
      animation: google.maps.Animation.DROP
    });
  }
  
  // Initialize delivery location picker map
  const deliveryMapElement = document.getElementById('deliveryMap');
  if (deliveryMapElement) {
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          initDeliveryMap(userLocation);
        },
        () => {
          // Default to Bangkok if geolocation fails
          initDeliveryMap(shopLocation);
        }
      );
    } else {
      initDeliveryMap(shopLocation);
    }
  }
}

// ============================================
// Initialize Delivery Map
// ============================================
function initDeliveryMap(centerLocation) {
  deliveryMap = new google.maps.Map(document.getElementById('deliveryMap'), {
    zoom: 15,
    center: centerLocation,
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: false
  });
  
  // Create draggable marker
  deliveryMarker = new google.maps.Marker({
    position: centerLocation,
    map: deliveryMap,
    draggable: true,
    animation: google.maps.Animation.DROP,
    title: 'ลากหมุดเพื่อระบุตำแหน่ง'
  });
  
  // Update location when marker is dragged
  deliveryMarker.addListener('dragend', function() {
    updateLocationInfo(deliveryMarker.getPosition());
  });
  
  // Update location when map is clicked
  deliveryMap.addListener('click', function(e) {
    deliveryMarker.setPosition(e.latLng);
    updateLocationInfo(e.latLng);
  });
  
  // Initial location info
  updateLocationInfo(centerLocation);
}

// ============================================
// Update Location Info Display
// ============================================
function updateLocationInfo(latLng) {
  const lat = latLng.lat();
  const lng = latLng.lng();
  
  selectedLocation.lat = lat;
  selectedLocation.lng = lng;
  
  document.getElementById('locCoords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  
  // Reverse geocoding to get address
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
    if (status === 'OK' && results[0]) {
      selectedLocation.address = results[0].formatted_address;
      document.getElementById('locAddress').textContent = results[0].formatted_address;
    } else {
      document.getElementById('locAddress').textContent = 'ไม่สามารถระบุที่อยู่ได้';
    }
  });
}

// ============================================
// Save Delivery Location
// ============================================
function saveDeliveryLocation() {
  if (!selectedLocation.lat || !selectedLocation.lng) {
    alert('กรุณาระบุตำแหน่งก่อนบันทึก');
    return;
  }
  
  // Save to localStorage for use in order
  localStorage.setItem('deliveryLocation', JSON.stringify(selectedLocation));
  
  alert('✅ บันทึกตำแหน่งเรียบร้อยแล้ว!\n\n📍 พิกัด: ' + selectedLocation.lat.toFixed(6) + ', ' + selectedLocation.lng.toFixed(6) + '\n🏠 ที่อยู่: ' + (selectedLocation.address || 'ไม่ระบุ'));
  
  // Auto-redirect to home page to continue ordering
  setTimeout(() => {
    showPage('home');
  }, 1500);
}

// ============================================
// Open Shop Location in Google Maps
// ============================================
function openInGoogleMaps() {
  const shopLocation = { lat: 13.7563, lng: 100.5018 }; // Update to your shop location
  const url = `https://www.google.com/maps/dir/?api=1&destination=${shopLocation.lat},${shopLocation.lng}`;
  window.open(url, '_blank');
}

// ============================================
// Get Saved Delivery Location
// ============================================
function getSavedDeliveryLocation() {
  const saved = localStorage.getItem('deliveryLocation');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// ============================================
// Clear Saved Delivery Location
// ============================================
function clearDeliveryLocation() {
  localStorage.removeItem('deliveryLocation');
  selectedLocation = { lat: null, lng: null, address: '' };
}

// ============================================
// Update sendOrder function to include location
// ============================================
async function sendOrderWithLocation() {
  if (cart.length === 0) return;
  
  const phone = currentUser ? currentUser.phone : 'ไม่ระบุ';
  const name = currentUser ? currentUser.name : 'ลูกค้าทั่วไป';
  const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  
  // Get saved delivery location
  const deliveryLoc = getSavedDeliveryLocation();
  
  // Disable button
  const btn = document.getElementById('confirmBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังส่ง...';
  
  try {
    const params = new URLSearchParams({
      action: 'order',
      phone: phone,
      name: name,
      total: total,
      items: JSON.stringify(cart),
      status: 'pending_payment',
      lat: deliveryLoc ? deliveryLoc.lat : '',
      lng: deliveryLoc ? deliveryLoc.lng : '',
      address: deliveryLoc ? deliveryLoc.address : ''
    });
    
    const res = await fetch(API_URL + '?' + params.toString());
    const data = await res.json();
    
    if (data.status === 'success') {
      // Update points if member
      if (currentUser) {
        currentUser.points = data.totalPoints;
        updateMemberUI();
      }
      
      // Build LINE message
      let orderText = `🥤 สั่งซื้อจากเอาหยังบ่\n\n`;
      orderText += `📱 ${phone}\n`;
      orderText += `👤 ${name}\n\n`;
      orderText += `📋 รายการ:\n`;
      cart.forEach(i => {
        orderText += `- ${i.name} x${i.qty} = ${(i.price * i.qty).toLocaleString()} บาท\n`;
      });
      orderText += `\n💰 รวม: ${total.toLocaleString()} บาท`;
      
      if (total >= 500) orderText += '\n🚚 ส่งฟรี!';
      if (data.points > 0) orderText += `\n⭐ ได้รับ ${data.points} แต้ม`;
      if (data.isNewMember) orderText += '\n🎉 ยินดีต้อนรับสมาชิกใหม่! (+50 แต้ม)';
      
      // Add location info if available
      if (deliveryLoc && deliveryLoc.lat && deliveryLoc.lng) {
        orderText += `\n\n📍 ตำแหน่งจัดส่ง:`;
        orderText += `\n${deliveryLoc.address || 'ไม่ระบุที่อยู่'}`;
        orderText += `\n🗺️ https://www.google.com/maps?q=${deliveryLoc.lat},${deliveryLoc.lng}`;
      }
      
      orderText += `\n💳 ชำระเงิน: รอแจ้งเมื่อของพร้อม`;
      
      // Open LINE
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(orderText)}`);
      
      // Success
      alert(`🎉 สั่งซื้อสำเร็จ!\n\n💰 ยอดรวม: ${total.toLocaleString()} บาท\n${data.points > 0 ? `⭐ ได้รับ ${data.points} แต้ม\n` : ''}${data.isNewMember ? '🎉 สมาชิกใหม่รับ 50 แต้มฟรี!' : ''}\n\n📝 ร้านจะแจ้งทาง LINE เมื่อของพร้อมจัดส่ง`);
      
      cart = [];
      updateCartUI();
      toggleCart();
      loadMenu(); // Refresh stock
      
      // Clear delivery location after order
      clearDeliveryLocation();
      
    } else {
      alert('เกิดข้อผิดพลาด: ' + data.message);
    }
    
  } catch (err) {
    console.error('Send order error:', err);
    alert('ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fab fa-line"></i> สั่งซื้อ';
  }
}

// ============================================
// Initialize on page load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  // Initialize maps if on about or location page
  setTimeout(() => {
    initMaps();
  }, 500);
});
