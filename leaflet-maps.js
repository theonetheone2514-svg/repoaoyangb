// ============================================
// Leaflet.js + OpenStreetMap Integration
// ฟรี! ไม่ต้องใช้ API Key
// ============================================

let shopMap;
let deliveryMap;
let deliveryMarker;
let selectedLocation = { lat: null, lng: null, address: '' };

// ============================================
// 🏪 ตั้งค่าพิกัดร้านค้า (แก้ไขตรงนี้!)
// ============================================
const SHOP_LOCATION = {
  lat: 17.293067,  // ละติจูดร้านคุณ
  lng: 103.969910  // ลองจิจูดร้านคุณ
};

// ============================================
// Initialize Maps
// ============================================
function initMaps() {
  // Initialize shop map
  const shopMapElement = document.getElementById('shopMap');
  if (shopMapElement && typeof L !== 'undefined') {
    shopMap = L.map('shopMap').setView([SHOP_LOCATION.lat, SHOP_LOCATION.lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(shopMap);
    
    // Add shop marker
    L.marker([SHOP_LOCATION.lat, SHOP_LOCATION.lng], {
      title: 'เอาหยังบ่'
    }).addTo(shopMap)
     .bindPopup('<b>🥤 เอาหยังบ่</b><br>ร้านเครื่องดื่ม')
     .openPopup();
  }
  
  // Initialize delivery location picker map
  const deliveryMapElement = document.getElementById('deliveryMap');
  if (deliveryMapElement && typeof L !== 'undefined') {
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
          // Default to shop location if geolocation fails
          initDeliveryMap(SHOP_LOCATION);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      initDeliveryMap(SHOP_LOCATION);
    }
  }
}

// ============================================
// Initialize Delivery Map
// ============================================
function initDeliveryMap(centerLocation) {
  deliveryMap = L.map('deliveryMap').setView([centerLocation.lat, centerLocation.lng], 15);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(deliveryMap);
  
  // Create custom draggable marker icon
  const markerIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background-color: #e74c3c; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 2px 2px 5px rgba(0,0,0,0.3);"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
  
  // Create draggable marker
  deliveryMarker = L.marker([centerLocation.lat, centerLocation.lng], {
    draggable: true,
    icon: markerIcon
  }).addTo(deliveryMap);
  
  // Add popup
  deliveryMarker.bindPopup('📍 ตำแหน่งจัดส่งของคุณ').openPopup();
  
  // Update location when marker is dragged
  deliveryMarker.on('dragend', function() {
    const position = deliveryMarker.getLatLng();
    updateLocationInfo(position);
  });
  
  // Update location when map is clicked
  deliveryMap.on('click', function(e) {
    deliveryMarker.setLatLng(e.latlng);
    updateLocationInfo(e.latlng);
  });
  
  // Initial location info
  updateLocationInfo(centerLocation);
}

// ============================================
// Update Location Info Display
// ============================================
function updateLocationInfo(latLng) {
  const lat = latLng.lat;
  const lng = latLng.lng;
  
  selectedLocation.lat = lat;
  selectedLocation.lng = lng;
  
  document.getElementById('locCoords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  
  // Note: OpenStreetMap doesn't have built-in reverse geocoding
  // We'll use Nominatim API (free, but rate limited)
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.display_name) {
        selectedLocation.address = data.display_name;
        document.getElementById('locAddress').textContent = data.display_name;
      } else {
        selectedLocation.address = 'ไม่ระบุที่อยู่';
        document.getElementById('locAddress').textContent = 'ไม่ระบุที่อยู่';
      }
    })
    .catch(err => {
      console.log('Geocoding error:', err);
      selectedLocation.address = 'ไม่ระบุที่อยู่';
      document.getElementById('locAddress').textContent = 'ไม่ระบุที่อยู่';
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
// Open Shop Location in Google Maps / OSM
// ============================================
function openInGoogleMaps() {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`;
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
// Send Order with Location
// ============================================
async function sendOrderWithLocation() {
  if (cart.length === 0) {
    alert('ตะกร้าว่างเปล่า กรุณาเพิ่มสินค้าก่อนสั่งซื้อ');
    return;
  }
  
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
  // Initialize maps after a short delay
  setTimeout(() => {
    initMaps();
  }, 500);
});
