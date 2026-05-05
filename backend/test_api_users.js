const axios = require('axios');

async function testUsersAPI() {
  try {
    console.log('Testing /api/admin/users endpoint...\n');
    
    const response = await axios.get('http://localhost:5000/api/admin/users');
    
    console.log(`Found ${response.data.length} users:\n`);
    
    response.data.forEach(user => {
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

testUsersAPI();
