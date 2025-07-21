const { contextBridge, ipcRenderer } = require('electron');

// API'yi renderer process'e expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  register: (userData) => ipcRenderer.invoke('auth:register', userData),
  checkLicense: (userId) => ipcRenderer.invoke('auth:check-license', userId),

  // Products
  getAllProducts: (userId, filters) => ipcRenderer.invoke('products:get-all', { userId, filters }),
  addProduct: (productData, userId) => ipcRenderer.invoke('products:add', { productData, userId }),
  updateProduct: (productData, userId) => ipcRenderer.invoke('products:update', { productData, userId }),
  deleteProduct: (productId, userId) => ipcRenderer.invoke('products:delete', { productId, userId }),
  getProductByBarcode: (barcode, userId) => ipcRenderer.invoke('products:get-by-barcode', { barcode, userId }),
  getCategories: () => ipcRenderer.invoke('products:get-categories'),

  // Sales
  createSale: (saleData) => ipcRenderer.invoke('sales:create', saleData),
  getAllSales: (filters) => ipcRenderer.invoke('sales:get-all', filters),
  getSalesStatistics: (dateRange) => ipcRenderer.invoke('sales:get-statistics', dateRange),
  printSale: (saleData) => ipcRenderer.invoke('sales:print', saleData),
  closeSale: (saleData) => ipcRenderer.invoke('sales:close', saleData),

  // Tables (Kafe)
  getAllTables: (userId) => ipcRenderer.invoke('tables:get-all', userId),
  createTableOrder: (orderData) => ipcRenderer.invoke('tables:create-order', orderData),
  closeTableOrder: (orderId) => ipcRenderer.invoke('tables:close-order', orderId),
  addTable: (tableName, userId, number) => ipcRenderer.invoke('tables:add', { tableName, userId, number }),
  deleteTable: (tableId, userId) => ipcRenderer.invoke('tables:delete', { tableId, userId }),
  getTableOrderById: (orderId) => ipcRenderer.invoke('tables:get-order', orderId),
  deleteAllTables: () => ipcRenderer.invoke('tables:delete-all'),
  getActiveTableOrder: (tableId) => ipcRenderer.invoke('tables:get-active-order', tableId),
  updateTableOrder: (orderId, items, total_amount) => ipcRenderer.invoke('tables:update-order', { orderId, items, total_amount }),

  // Payment
  processPayment: (paymentData) => ipcRenderer.invoke('payment:process', paymentData),
  activateLicense: (licenseData) => ipcRenderer.invoke('payment:activate-license', licenseData),

  // Admin
  getAllUsers: (token) => ipcRenderer.invoke('admin:get-all-users', token),
  deleteUser: (token, userId) => ipcRenderer.invoke('admin:delete-user', { token, userId }),
  addUser: (token, user) => ipcRenderer.invoke('admin:add-user', { token, user }),
  updateUser: (token, user) => ipcRenderer.invoke('admin:update-user', { token, user }),
  deleteSelf: (token, password) => ipcRenderer.invoke('user:delete-self', { token, password }),

  // License Management
  getAllKeys: () => ipcRenderer.invoke('license:get-all-keys'),
  getLicenseStats: () => ipcRenderer.invoke('license:get-stats'),
  generateKey: (panel) => ipcRenderer.invoke('license:generate-key', panel),
  markKeyAsUsed: (key) => ipcRenderer.invoke('license:mark-as-used', key),
  getUsedKeys: () => ipcRenderer.invoke('license:get-used-keys'),
  getUnusedKeys: () => ipcRenderer.invoke('license:get-unused-keys'),

  // Statistics
  getOverallStats: (userId, category) => ipcRenderer.invoke('stats:get-overall', { userId, category }),
  getSystemStats: () => ipcRenderer.invoke('stats:get-system-stats'),
  getProductStats: () => ipcRenderer.invoke('stats:get-product-stats'),
  getSalesStats: (days) => ipcRenderer.invoke('stats:get-sales-stats', days),
  getUserStats: () => ipcRenderer.invoke('stats:get-user-stats'),
  getDailyActivity: () => ipcRenderer.invoke('stats:get-daily-activity'),
  resetMarketStats: (userId) => ipcRenderer.invoke('stats:reset-market', userId),
  resetKafeStats: (userId) => ipcRenderer.invoke('stats:reset-kafe', userId),

  // Backup & Restore
  createBackup: (userId) => ipcRenderer.invoke('backup:create', userId),
  listBackups: (userId) => ipcRenderer.invoke('backup:list', userId),
  downloadBackup: (backupPath) => ipcRenderer.invoke('backup:download', backupPath),
  importBackup: () => ipcRenderer.invoke('backup:import'),

  // Database Management
  clearDatabase: () => ipcRenderer.invoke('database:clear'),
  getDatabaseStats: () => ipcRenderer.invoke('database:get-stats'),
}); 