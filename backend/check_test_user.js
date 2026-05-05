const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestUser() {
  try {
    console.log('=== CHECKING TEST USER ===');
    
    // Find test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@gmail.com' },
      include: {
        payments: true,
        reservations: {
          include: {
            meal: true
          }
        }
      }
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`✅ Found test user: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Status: ${testUser.status}`);
    console.log(`   ID: ${testUser.id}`);
    
    console.log(`\n📊 Payments (${testUser.payments.length}):`);
    testUser.payments.forEach((payment, i) => {
      console.log(`${i+1}. Amount: ${payment.amount} DT, Status: ${payment.status}, Created: ${payment.createdAt}`);
    });

    console.log(`\n📅 Reservations (${testUser.reservations.length}):`);
    testUser.reservations.forEach((reservation, i) => {
      console.log(`${i+1}. Meal: ${reservation.meal?.type}, Date: ${reservation.date}, Status: ${reservation.status}`);
    });

    // Calculate tickets
    const paidPayments = testUser.payments.filter(p => p.status === 'PAID');
    const totalTickets = paidPayments.reduce((total, payment) => total + Math.round(payment.amount / 0.2), 0);
    console.log(`\n🎫 Tickets: ${totalTickets} total (from ${paidPayments.length} paid payments)`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkTestUser();
