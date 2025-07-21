const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Kullanıcı kaydı
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    // Email zaten var mı?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: { message: 'Bu e-posta adresi ile zaten bir hesap var.' } });
    }
    // Şifreyi hashle
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, name }
    });
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: { message: 'Kayıt sırasında hata oluştu.' } });
  }
});

// Kullanıcı girişi
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'E-posta adresi veya şifre hatalı' } });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: { message: 'E-posta adresi veya şifre hatalı' } });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Giriş sırasında hata oluştu' } });
  }
});

module.exports = router; 