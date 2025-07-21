import axios from 'axios';

const API_URL = 'http://localhost:3002';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const orderService = {
  async getAllOrders() {
    try {
      const response = await axios.get(`${API_URL}/cafe-orders`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Siparişler yüklenemedi' };
    }
  },

  async createOrder(orderData) {
    try {
      const response = await axios.post(`${API_URL}/cafe-orders`, orderData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Sipariş oluşturulamadı' };
    }
  },

  async updateOrderStatus(id, status) {
    try {
      const response = await axios.patch(`${API_URL}/cafe-orders/${id}/status`, {
        status
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Sipariş durumu güncellenemedi' };
    }
  },

  async getOrderById(id) {
    try {
      const response = await axios.get(`${API_URL}/cafe-orders/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Sipariş bulunamadı' };
    }
  },

  async deleteOrder(id) {
    try {
      const response = await axios.delete(`${API_URL}/cafe-orders/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Sipariş silinemedi' };
    }
  }
};

export default orderService; 