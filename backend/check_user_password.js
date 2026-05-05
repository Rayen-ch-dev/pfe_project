const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function checkUserPassword() {
  try {
    console.log('=== CHECKING USER PASSWORDS ===');
    
    // Find test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@gmail.com' },
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`✅ Found test user: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password hash: ${testUser.password.substring(0, 20)}...`);
    
    // Test common passwords
    const passwords = ['password123', 'password', '123456', 'test123', 'test'];
    
    for (const password of passwords) {
      const isValid = await bcrypt.compare(password, testUser.password);
      if (isValid) {
        console.log(`✅ CORRECT PASSWORD: "${password}"`);
        return;
      }
    }
    
    console.log('❌ No common password matched');
    console.log('You may need to check the actual password used during registration');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkUserPassword();
