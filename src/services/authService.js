import axios from 'axios';

const API_URL = 'http://localhost:3002'; // Auth sunucunun adresi

const authService = {
  async login(email, password) {
    try {
      console.log('authService.login called with email:', email);
      
      // Electron IPC kullan
      const response = await window.electronAPI.login({ email, password });
      console.log('authService.login response:', response);
      
      if (response && response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { ...response.data, success: true };
      }
      return { ...response, success: false };
    } catch (error) {
      console.error('authService.login error:', error);
      throw error.response?.data || { error: 'Giriş başarısız' };
    }
  },

  async register(name, email, password) {
    try {
      console.log('authService.register called with name:', name, 'email:', email);
      
      // Electron IPC kullan
      const response = await window.electronAPI.register({ name, email, password });
      console.log('authService.register response:', response);
      
      if (response && response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data || response;
    } catch (error) {
      console.error('authService.register error:', error);
      throw error.response?.data || { error: 'Kayıt başarısız' };
    }
  },

  async getAllUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await window.electronAPI.getAllUsers(token);
      return response.data || [];
    } catch (error) {
      console.error('getAllUsers error:', error);
      return [];
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService; 