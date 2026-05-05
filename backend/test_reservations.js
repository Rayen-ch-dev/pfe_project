const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReservations() {
  try {
    console.log('=== TESTING RESERVATIONS API ===');
    
    // Test the actual database query
    const reservations = await prisma.reservation.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        meal: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`Found ${reservations.length} reservations in database:`);
    
    reservations.forEach((reservation, i) => {
      console.log(`${i+1}. ID: ${reservation.id}`);
      console.log(`   User: ${reservation.user?.firstName} ${reservation.user?.lastName} (${reservation.user?.email})`);
      console.log(`   Date: ${reservation.date}`);
      console.log(`   Meal: ${reservation.meal?.type || 'Unknown'}`);
      console.log(`   Status: ${reservation.status}`);
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

testReservations();
