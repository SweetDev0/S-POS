// Ürün işlemleri için servis

const productService = {
  getAllProducts: async (userId, filters) => {
    return window.electronAPI.getAllProducts(userId, filters);
  },

  createProduct: async (productData, userId) => {
    return window.electronAPI.addProduct(productData, userId);
  },

  updateProduct: async (productData, userId) => {
    return window.electronAPI.updateProduct(productData, userId);
  },

  deleteProduct: async (productId, userId) => {
    // This is the function that was missing/incorrect.
    // It now correctly passes both productId and userId.
    return window.electronAPI.deleteProduct(productId, userId);
  },
  
  getProductByBarcode: async (barcode, userId) => {
    return window.electronAPI.getProductByBarcode(barcode, userId);
  },

  getCategories: async () => {
    return window.electronAPI.getCategories();
  },
};

export default productService; 