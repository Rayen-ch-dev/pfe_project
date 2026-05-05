const axios = require('axios');

async function testUsersAPIWithAuth() {
  try {
    console.log('Testing admin login first...\n');
    
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@restaurant.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Now get users with auth token
    console.log('\nTesting /api/admin/users endpoint...\n');
    
    const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}`
      }
    });
    
    console.log(`Found ${usersResponse.data.length} users:\n`);
    
    usersResponse.data.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName}: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Document: ${user.documentImage ? 'YES' : 'NO'}`);
      if (user.documentImage) {
        console.log(`  Document type: ${user.documentImage.startsWith('data:') ? 'Base64' : 'URL'}`);
        console.log(`  Document length: ${user.documentImage.length} characters`);
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testUsersAPIWithAuth();
