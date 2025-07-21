import axios from 'axios';

const API_URL = 'http://localhost:3002';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const salesService = {
  async getAllSales() {
    try {
      const response = await window.electronAPI.getAllSales();
      return response;
    } catch (error) {
      throw error || { error: 'Satışlar yüklenemedi' };
    }
  },

  async createSale(saleData) {
    try {
      const response = await window.electronAPI.createSale(saleData);
      return response;
    } catch (error) {
      throw error || { error: 'Satış oluşturulamadı' };
    }
  },

  async getSalesByDate(startDate, endDate) {
    try {
      const response = await window.electronAPI.getSalesStatistics({ startDate, endDate });
      return response;
    } catch (error) {
      throw error || { error: 'Tarih aralığı satışları yüklenemedi' };
    }
  }
};

export default salesService; 