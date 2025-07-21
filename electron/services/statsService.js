class StatsService {
  constructor(db) {
    this.db = db;
  }

  async getOverallStats(userId, category) {
    try {
      // Base query for joining sales, sale_items, and products
      const baseQuery = `
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        WHERE s.user_id = ? AND p.category = ?
      `;

      const totalSales = await this.db.get(
        `SELECT COUNT(DISTINCT s.id) as count FROM sales s JOIN sale_items si ON s.id = si.sale_id JOIN products p ON p.id = si.product_id WHERE s.user_id = ? AND p.category = ?`,
        [userId, category]
      );
      
      const totalRevenue = await this.db.get(
        `SELECT SUM(si.total_price) as revenue ${baseQuery}`,
        [userId, category]
      );

      const totalProductsSold = await this.db.get(
        `SELECT SUM(si.quantity) as count ${baseQuery}`,
        [userId, category]
      );

      const topProducts = await this.db.query(
        `SELECT p.name, SUM(si.quantity) as total_sold
         ${baseQuery}
         GROUP BY p.name
         ORDER BY total_sold DESC
         LIMIT 10`,
        [userId, category]
      );

      return {
        totalSales: totalSales?.count || 0,
        totalRevenue: totalRevenue?.revenue || 0,
        totalProductsSold: totalProductsSold?.count || 0,
        topProducts: topProducts || [],
      };
    } catch (error) {
      console.error('Error fetching overall stats by category:', error);
      throw error;
    }
  }

  // Genel sistem istatistikleri
  async getSystemStats() {
    try {
      // Toplam ürün sayısı
      const productsResult = await this.db.get('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
      const totalProducts = productsResult?.count || 0;

      // Toplam satış sayısı ve gelir
      const salesResult = await this.db.get(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(total_amount), 0) as total_revenue
        FROM sales 
        WHERE status = 'completed'
      `);
      const totalSales = salesResult?.total_sales || 0;
      const totalRevenue = salesResult?.total_revenue || 0;

      // Aktif kullanıcı sayısı
      const usersResult = await this.db.get('SELECT COUNT(*) as count FROM users');
      const activeUsers = usersResult?.count || 0;

      // Kafe masaları ve siparişler
      const tablesResult = await this.db.get('SELECT COUNT(*) as count FROM tables');
      const totalTables = tablesResult?.count || 0;

      const openOrdersResult = await this.db.get('SELECT COUNT(*) as count FROM open_orders WHERE status = "open"');
      const openOrders = openOrdersResult?.count || 0;

      return {
        totalProducts,
        totalSales,
        totalRevenue,
        activeUsers,
        totalTables,
        openOrders
      };
    } catch (error) {
      console.error('İstatistik hesaplama hatası:', error);
      return {
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        activeUsers: 0,
        totalTables: 0,
        openOrders: 0
      };
    }
  }

  // Kategori bazında ürün istatistikleri
  async getProductStats() {
    try {
      const result = await this.db.query(`
        SELECT 
          category,
          COUNT(*) as count,
          COALESCE(SUM(stock_quantity), 0) as total_stock,
          COALESCE(SUM(CASE WHEN stock_quantity <= min_stock THEN 1 ELSE 0 END), 0) as low_stock_count
        FROM products 
        WHERE is_active = 1 
        GROUP BY category
      `);

      return result || [];
    } catch (error) {
      console.error('Ürün istatistikleri hatası:', error);
      return [];
    }
  }

  // Satış istatistikleri (son 30 gün)
  async getSalesStats(days = 30) {
    try {
      const result = await this.db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as sales_count,
          COALESCE(SUM(total_amount), 0) as daily_revenue
        FROM sales 
        WHERE created_at >= datetime('now', '-${days} days')
          AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      return result || [];
    } catch (error) {
      console.error('Satış istatistikleri hatası:', error);
      return [];
    }
  }

  // Kullanıcı bazında istatistikler
  async getUserStats() {
    try {
      const result = await this.db.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          COUNT(DISTINCT p.id) as product_count,
          COUNT(DISTINCT s.id) as sales_count,
          COALESCE(SUM(s.total_amount), 0) as total_revenue
        FROM users u
        LEFT JOIN products p ON u.id = p.user_id AND p.is_active = 1
        LEFT JOIN sales s ON u.id = s.user_id AND s.status = 'completed'
        GROUP BY u.id, u.name, u.email, u.role
      `);

      return result || [];
    } catch (error) {
      console.error('Kullanıcı istatistikleri hatası:', error);
      return [];
    }
  }

  // Günlük aktivite istatistikleri
  async getDailyActivity() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const result = await this.db.get(`
        SELECT 
          (SELECT COUNT(*) FROM products WHERE DATE(created_at) = '${today}') as new_products,
          (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = '${today}' AND status = 'completed') as today_sales,
          (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE DATE(created_at) = '${today}' AND status = 'completed') as today_revenue,
          (SELECT COUNT(*) FROM open_orders WHERE status = 'open') as active_orders
      `);

      return result || {
        new_products: 0,
        today_sales: 0,
        today_revenue: 0,
        active_orders: 0
      };
    } catch (error) {
      console.error('Günlük aktivite hatası:', error);
      return {
        new_products: 0,
        today_sales: 0,
        today_revenue: 0,
        active_orders: 0
      };
    }
  }

  async resetMarketStats(userId) {
    // Sadece market satışlarını ve kalemlerini sil (table_id IS NULL olanlar)
    await this.db.run('DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id = ? AND table_id IS NULL)', [userId]);
    await this.db.run('DELETE FROM sales WHERE user_id = ? AND table_id IS NULL', [userId]);
  }

  async resetKafeStats(userId) {
    // Kafe satışlarını ve kalemlerini sil (table_id IS NOT NULL olanlar)
    await this.db.run('DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id = ? AND table_id IS NOT NULL)', [userId]);
    await this.db.run('DELETE FROM sales WHERE user_id = ? AND table_id IS NOT NULL', [userId]);
    await this.db.run('DELETE FROM table_order_items WHERE order_id IN (SELECT id FROM table_orders WHERE user_id = ?)', [userId]);
    await this.db.run('DELETE FROM table_orders WHERE user_id = ?', [userId]);
  }
}

module.exports = StatsService; 