const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestStudent() {
  try {
    console.log('Creating test student with document...\n');
    
    // Create a test base64 image (1x1 pixel red dot)
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const student = await prisma.user.create({
      data: {
        firstName: 'Student',
        lastName: 'WithDoc',
        email: 'studentdoc@test.com',
        password: hashedPassword,
        role: 'STUDENT',
        status: 'PENDING',
        documentImage: base64Image
      }
    });
    
    console.log('Test student created successfully!');
    console.log(`- Name: ${student.firstName} ${student.lastName}`);
    console.log(`- Email: ${student.email}`);
    console.log(`- Role: ${student.role}`);
    console.log(`- Status: ${student.status}`);
    console.log(`- Document: ${student.documentImage ? 'YES' : 'NO'}`);
    console.log(`- Document length: ${student.documentImage?.length || 0} characters`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestStudent();
