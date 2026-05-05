const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestReservation() {
  try {
    console.log('=== CHECKING LATEST RESERVATIONS ===');
    
    // Get the most recent reservation
    const latestReservation = await prisma.reservation.findMany({
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
      },
      take: 5
    });

    console.log(`Found ${latestReservation.length} most recent reservations:`);
    
    latestReservation.forEach((reservation, i) => {
      console.log(`\n${i+1}. Reservation ID: ${reservation.id}`);
      console.log(`   User: ${reservation.user?.firstName} ${reservation.user?.lastName} (${reservation.user?.email})`);
      console.log(`   Meal Date: ${reservation.date}`);
      console.log(`   Meal Type: ${reservation.meal?.type}`);
      console.log(`   Status: ${reservation.status}`);
      console.log(`   Current Time: ${new Date().toISOString()}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkLatestReservation();
