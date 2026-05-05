const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createDefaultAdmin() {
  try {
    console.log('=== CREATING DEFAULT ADMIN ACCOUNT ===');
    
    const defaultAdmin = {
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@restaurant.com',
      password: 'admin123',
      role: 'ADMIN'
    };

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: defaultAdmin.email }
    });

    if (existingAdmin) {
      console.log(`❌ Admin with email "${defaultAdmin.email}" already exists!`);
      console.log('If you want to reset the password, delete the user first.');
      await prisma.$disconnect();
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        firstName: defaultAdmin.firstName,
        lastName: defaultAdmin.lastName,
        email: defaultAdmin.email,
        password: hashedPassword,
        role: defaultAdmin.role,
        status: 'APPROVED'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true
      }
    });

    console.log('✅ Default admin created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${defaultAdmin.password}`);
    console.log(`👤 Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`🎭 Role: ${admin.role}`);
    console.log(`📊 Status: ${admin.status}`);
    
    console.log('\n🚀 You can now login with these credentials!');
    console.log('⚠️  Remember to change the password after first login!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    await prisma.$disconnect();
  }
}

createDefaultAdmin();
