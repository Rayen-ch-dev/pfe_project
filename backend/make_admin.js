const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    console.log('=== MAKE USER ADMIN ===');
    
    // Replace with the user's email you want to make admin
    const userEmail = "user@example.com"; // ← CHANGE THIS EMAIL
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      console.log(`❌ User with email "${userEmail}" not found!`);
      console.log('Available users:');
      
      const allUsers = await prisma.user.findMany({
        select: { id: true, firstName: true, lastName: true, email: true, role: true }
      });
      
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}`);
      });
      
      await prisma.$disconnect();
      return;
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role: 'ADMIN' }
    });

    console.log(`✅ Updated role to: ${updatedUser.role}`);
    console.log(`🎯 ${updatedUser.firstName} ${updatedUser.lastName} is now an ADMIN!`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

makeAdmin();
