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

// Ürünleri listele (sadece giriş yapan kullanıcının ürünleri)
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const products = await prisma.product.findMany({ where: { ownerId: userId } });
  res.json(products);
});

// Ürün ekle
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { name, stock, price } = req.body;
  try {
    const product = await prisma.product.create({
      data: { name, stock, price, ownerId: userId }
    });
    res.json({ success: true, product });
  } catch (e) {
    res.status(400).json({ success: false, error: { message: 'Ürün eklenemedi.' } });
  }
});

// Ürün güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { name, stock, price } = req.body;
  try {
    const product = await prisma.product.updateMany({
      where: { id, ownerId: userId },
      data: { name, stock, price }
    });
    if (product.count === 0) return res.status(404).json({ success: false, error: { message: 'Ürün bulunamadı.' } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: { message: 'Ürün güncellenemedi.' } });
  }
});

// Ürün sil
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const product = await prisma.product.deleteMany({ where: { id, ownerId: userId } });
    if (product.count === 0) return res.status(404).json({ success: false, error: { message: 'Ürün bulunamadı.' } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: { message: 'Ürün silinemedi.' } });
  }
});

module.exports = router; 