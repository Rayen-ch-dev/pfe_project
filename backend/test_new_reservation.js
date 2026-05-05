const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewReservation() {
  try {
    console.log('=== TESTING NEW RESERVATION CREATION ===');
    
    // Test creating a meal with the exact time we want
    const testDate = new Date();
    testDate.setHours(19, 0, 0, 0); // 7:00 PM today
    
    console.log('Creating test meal with date:', testDate.toISOString());
    
    const meal = await prisma.meal.create({
      data: {
        date: testDate,
        type: 'DINNER',
      },
    });
    
    console.log('✅ Created meal:', meal);
    
    // Test creating a reservation with this meal
    const reservation = await prisma.reservation.create({
      data: {
        userId: 'e8601548-17eb-4df9-981d-10e9c6dc861b', // Test user ID
        mealId: meal.id,
        date: testDate,
        status: 'CONFIRMED',
      },
      include: {
        meal: true,
      },
    });
    
    console.log('✅ Created reservation:', {
      id: reservation.id,
      date: reservation.date,
      mealDate: reservation.meal.date,
      mealType: reservation.meal.type,
    });
    
    // Clean up test data
    await prisma.reservation.delete({ where: { id: reservation.id } });
    await prisma.meal.delete({ where: { id: meal.id } });
    
    console.log('✅ Test completed successfully!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Test failed:', error);
    await prisma.$disconnect();
  }
}

testNewReservation();
