require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Register
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Bu e-posta ile zaten kayıt var.' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hash, name } });
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    res.status(500).json({ message: 'Kayıt sırasında hata oluştu.' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    // Login log
    await prisma.loginLog.create({ data: { userId: user.id } });
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: 'Giriş sırasında hata oluştu.' });
  }
});

// Admin: Kullanıcı listesi
function authenticateAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Token gerekli.' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin yetkisi yok.' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Geçersiz token.' });
  }
}

app.get('/admin/users', authenticateAdmin, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
  res.json(users);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Auth server running on http://localhost:${PORT}`)); 