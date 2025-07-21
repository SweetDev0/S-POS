const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const tableRoutes = require('./routes/table');
const marketSaleRoutes = require('./routes/marketSale');
const cafeOrderRoutes = require('./routes/cafeOrder');

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/tables', tableRoutes);
app.use('/market-sales', marketSaleRoutes);
app.use('/cafe-orders', cafeOrderRoutes);

app.get('/', (req, res) => {
  res.send('API Çalışıyor!');
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 