const axios = require('axios');

async function testPaymentsAPI() {
  try {
    console.log('Testing admin login first...\n');
    
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@restaurant.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Now get payments with auth token
    console.log('\nTesting /api/admin/payments endpoint...\n');
    
    const paymentsResponse = await axios.get('http://localhost:5000/api/admin/payments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}`
      }
    });
    
    console.log(`Found ${paymentsResponse.data.length} payments:\n`);
    
    paymentsResponse.data.forEach(payment => {
      console.log(`- Payment ID: ${payment.id}`);
      console.log(`  User: ${payment.user?.firstName} ${payment.user?.lastName}`);
      console.log(`  Amount: ${payment.amount} DT`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Date: ${payment.date}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPaymentsAPI();
