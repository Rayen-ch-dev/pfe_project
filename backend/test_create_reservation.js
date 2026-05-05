const axios = require('axios');

async function testCreateReservation() {
  try {
    console.log('=== TESTING RESERVATION CREATION ===');
    
    // Login as test user
    const loginResponse = await axios.post('http://192.168.56.1:5000/api/auth/login', {
      email: 'test@gmail.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Try to create a reservation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0); // 7 PM
    
    // Create lunch reservation for today
    const today = new Date();
    today.setHours(12, 0, 0, 0); // 12 PM
    
    console.log('\n🍽️ Creating lunch reservation for today...');
    
    const lunchResponse = await axios.post('http://192.168.56.1:5000/api/users/reservations', 
      { 
        mealType: 'LUNCH',
        date: today,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log('✅ Lunch reservation created!');
    console.log('Response:', lunchResponse.data);
    
  } catch (error) {
    console.error('❌ Error creating reservation:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCreateReservation();
