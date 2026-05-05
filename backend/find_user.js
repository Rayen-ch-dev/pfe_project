const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUser() {
  try {
    console.log('=== FINDING USERS ===');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`\n${i+1}. ID: ${user.id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

findUser();
