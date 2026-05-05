const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudents() {
  try {
    console.log('Checking students in database...\n');
    
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        documentImage: true,
        createdAt: true
      }
    });
    
    console.log(`Students found: ${users.length}`);
    
    if (users.length === 0) {
      console.log('No students found in database.');
      console.log('Try registering a student account first.');
    } else {
      users.forEach(user => {
        console.log(`\n- ${user.firstName} ${user.lastName}: ${user.email}`);
        console.log(`  Status: ${user.status}`);
        console.log(`  Document: ${user.documentImage ? 'YES' : 'NO'}`);
        if (user.documentImage) {
          console.log(`  Document type: ${user.documentImage.startsWith('data:') ? 'Base64' : 'URL'}`);
          console.log(`  Document length: ${user.documentImage.length} characters`);
        }
        console.log(`  Created: ${user.createdAt}`);
      });
    }
    
    // Also check all users to see roles
    console.log('\n\nAll users in database:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        documentImage: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`- ${user.role}: ${user.firstName} ${user.lastName} (${user.status}) - Doc: ${user.documentImage ? 'YES' : 'NO'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();
