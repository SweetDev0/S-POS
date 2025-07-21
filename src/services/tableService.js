// Masa işlemleri için servis

const tableService = {
  getAllTables: async (userId) => {
    return window.electronAPI.getAllTables(userId);
  },
  addTable: async (tableData, userId) => {
    // tableData objesi içinden name ve number'ı al
    const tableName = tableData.name || tableData.number || 'Masa';
    const number = tableData.number;
    return window.electronAPI.addTable(tableName, userId, number);
  },
  deleteTable: async (tableId, userId) => {
    return window.electronAPI.deleteTable(tableId, userId);
  },
  createTableOrder: async (orderData) => {
    return window.electronAPI.createTableOrder(orderData);
  },
  closeTableOrder: async (orderId) => {
    return window.electronAPI.closeTableOrder(orderId);
  },
  getTableOrderById: async (orderId) => {
    return window.electronAPI.getTableOrderById(orderId);
  },
  getActiveTableOrder: async (tableId) => {
    return window.electronAPI.getActiveTableOrder(tableId);
  },
  updateTableOrder: async (orderId, items, total_amount) => {
    return window.electronAPI.updateTableOrder(orderId, items, total_amount);
  }
};

export default tableService; 