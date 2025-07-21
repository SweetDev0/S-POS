const AuthService = require('./authService');

class SalesService {
  constructor(db) {
    this.db = db;
    this.authService = new AuthService(db);
  }

  // Online kullanıcılar için esnek yetki kontrolü
  hasPermission(user, requiredRole = 'user') {
    // Online kullanıcılar her şeye erişebilir
    if (user.email && user.email.includes('online-user')) {
      return true;
    }
    
    // Online user ID kontrolü
    if (user.id === 'online-user' || user.userId === 'online-user') {
      return true;
    }
    
    // UUID formatındaki kullanıcılar için özel kontrol
    if (user.id && typeof user.id === 'string' && user.id.includes('-') && user.id.length > 20) {
      return true;
    }
    
    // Admin kullanıcılar her şeye erişebilir
    if (user.role === 'admin') {
      return true;
    }
    
    // Normal kullanıcılar sadece kendi işlemlerini yapabilir
    return user.role === requiredRole;
  }

  async createSale(saleData) {
    try {
      console.log('createSale called with data:', saleData);
      const { items, total_amount, payment_method, user_id, userId: userIdAlt, table_id } = saleData;
      const userId = user_id || userIdAlt;
      // Kullanıcı yetkisini kontrol et
      const user = await this.authService.getUserById(userId);
      if (!this.hasPermission(user)) {
        throw new Error('Bu işlem için yetkiniz yok');
      }
      // Satış kaydı oluştur
      const saleResult = await this.db.run(
        'INSERT INTO sales (total_amount, payment_method, user_id, table_id, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [total_amount, payment_method, userId, table_id]
      );
      const saleId = saleResult.id;
      // Satış detaylarını kaydet
      for (const item of items) {
        await this.db.run(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
          [saleId, item.product_id, item.quantity, item.price, item.total]
        );
        // Stok güncelle
        await this.db.run(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
      const sale = await this.db.get(
        'SELECT * FROM sales WHERE id = ?',
        [saleId]
      );
      console.log('Sale created successfully:', sale);
      return sale;
    } catch (error) {
      console.error('createSale error:', error);
      throw error;
    }
  }

  async getAllSales(userId, filters = {}) {
    try {
      console.log('getAllSales called with userId:', userId, 'filters:', filters);
      let query = 'SELECT s.*, u.name as user_name FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE s.user_id = ?';
      const params = [userId];
      if (filters.startDate) {
        query += ' AND DATE(s.created_at) >= ?';
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        query += ' AND DATE(s.created_at) <= ?';
        params.push(filters.endDate);
      }
      if (filters.paymentMethod) {
        query += ' AND s.payment_method = ?';
        params.push(filters.paymentMethod);
      }
      query += ' ORDER BY s.created_at DESC';
      const sales = await this.db.query(query, params);
      console.log(`Found ${sales.length} sales`);
      return sales;
    } catch (error) {
      console.error('getAllSales error:', error);
      throw error;
    }
  }

  async getStatistics(dateRange) {
    try {
      console.log('getStatistics called with dateRange:', dateRange);
      
      const { startDate, endDate } = dateRange;
      
      const stats = await this.db.get(`
        SELECT 
          COUNT(*) as total_sales,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_sale,
          COUNT(DISTINCT user_id) as unique_users
        FROM sales 
        WHERE DATE(created_at) BETWEEN ? AND ?
      `, [startDate, endDate]);

      console.log('Statistics calculated:', stats);
      return stats;
    } catch (error) {
      console.error('getStatistics error:', error);
      throw error;
    }
  }

  // Kafe masaları için metodlar
  async getAllTables(userId) {
    try {
      console.log('getAllTables called with userId:', userId);
      // Online kullanıcı kontrolü - UUID formatı dahil
      if (userId === 'online-user' || userId === 'online-user@system.com' || 
          (userId && typeof userId === 'string' && userId.includes('-') && userId.length > 20)) {
        console.log('Online user detected (UUID or online-user), skipping permission check');
        // Online kullanıcılar için yetki kontrolü atla
      } else {
        // Kullanıcı yetkisini kontrol et
        try {
          const user = await this.authService.getUserById(userId);
          if (!this.hasPermission(user)) {
            throw new Error('Bu işlem için yetkiniz yok');
          }
        } catch (error) {
          console.log('User permission check failed:', error.message);
          // Online kullanıcı olabilir, devam et
          if (!error.message.includes('online-user')) {
            throw error;
          }
        }
      }
      // Sadece ilgili kullanıcının masalarını getir
      const tables = await this.db.query(
        'SELECT * FROM tables WHERE user_id = ? ORDER BY number ASC',
        [userId]
      );
      console.log(`Found ${tables.length} tables`);
      return tables;
    } catch (error) {
      console.error('getAllTables error:', error);
      throw error;
    }
  }

  async addTable(tableName, userId, number = null) {
    try {
      console.log('addTable called with tableName:', tableName, 'userId:', userId, 'number:', number);
      // Online kullanıcı kontrolü - UUID formatı dahil
      if (userId === 'online-user' || userId === 'online-user@system.com' || 
          (userId && typeof userId === 'string' && userId.includes('-') && userId.length > 20)) {
        console.log('Online user detected (UUID or online-user), skipping permission check');
        // Online kullanıcılar için yetki kontrolü atla
      } else {
        // Kullanıcı yetkisini kontrol et
        try {
          const user = await this.authService.getUserById(userId);
          if (!this.hasPermission(user)) {
            throw new Error('Bu işlem için yetkiniz yok');
          }
        } catch (error) {
          console.log('User permission check failed:', error.message);
          // Online kullanıcı olabilir, devam et
          if (!error.message.includes('online-user')) {
            throw error;
          }
        }
      }
      // Kullanıcıdan gelen number'ı kullan
      const masaNumber = number ? parseInt(number) : null;
      if (!masaNumber) throw new Error('Masa numarası zorunludur');
      // Aynı kullanıcıya ait aynı numarada masa var mı kontrol et
      const existing = await this.db.get('SELECT * FROM tables WHERE user_id = ? AND number = ?', [userId, masaNumber]);
      if (existing) throw new Error('Bu numarada bir masa zaten var');
      const result = await this.db.run(
        'INSERT INTO tables (name, number, status, user_id) VALUES (?, ?, ?, ?)',
        [tableName, masaNumber, 'empty', userId]
      );
      const newTable = await this.db.get(
        'SELECT * FROM tables WHERE id = ?',
        [result.id]
      );
      console.log('Table added successfully:', newTable);
      return { success: true, table: newTable };
    } catch (error) {
      console.error('addTable error:', error);
      throw error;
    }
  }

  async deleteTable(tableId, userId) {
    try {
      console.log('deleteTable called for tableId:', tableId, 'userId:', userId);
      // Online kullanıcı kontrolü - UUID formatı dahil
      if (userId === 'online-user' || userId === 'online-user@system.com' || 
          (userId && typeof userId === 'string' && userId.includes('-') && userId.length > 20)) {
        console.log('Online user detected (UUID or online-user), skipping permission check');
        // Online kullanıcılar için yetki kontrolü atla
      } else {
        // Kullanıcı yetkisini kontrol et
        try {
          const user = await this.authService.getUserById(userId);
          if (!this.hasPermission(user)) {
            throw new Error('Bu işlem için yetkiniz yok');
          }
        } catch (error) {
          console.log('User permission check failed:', error.message);
          // Online kullanıcı olabilir, devam et
          if (!error.message.includes('online-user')) {
            throw error;
          }
        }
      }
      // Masanın aktif siparişi var mı kontrol et
      const activeOrder = await this.db.get(
        'SELECT id FROM table_orders WHERE table_id = ? AND status = "active"',
        [tableId]
      );
      if (activeOrder) {
        throw new Error('Bu masada aktif sipariş var. Önce siparişi kapatın.');
      }
      // Sadece ilgili kullanıcıya ait masayı sil
      await this.db.run('DELETE FROM tables WHERE id = ? AND user_id = ?', [tableId, userId]);
      console.log('Table deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('deleteTable error:', error);
      throw error;
    }
  }

  async createTableOrder(orderData) {
    try {
      console.log('createTableOrder called with data:', orderData);
      const { tableId, table_id, items, total_amount, userId, user_id } = orderData;
      const realTableId = tableId || table_id;
      const realUserId = userId || user_id;
      // Online kullanıcı kontrolü - daha esnek
      if (realUserId === 'online-user' || realUserId === 'online-user@system.com' || 
          (realUserId && typeof realUserId === 'string' && realUserId.includes('-') && realUserId.length > 20)) {
        console.log('Online user detected, skipping permission check');
        // Online kullanıcılar için yetki kontrolü atla
      } else {
        // Kullanıcı yetkisini kontrol et
        try {
          const user = await this.authService.getUserById(realUserId);
          if (!this.hasPermission(user)) {
            throw new Error('Bu işlem için yetkiniz yok');
          }
        } catch (error) {
          console.log('User permission check failed:', error.message);
          // Online kullanıcı olabilir, devam et
          if (!error.message.includes('online-user')) {
            throw error;
          }
        }
      }
      // Masanın durumunu kontrol et
      console.log('DEBUG: tableId:', realTableId, 'realUserId:', realUserId, typeof realTableId, typeof realUserId);
      const table = await this.db.get('SELECT * FROM tables WHERE id = ? AND user_id = ?', [realTableId, realUserId]);
      console.log('DEBUG: id+user_id ile masa:', table);
      const tableById = await this.db.get('SELECT * FROM tables WHERE id = ?', [realTableId]);
      console.log('DEBUG: Sadece id ile masa:', tableById);
      if (!table) throw new Error('Masa bulunamadı');
      if (table.status === 'occupied') throw new Error('Bu masa zaten dolu');
      // Sipariş oluştur
      let orderResult;
      try {
        orderResult = await this.db.run(
          'INSERT INTO table_orders (table_id, total_amount, status, user_id, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [realTableId, total_amount, 'active', realUserId]
        );
        console.log('INSERT INTO table_orders result:', orderResult);
      } catch (err) {
        console.error('INSERT INTO table_orders error:', err);
        throw err;
      }
      const orderId = orderResult.id;
      // Sipariş detaylarını kaydet
      for (const item of items) {
        try {
          await this.db.run(
            'INSERT INTO table_order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
            [orderId, item.product_id, item.quantity, item.price, item.total]
          );
          console.log('[createTableOrder] Ürün eklendi:', item);
        } catch (err) {
          console.error('[createTableOrder] Ürün eklenemedi:', item, err);
        }
        // Stok güncelle
        await this.db.run(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
      // Masanın durumunu güncelle
      const updateResult = await this.db.run(
        'UPDATE tables SET status = ? WHERE id = ?',
        ['occupied', realTableId]
      );
      console.log('UPDATE tables status result:', updateResult, 'tableId:', realTableId);
      const order = await this.db.get(
        'SELECT * FROM table_orders WHERE id = ?',
        [orderId]
      );
      console.log('Table order created successfully:', order);
      return order;
    } catch (error) {
      console.error('createTableOrder error:', error);
      throw error;
    }
  }

  async closeTableOrder(orderId) {
    try {
      console.log('closeTableOrder called for orderId:', orderId);
      
      const order = await this.db.get(
        'SELECT * FROM table_orders WHERE id = ?',
        [orderId]
      );

      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

      if (order.status === 'closed') {
        throw new Error('Bu sipariş zaten kapatılmış');
      }

      // 1. Sipariş kalemlerini al
      const items = await this.db.query(
        'SELECT * FROM table_order_items WHERE order_id = ?',
        [orderId]
      );

      // 2. Ana 'sales' tablosuna yeni bir satış kaydı oluştur
      const saleResult = await this.db.run(
        'INSERT INTO sales (total_amount, payment_method, user_id, created_at, table_id) VALUES (?, ?, ?, ?, ?)',
        [order.total_amount, 'cash', order.user_id, order.closed_at || new Date().toISOString(), order.table_id]
      );
      const saleId = saleResult.id;

      // 3. Her bir sipariş kalemini 'sale_items' tablosuna kopyala
      for (const item of items) {
        await this.db.run(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
          [saleId, item.product_id, item.quantity, item.price, item.total]
        );
      }

      // 4. Siparişi kapat
      await this.db.run(
        'UPDATE table_orders SET status = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['closed', orderId]
      );

      // 5. Masanın durumunu güncelle
      await this.db.run(
        'UPDATE tables SET status = ? WHERE id = ?',
        ['empty', order.table_id]
      );

      console.log(`Table order ${orderId} closed and sale ${saleId} created successfully.`);
      return { success: true };
    } catch (error) {
      console.error('closeTableOrder error:', error);
      throw error;
    }
  }

  async getTableOrderById(orderId) {
    try {
      console.log('getTableOrderById called for orderId:', orderId);
      
      const order = await this.db.get(
        'SELECT * FROM table_orders WHERE id = ?',
        [orderId]
      );

      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

      // Sipariş detaylarını al
      const items = await this.db.query(
        'SELECT * FROM table_order_items WHERE order_id = ?',
        [orderId]
      );

      order.items = items;
      console.log('Table order found:', order);
      return order;
    } catch (error) {
      console.error('getTableOrderById error:', error);
      throw error;
    }
  }

  async getActiveTableOrder(tableId) {
    try {
      // Aktif siparişi bul
      const order = await this.db.get(
        'SELECT * FROM table_orders WHERE table_id = ? AND status = "active"',
        [tableId]
      );
      console.log('[getActiveTableOrder] order:', order);
      if (!order) return null;
      // Sipariş detaylarını al (ürün adı ile birlikte)
      const items = await this.db.query(
        `SELECT toi.*, p.name FROM table_order_items toi
         LEFT JOIN products p ON toi.product_id = p.id
         WHERE toi.order_id = ?`,
        [order.id]
      );
      console.log('[getActiveTableOrder] items:', items);
      order.items = items;
      return order;
    } catch (error) {
      console.error('getActiveTableOrder error:', error);
      throw error;
    }
  }

  async updateTableOrder(orderId, items, total_amount) {
    try {
      console.log('[updateTableOrder] orderId:', orderId, 'items:', items, 'total_amount:', total_amount);
      // Eski ürünleri sil
      await this.db.run('DELETE FROM table_order_items WHERE order_id = ?', [orderId]);
      // Yeni ürünleri ekle
      for (const item of items) {
        try {
          await this.db.run(
            'INSERT INTO table_order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
            [orderId, item.product_id, item.quantity, item.price, item.total]
          );
          console.log('[updateTableOrder] Ürün eklendi:', item);
        } catch (err) {
          console.error('[updateTableOrder] Ürün eklenemedi:', item, err);
        }
      }
      // Toplamı güncelle
      await this.db.run('UPDATE table_orders SET total_amount = ? WHERE id = ?', [total_amount, orderId]);
      // Güncellenmiş siparişi döndür
      const order = await this.db.get('SELECT * FROM table_orders WHERE id = ?', [orderId]);
      const updatedItems = await this.db.query(
        `SELECT toi.*, p.name FROM table_order_items toi
         LEFT JOIN products p ON toi.product_id = p.id
         WHERE toi.order_id = ?`,
        [orderId]
      );
      console.log('[updateTableOrder] updated order:', order);
      console.log('[updateTableOrder] updated items:', updatedItems);
      order.items = updatedItems;
      return order;
    } catch (error) {
      console.error('updateTableOrder error:', error);
      throw error;
    }
  }
}

module.exports = SalesService; 