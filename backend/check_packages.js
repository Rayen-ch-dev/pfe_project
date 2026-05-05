const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPackages() {
  try {
    const packages = await prisma.package.findMany();
    
    console.log('=== CURRENT PACKAGES ===');
    packages.forEach((pkg, i) => {
      const ticketsPerDT = pkg.tickets / pkg.price;
      const pricePerTicket = pkg.price / pkg.tickets;
      
      console.log(`${i+1}. ${pkg.name}:`);
      console.log(`   Price: ${pkg.price} DT`);
      console.log(`   Tickets: ${pkg.tickets}`);
      console.log(`   Price per ticket: ${pricePerTicket.toFixed(3)} DT`);
      console.log(`   Tickets per DT: ${ticketsPerDT.toFixed(1)}`);
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkPackages();
