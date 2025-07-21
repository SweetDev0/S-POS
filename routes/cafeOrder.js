const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Tüm siparişleri getir
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.cafeOrder.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni sipariş oluştur
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tableId, items, totalAmount, status = 'PENDING' } = req.body;

    const order = await prisma.cafeOrder.create({
      data: {
        tableId,
        totalAmount,
        status,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sipariş durumunu güncelle
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.cafeOrder.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sipariş detayını getir
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.cafeOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Siparişi sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cafeOrder.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Sipariş silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 