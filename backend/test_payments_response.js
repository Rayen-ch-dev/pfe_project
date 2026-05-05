const axios = require('axios');

async function testPaymentsResponse() {
  try {
    console.log('Testing admin login first...\n');
    
    // Login as admin
    const loginResponse = await axios.post('http://192.168.56.1:5000/api/auth/login', {
      email: 'admin@restaurant.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Get payments with auth token
    console.log('\nTesting /api/admin/payments endpoint...\n');
    
    const paymentsResponse = await axios.get('http://192.168.56.1:5000/api/admin/payments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}`
      }
    });
    
    console.log('Raw response from backend:');
    console.log(JSON.stringify(paymentsResponse.data, null, 2));
    
    console.log(`\nFound ${paymentsResponse.data.length} payments`);
    
    if (paymentsResponse.data.length > 0) {
      const payment = paymentsResponse.data[0];
      console.log('\nFirst payment structure:');
      console.log('- ID:', payment.id);
      console.log('- Amount:', payment.amount);
      console.log('- Status:', payment.status);
      console.log('- Date:', payment.date);
      console.log('- User:', payment.user);
      console.log('- Tickets Added:', payment.ticketsAdded);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPaymentsResponse();
