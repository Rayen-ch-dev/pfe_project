const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePackages() {
  try {
    // Delete existing packages
    await prisma.package.deleteMany({});
    
    // Create new packages with French names
    const packages = [
      {
        id: "package-1-semaine",
        name: "Package 1 Semaine",
        price: 2.4,
        tickets: 12
      },
      {
        id: "package-2-semaines", 
        name: "Package 2 Semaines",
        price: 4.8,
        tickets: 24
      },
      {
        id: "package-1-mois",
        name: "Package 1 Mois", 
        price: 9.6,
        tickets: 48
      }
    ];
    
    for (const pkg of packages) {
      await prisma.package.create({
        data: pkg
      });
    }
    
    console.log('✅ Packages updated successfully!');
    console.log('Created packages:');
    
    const createdPackages = await prisma.package.findMany();
    createdPackages.forEach((pkg, i) => {
      console.log(`${i+1}. ${pkg.name}: ${pkg.price} DT, ${pkg.tickets} tickets`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error updating packages:', error);
    await prisma.$disconnect();
  }
}

updatePackages();
