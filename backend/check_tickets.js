const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTickets() {
  try {
    const userId = 'e8601548-17eb-4df9-981d-10e9c6dc861b';
    
    // Get payments
    const payments = await prisma.payment.findMany({
      where: { userId, status: 'PAID' }
    });
    
    // Get reservations
    const usedReservations = await prisma.reservation.count({
      where: { userId, status: 'USED' }
    });
    
    const confirmedReservations = await prisma.reservation.count({
      where: { userId, status: 'CONFIRMED' }
    });
    
    const totalTickets = payments.reduce((total, payment) => total + Math.floor(payment.amount / 0.2), 0);
    const availableTickets = totalTickets - usedReservations;
    
    console.log('=== TICKET ANALYSIS ===');
    console.log('User ID:', userId);
    console.log('Number of payments:', payments.length);
    console.log('Payment amounts:', payments.map(p => p.amount));
    console.log('Total tickets from payments:', totalTickets);
    console.log('Used reservations (USED status):', usedReservations);
    console.log('Confirmed reservations (CONFIRMED status):', confirmedReservations);
    console.log('Available tickets (total - used):', availableTickets);
    console.log('======================');
    
    // Show individual reservations
    const allReservations = await prisma.reservation.findMany({
      where: { userId },
      include: { meal: true }
    });
    
    console.log('All reservations:');
    allReservations.forEach((res, i) => {
      console.log(`${i+1}. ID: ${res.id}, Status: ${res.status}, Date: ${res.date}, Meal: ${res.meal?.type}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkTickets();
