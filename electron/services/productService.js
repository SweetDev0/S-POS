const AuthService = require('./authService');

class ProductService {
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

  async getAllProducts(userId, filters = {}) {
    try {
      console.log('getAllProducts called with userId:', userId);
      
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

      let query = 'SELECT * FROM products WHERE user_id = ?';
      const params = [userId];

      // Filtreler
      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR barcode LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (filters.minPrice) {
        query += ' AND price >= ?';
        params.push(filters.minPrice);
      }

      if (filters.maxPrice) {
        query += ' AND price <= ?';
        params.push(filters.maxPrice);
      }

      query += ' ORDER BY name ASC';

      const products = await this.db.query(query, params);
      console.log(`Found ${products.length} products`);
      return products;
    } catch (error) {
      console.error('getAllProducts error:', error);
      throw error;
    }
  }

  async addProduct(productData, userId) {
    try {
      console.log('addProduct called with userId:', userId);
      
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

      const { name, price, stock, category, barcode, description } = productData;

      // stock değeri null veya undefined ise, veritabanına NULL olarak kaydet
      const stockQuantity = stock === undefined || stock === null || stock === '' ? null : parseInt(stock);

      // Barcode kontrolü
      if (barcode) {
        const existingProduct = await this.db.get(
          'SELECT id FROM products WHERE barcode = ?',
          [barcode]
        );
        if (existingProduct) {
          throw new Error('Bu barkod zaten kullanımda');
        }
      }

      // 'stock' yerine 'stock_quantity' kullan
      const result = await this.db.run(
        'INSERT INTO products (name, price, stock_quantity, category, barcode, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, price, stockQuantity, category, barcode, description, userId]
      );

      const newProduct = await this.db.get(
        'SELECT * FROM products WHERE id = ?',
        [result.id]
      );

      console.log('Product added successfully:', newProduct);
      return { success: true, product: newProduct };
    } catch (error) {
      console.error('addProduct error:', error);
      throw error;
    }
  }

  async updateProduct(productData, userId) {
    try {
      console.log('updateProduct called with userId:', userId);
      
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

      const { id, name, price, stock, category, barcode, description } = productData;

      const stockQuantity = stock === undefined || stock === null || stock === '' ? null : parseInt(stock);

      // Barcode kontrolü (kendi barkodu hariç)
      if (barcode) {
        const existingProduct = await this.db.get(
          'SELECT id FROM products WHERE barcode = ? AND id != ?',
          [barcode, id]
        );
        if (existingProduct) {
          throw new Error('Bu barkod zaten kullanımda');
        }
      }

      console.log('UPDATE products SET ...', {id, userId, stockQuantity, name, price, category, barcode, description});
      // 'stock' yerine 'stock_quantity' kullan
      await this.db.run(
        'UPDATE products SET name = ?, price = ?, stock_quantity = ?, category = ?, barcode = ?, description = ? WHERE id = ? AND user_id = ?',
        [name, price, stockQuantity, category, barcode, description, id, userId]
      );
      const updatedProduct = await this.db.get(
        'SELECT * FROM products WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      console.log('Product updated successfully:', updatedProduct);
      return { success: true, product: updatedProduct };
    } catch (error) {
      console.error('updateProduct error:', error);
      throw error;
    }
  }

  async deleteProduct(productId, userId) {
    try {
      console.log('deleteProduct called for productId:', productId, 'userId:', userId);

      const user = await this.authService.getUserById(userId);
      if (!this.hasPermission(user)) {
        throw new Error('Bu işlem için yetkiniz yok');
      }

      const product = await this.db.get('SELECT * FROM products WHERE id = ?', [productId]);
      if (!product) {
        throw new Error('Ürün bulunamadı.');
      }

      // Admin can delete any product, other users can only delete their own
      if (user.role !== 'admin' && String(product.user_id) !== String(userId)) {
        throw new Error('Bu ürünü silme yetkiniz yok.');
      }

      await this.db.run('DELETE FROM products WHERE id = ?', [productId]);
      console.log('Product deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('deleteProduct error:', error);
      throw error;
    }
  }

  async getProductByBarcode(barcode, userId) {
    try {
      console.log('getProductByBarcode called with barcode:', barcode);
      
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

      const product = await this.db.get(
        'SELECT * FROM products WHERE barcode = ? AND user_id = ?',
        [barcode, userId]
      );

      if (!product) {
        throw new Error('Ürün bulunamadı');
      }

      console.log('Product found:', product);
      return product;
    } catch (error) {
      console.error('getProductByBarcode error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const categories = await this.db.query(
        'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category'
      );
      return categories.map(cat => cat.category);
    } catch (error) {
      console.error('getCategories error:', error);
      throw error;
    }
  }

  async updateStock(productId, newStock) {
    try {
      console.log('updateStock called for productId:', productId, 'newStock:', newStock);
      
      // Stok negatif olamaz
      if (newStock < 0) {
        throw new Error('Stok miktarı negatif olamaz');
      }

      await this.db.run(
        'UPDATE products SET stock = ? WHERE id = ?',
        [newStock, productId]
      );

      const updatedProduct = await this.db.get(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );

      console.log('Stock updated successfully:', updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error('updateStock error:', error);
      throw error;
    }
  }
}

module.exports = ProductService; 