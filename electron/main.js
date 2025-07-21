const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron');
const fs = require('fs').promises;
app.disableHardwareAcceleration();
const path = require('path');
const http = require('http');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Database ve backend modüllerini import et
const Database = require('./database/database');
const AuthService = require('./services/authService');
const ProductService = require('./services/productService');
const SalesService = require('./services/salesService');
const PaymentService = require('./services/paymentService');
const LicenseService = require('./services/licenseService');
const StatsService = require('./services/statsService');
const BackupService = require('./services/backupService');

let mainWindow;
let db;
let tray = null;

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({ method: 'HEAD', host: 'localhost', port, path: '/' }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    title: 'S-POS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'), // ICO dosyası kullanılıyor
    titleBarStyle: 'default',
    show: false
  });

  if (isDev) {
    const tryPorts = [3000, 3001, 3002];
    (async () => {
      let loaded = false;
      for (const port of tryPorts) {
        if (await checkPort(port)) {
          mainWindow.loadURL(`http://localhost:${port}`);
          loaded = true;
          break;
        }
      }
      if (!loaded) {
        mainWindow.loadURL('http://localhost:3000');
      }
      mainWindow.webContents.openDevTools();
    })();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Database başlatma
async function initializeDatabase() {
  try {
    db = new Database();
    await db.initialize();
    console.log('Database başarıyla başlatıldı');
  } catch (error) {
    console.error('Database başlatma hatası:', error);
    dialog.showErrorBox('Hata', 'Veritabanı başlatılamadı. Uygulama kapatılacak.');
    app.quit();
  }
}

// IPC Handlers - Authentication
ipcMain.handle('auth:login', async (event, credentials) => {
  try {
    const authService = new AuthService(db);
    const result = await authService.login(credentials.email, credentials.password);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:register', async (event, userData) => {
  try {
    const authService = new AuthService(db);
    const result = await authService.register(userData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:check-license', async (event, userId) => {
  try {
    const authService = new AuthService(db);
    const license = await authService.checkLicense(userId);
    return { success: true, data: license };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Products
ipcMain.handle('products:get-all', async (event, { userId, filters }) => {
  try {
    console.log('=== PRODUCTS:GET-ALL DEBUG ===');
    console.log('userId:', userId);
    console.log('filters:', filters);
    console.log('userId type:', typeof userId);
    console.log('userId length:', userId ? userId.length : 'null');
    
    const productService = new ProductService(db);
    const products = await productService.getAllProducts(userId, filters || {});
    console.log('Products found:', products.length);
    return { success: true, data: products };
  } catch (error) {
    console.error('products:get-all error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:add', async (event, { productData, userId }) => {
  try {
    console.log('=== PRODUCTS:ADD DEBUG ===');
    console.log('productData:', productData);
    console.log('userId:', userId);
    console.log('userId type:', typeof userId);
    console.log('userId length:', userId ? userId.length : 'null');
    
    const productService = new ProductService(db);
    const product = await productService.addProduct(productData, userId);
    console.log('Product add result:', product);
    return { success: true, data: product };
  } catch (error) {
    console.error('products:add error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:update', async (event, { productData, userId }) => {
  try {
    console.log('products:update called with userId:', userId);
    const productService = new ProductService(db);
    const product = await productService.updateProduct(productData, userId);
    return { success: true, data: product };
  } catch (error) {
    console.error('products:update error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:delete', async (event, { productId, userId }) => {
  try {
    const productService = new ProductService(db);
    const result = await productService.deleteProduct(productId, userId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:get-by-barcode', async (event, { barcode, userId }) => {
  try {
    const productService = new ProductService(db);
    const product = await productService.getProductByBarcode(barcode, userId);
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('products:get-categories', async (event) => {
  try {
    const productService = new ProductService(db);
    const categories = await productService.getCategories();
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Sales
ipcMain.handle('sales:create', async (event, saleData) => {
  try {
    const salesService = new SalesService(db);
    const sale = await salesService.createSale(saleData);
    return { success: true, data: sale };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sales:get-all', async (event, filters) => {
  try {
    const salesService = new SalesService(db);
    const sales = await salesService.getAllSales(filters);
    return { success: true, data: sales };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Sales Print Handler
ipcMain.handle('sales:print', async (event, saleData) => {
  try {
    // 1. Adisyon metnini oluştur
    const lines = [];
    lines.push('S-POS Kafe Adisyonu');
    lines.push('--------------------------');
    lines.push(`Masa: ${saleData.table_number || saleData.table_id || '-'}  Tarih: ${new Date().toLocaleString('tr-TR')}`);
    lines.push('');
    lines.push('Ürünler:');
    (saleData.items || []).forEach(item => {
      lines.push(`- ${item.name}  ${item.quantity} x ${item.price}₺   ${item.total}₺`);
    });
    lines.push('--------------------------');
    lines.push(`Toplam: ${saleData.total_amount || saleData.total || 0}₺`);
    lines.push('Teşekkürler!');
    const receiptText = lines.join('\n');

    // 2. Basit bir pencere açıp yazdır
    const printWindow = new BrowserWindow({ show: false });
    printWindow.loadURL('data:text/plain;charset=utf-8,' + encodeURIComponent(receiptText));
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({ silent: false }, () => {
        printWindow.close();
      });
    });
    return { success: true, message: 'Adisyon yazdırıldı' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Sales Close Handler
ipcMain.handle('sales:close', async (event, saleData) => {
  try {
    // Burada gerçek fiş kapatma işlemi yapılacak
    console.log('Fiş kapatma işlemi:', saleData);
    
    // Şimdilik başarılı döndürüyoruz
    return { success: true, message: 'Fiş başarıyla kapatıldı' };
  } catch (error) {
    console.error('Fiş kapatma hatası:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sales:get-statistics', async (event, dateRange) => {
  try {
    const salesService = new SalesService(db);
    const stats = await salesService.getStatistics(dateRange);
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Tables (Kafe)
ipcMain.handle('tables:get-all', async (event, userId) => {
  try {
    console.log('=== TABLES:GET-ALL DEBUG ===');
    console.log('userId:', userId);
    console.log('userId type:', typeof userId);
    console.log('userId length:', userId ? userId.length : 'null');

    const salesService = new SalesService(db);
    const tables = await salesService.getAllTables(userId);
    return { success: true, data: tables };
  } catch (error) {
    console.error('tables:get-all error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tables:create-order', async (event, orderData) => {
  try {
    const salesService = new SalesService(db);
    const order = await salesService.createTableOrder(orderData);
    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tables:close-order', async (event, orderId) => {
  try {
    const salesService = new SalesService(db);
    const result = await salesService.closeTableOrder(orderId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tables:add', async (event, { tableName, userId, number }) => {
  try {
    console.log('=== TABLES:ADD DEBUG ===');
    console.log('tableName:', tableName);
    console.log('userId:', userId);
    console.log('number:', number);
    const salesService = new SalesService(db);
    const result = await salesService.addTable(tableName, userId, number);
    console.log('Table add result:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('tables:add error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tables:delete', async (event, { tableId, userId }) => {
  try {
    console.log('tables:delete called with tableId:', tableId, 'userId:', userId);
    const salesService = new SalesService(db);
    const result = await salesService.deleteTable(tableId, userId);
    return { success: true, data: result };
  } catch (error) {
    console.error('tables:delete error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tables:get-order', async (event, orderId) => {
  try {
    const salesService = new SalesService(db);
    const result = await salesService.getTableOrderById(orderId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tables:delete-all', async () => {
  try {
    const result = await db.deleteAllTables();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tables:get-active-order', async (event, tableId) => {
  try {
    const salesService = new SalesService(db);
    const result = await salesService.getActiveTableOrder(tableId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tables:update-order', async (event, { orderId, items, total_amount }) => {
  try {
    const salesService = new SalesService(db);
    const result = await salesService.updateTableOrder(orderId, items, total_amount);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Payment
ipcMain.handle('payment:process', async (event, paymentData) => {
  try {
    const paymentService = new PaymentService();
    const result = await paymentService.processPayment(paymentData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('payment:activate-license', async (event, licenseData) => {
  try {
    const authService = new AuthService(db);
    const result = await authService.activateLicense(licenseData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Admin
ipcMain.handle('admin:get-all-users', async (event, token) => {
  try {
    console.log('getAllUsers called with token:', token ? 'exists' : 'missing');
    const authService = new AuthService(db);
    const decoded = await authService.verifyToken(token);
    console.log('Token decoded:', decoded);
    if (decoded.role !== 'admin') {
      console.log('Yetkisiz erişim - role:', decoded.role);
      return { success: false, error: 'Yetkisiz erişim' };
    }
    const users = await authService.getAllUsers();
    return { success: true, data: users };
  } catch (error) {
    console.log('admin:get-all-users error:', error, error?.message);
    return { success: false, error: error.message || 'Bilinmeyen hata' };
  }
});

ipcMain.handle('admin:delete-user', async (event, { token, userId }) => {
  try {
    console.log('deleteUser called with token:', token ? 'exists' : 'missing');
    const authService = new AuthService(db);
    const decoded = await authService.verifyToken(token);
    if (decoded.role !== 'admin') {
      return { success: false, error: 'Yetkisiz erişim' };
    }
    await authService.deleteUser(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('admin:add-user', async (event, { token, user }) => {
  try {
    console.log('addUser called with token:', token ? 'exists' : 'missing');
    console.log('User data:', user);
    const authService = new AuthService(db);
    const decoded = await authService.verifyToken(token);
    console.log('Token decoded:', decoded);
    if (decoded.role !== 'admin') {
      console.log('Yetkisiz erişim - role:', decoded.role);
      return { success: false, error: 'Yetkisiz erişim' };
    }
    await authService.addUser(user);
    return { success: true };
  } catch (error) {
    console.log('addUser error:', error, error?.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('admin:update-user', async (event, { token, user }) => {
  try {
    console.log('updateUser called with token:', token ? 'exists' : 'missing');
    const authService = new AuthService(db);
    const decoded = await authService.verifyToken(token);
    if (decoded.role !== 'admin') {
      return { success: false, error: 'Yetkisiz erişim' };
    }
    await authService.updateUser(user);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('user:delete-self', async (event, { token, password }) => {
  try {
    const authService = new AuthService(db);
    const decoded = authService.verifyToken(token);
    await authService.deleteSelf(decoded.id, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - License Management
ipcMain.handle('license:get-all-keys', async (event) => {
  try {
    const keys = await LicenseService.getAllKeys();
    return { success: true, data: keys };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:get-stats', async (event) => {
  try {
    const stats = await LicenseService.getLicenseStats();
    return stats;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:generate-key', async (event, panel) => {
  try {
    const result = await LicenseService.generateNewKey(panel);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:mark-as-used', async (event, key) => {
  try {
    const result = await LicenseService.markKeyAsUsed(key);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:get-used-keys', async (event) => {
  try {
    const keys = await LicenseService.getUsedKeys();
    return { success: true, data: keys };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:get-unused-keys', async (event) => {
  try {
    const keys = await LicenseService.getUnusedKeys();
    return { success: true, data: keys };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Statistics
ipcMain.handle('stats:get-system-stats', async (event) => {
  try {
    const statsService = new StatsService(db);
    const stats = await statsService.getSystemStats();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stats:get-product-stats', async (event) => {
  try {
    const statsService = new StatsService(db);
    const stats = await statsService.getProductStats();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stats:get-sales-stats', async (event, days) => {
  try {
    const statsService = new StatsService(db);
    const stats = await statsService.getSalesStats(days);
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stats:get-user-stats', async (event) => {
  try {
    const statsService = new StatsService(db);
    const stats = await statsService.getUserStats();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stats:get-daily-activity', async (event) => {
  try {
    const statsService = new StatsService(db);
    const stats = await statsService.getDailyActivity();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stats:get-overall', async (event, { userId, category }) => {
  try {
    const statsService = new StatsService(db);
    const stats = await statsService.getOverallStats(userId, category);
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in stats:get-overall handler:', error);
    return { success: false, error: 'İstatistikler alınırken bir hata oluştu.' };
  }
});

ipcMain.handle('stats:reset-market', async (event, userId) => {
  try {
    const statsService = new StatsService(db);
    await statsService.resetMarketStats(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stats:reset-kafe', async (event, userId) => {
  try {
    const statsService = new StatsService(db);
    await statsService.resetKafeStats(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Backup & Database Management
ipcMain.handle('backup:create', async (event, userId) => {
  const backupService = new BackupService(db.getDbPath(), userId);
  const result = await backupService.createBackup();
  return result;
});

ipcMain.handle('backup:list', async (event, userId) => {
  const backupService = new BackupService(db.getDbPath(), userId);
  const result = await backupService.listBackups();
  return result;
});

ipcMain.handle('backup:get-list', async (event) => {
  try {
    const backupService = new BackupService(db);
    const result = await backupService.getBackups();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:restore', async (event, backupPath) => {
  try {
    const backupService = new BackupService(db);
    const result = await backupService.restoreBackup(backupPath);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:delete', async (event, backupPath) => {
  try {
    const backupService = new BackupService(db);
    const result = await backupService.deleteBackup(backupPath);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:download', async (event, backupPath) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Yedeği Kaydet',
      defaultPath: backupPath.split(/[\\/]/).pop(),
      filters: [{ name: 'Veritabanı Yedeği', extensions: ['db'] }]
    });
    if (canceled || !filePath) return { success: false, error: 'Kullanıcı iptal etti.' };
    await fs.copyFile(backupPath, filePath);
    return { success: true, savedPath: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:import', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Yedek Dosyası Seç',
      filters: [{ name: 'Veritabanı Yedeği', extensions: ['db'] }],
      properties: ['openFile']
    });
    if (canceled || !filePaths || !filePaths[0]) return { success: false, error: 'Kullanıcı iptal etti.' };
    const dbPath = db.getDbPath();
    await fs.copyFile(filePaths[0], dbPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('database:clear', async (event) => {
  try {
    const backupService = new BackupService(db);
    const result = await backupService.clearDatabase();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('database:get-stats', async (event) => {
  try {
    const backupService = new BackupService(db);
    const result = await backupService.getDatabaseStats();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// App events
app.whenReady().then(async () => {
  await initializeDatabase();
  createWindow();

  // Automatic backup on startup
  const backupService = new BackupService(db.getDbPath());
  await backupService.createBackup(true); // true for auto-backup

  // Sistem Tepsisi (Tray) oluşturma
  tray = new Tray(path.join(__dirname, 'assets', 'icon.ico'));
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Uygulamayı Göster', 
      click: () => {
        mainWindow.show();
      } 
    },
    { 
      label: 'Çıkış Yap', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('S-POS');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (db) {
    await db.close();
  }
}); 