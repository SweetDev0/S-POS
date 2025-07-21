const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// JWT doğrulama middleware'i
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Masaları listele (sadece giriş yapan kullanıcının masaları)
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const tables = await prisma.table.findMany({ where: { userId } });
  res.json(tables);
});

// Masa ekle
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { name } = req.body;
  try {
    const table = await prisma.table.create({
      data: { name, userId }
    });
    res.json({ success: true, table });
  } catch (e) {
    res.status(400).json({ success: false, error: { message: 'Masa eklenemedi.' } });
  }
});

// Masa güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { name } = req.body;
  try {
    const table = await prisma.table.updateMany({
      where: { id, userId },
      data: { name }
    });
    if (table.count === 0) return res.status(404).json({ success: false, error: { message: 'Masa bulunamadı.' } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: { message: 'Masa güncellenemedi.' } });
  }
});

// Masa sil
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const table = await prisma.table.deleteMany({ where: { id, userId } });
    if (table.count === 0) return res.status(404).json({ success: false, error: { message: 'Masa bulunamadı.' } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: { message: 'Masa silinemedi.' } });
  }
});

module.exports = router; 