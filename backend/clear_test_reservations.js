const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTestReservations() {
  try {
    console.log('=== CLEARING TEST RESERVATIONS ===');
    
    const result = await prisma.reservation.deleteMany({});
    
    console.log(`Deleted ${result.count} reservations`);
    console.log('✅ Test reservations cleared successfully!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

clearTestReservations();
