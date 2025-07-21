const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Önce mevcut admin kullanıcısını kontrol et
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@system.com'
      }
    });

    if (existingAdmin) {
      console.log('Admin kullanıcısı zaten mevcut!');
      console.log('Email:', existingAdmin.email);
      console.log('Şifre: admin123');
      return;
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Admin kullanıcısını oluştur
    const admin = await prisma.user.create({
      data: {
        email: 'admin@system.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        is_active: true
      }
    });

    console.log('Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('Email:', admin.email);
    console.log('Şifre: admin123');
    console.log('ID:', admin.id);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 