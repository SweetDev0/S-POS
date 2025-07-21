const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/system.db');
    
    // Data klasörünü oluştur
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(this.dbPath);
  }

  getDbPath() {
    return this.dbPath;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Users tablosu
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            license_type TEXT DEFAULT 'general',
            license_expires DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Products tablosu
        this.db.run(`
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            barcode TEXT UNIQUE,
            category TEXT,
            price REAL NOT NULL,
            cost_price REAL,
            stock_quantity INTEGER DEFAULT 0,
            min_stock INTEGER DEFAULT 0,
            unit TEXT DEFAULT 'adet',
            description TEXT,
            image_url TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Sales tablosu
        this.db.run(`
          CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total_amount REAL NOT NULL,
            payment_method TEXT DEFAULT 'cash',
            payment_status TEXT DEFAULT 'completed',
            sale_type TEXT DEFAULT 'retail',
            table_id INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (table_id) REFERENCES tables (id)
          )
        `);

        // Sale Items tablosu
        this.db.run(`
          CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
          )
        `);

        // Tables tablosu (Kafe için)
        this.db.run(`
          CREATE TABLE IF NOT EXISTS tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            capacity INTEGER DEFAULT 4,
            status TEXT DEFAULT 'empty',
            current_order_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Migration: status sütunu varsa ve değeri 'available' ise 'empty' olarak güncelle
        this.db.run(`UPDATE tables SET status = 'empty' WHERE status = 'available' OR status IS NULL`);

        // Open Orders tablosu (Kafe için)
        this.db.run(`
          CREATE TABLE IF NOT EXISTS open_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_id INTEGER NOT NULL,
            user_id INTEGER,
            status TEXT DEFAULT 'open',
            total_amount REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (table_id) REFERENCES tables (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Order Items tablosu (Kafe için)
        this.db.run(`
          CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES open_orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
          )
        `);

        // Table Orders tablosu (Kafe için)
        this.db.run(`
          CREATE TABLE IF NOT EXISTS table_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_id INTEGER NOT NULL,
            total REAL DEFAULT 0,
            status TEXT DEFAULT 'active',
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            closed_at DATETIME
          )
        `);

        // Table Order Items tablosu (Kafe için)
        this.db.run(`
          CREATE TABLE IF NOT EXISTS table_order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            total REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES table_orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
          )
        `);

        // Migration: user_id sütunu ekle (varsa atla)
        const migrations = [
          { table: 'products', column: 'user_id', type: 'INTEGER' },
          { table: 'tables', column: 'user_id', type: 'INTEGER' },
          { table: 'sales', column: 'user_id', type: 'INTEGER' },
          { table: 'sale_items', column: 'user_id', type: 'INTEGER' },
          { table: 'open_orders', column: 'user_id', type: 'INTEGER' },
          { table: 'order_items', column: 'user_id', type: 'INTEGER' },
        ];
        migrations.forEach(({ table, column, type }) => {
          this.db.all(`PRAGMA table_info(${table})`, (err, columns) => {
            if (!err && columns && !columns.some(col => col.name === column)) {
              this.db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
            }
          });
        });

        // Migration: number sütunu ekle (varsa atla)
        this.db.all(`PRAGMA table_info(tables)`, (err, columns) => {
          if (!err && columns && !columns.some(col => col.name === 'number')) {
            this.db.run(`ALTER TABLE tables ADD COLUMN number INTEGER`);
          }
        });

        // Varsayılan kullanıcı oluştur
        this.createDefaultUser();
        
        // Varsayılan masalar oluştur
        // this.createDefaultTables();

        resolve();
      });
    });
  }

  createDefaultUser() {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('QQWASER3145', 10);
    
    this.db.run(`
      INSERT OR IGNORE INTO users (email, password, name, role, license_type)
      VALUES ('miracege0201@hotmail.com', ?, 'Sweetdev0', 'admin', 'general')
    `, [hashedPassword]);
  }

  createDefaultTables() {
    // 10 masa oluştur
    for (let i = 1; i <= 10; i++) {
      this.db.run(`
        INSERT OR IGNORE INTO tables (name, capacity, status)
        VALUES (?, ?, 'available')
      `, [`Masa ${i}`, 4]);
    }
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      this.db.close(() => {
        resolve();
      });
    });
  }

  // Tüm masaları sil (geçici bakım fonksiyonu)
  async deleteAllTables() {
    await this.db.run('DELETE FROM tables');
    return { success: true };
  }
}

module.exports = Database; 