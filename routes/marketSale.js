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

// Satışları listele (sadece giriş yapan kullanıcının satışları)
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const sales = await prisma.marketSale.findMany({
    where: { userId },
    include: { product: true }
  });
  res.json(sales);
});

// Satış ekle
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { productId, quantity, totalPrice } = req.body;
  try {
    const sale = await prisma.marketSale.create({
      data: { productId, quantity, totalPrice, userId }
    });
    res.json({ success: true, sale });
  } catch (e) {
    res.status(400).json({ success: false, error: { message: 'Satış eklenemedi.' } });
  }
});

// Satış sil
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const sale = await prisma.marketSale.deleteMany({ where: { id, userId } });
    if (sale.count === 0) return res.status(404).json({ success: false, error: { message: 'Satış bulunamadı.' } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: { message: 'Satış silinemedi.' } });
  }
});

module.exports = router; 