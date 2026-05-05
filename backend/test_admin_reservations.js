const axios = require('axios');

async function testAdminReservations() {
  try {
    console.log('=== TESTING ADMIN RESERVATIONS API ===');
    
    // Login as admin
    const loginResponse = await axios.post('http://192.168.56.1:5000/api/auth/login', {
      email: 'admin@restaurant.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Get all reservations
    console.log('\n📅 Fetching all reservations...');
    
    const reservationsResponse = await axios.get('http://192.168.56.1:5000/api/admin/reservations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}`
      }
    });
    
    console.log(`✅ Found ${reservationsResponse.data.length} reservations:`);
    
    reservationsResponse.data.forEach((reservation, i) => {
      console.log(`${i+1}. ID: ${reservation.id}`);
      console.log(`   User: ${reservation.user?.firstName} ${reservation.user?.lastName} (${reservation.user?.email})`);
      console.log(`   Date: ${reservation.date}`);
      console.log(`   Meal: ${reservation.meal?.type || 'Unknown'}`);
      console.log(`   Status: ${reservation.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAdminReservations();
