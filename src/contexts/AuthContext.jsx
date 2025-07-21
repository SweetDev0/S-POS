import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext({
  user: null,
  userId: null,
  isAuthenticated: false,
  isAdmin: false,
  isOnlineUser: false,
  role: 'user',
  loading: false,
  login: () => {},
  logout: () => {},
  register: () => {},
  updateUser: () => {},
  signInError: null,
  signUpError: null
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Context her zaman var olacak çünkü başlangıç değeri verdik
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [signInError, setSignInError] = useState(null);
  const [signUpError, setSignUpError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Beni Hatırla kontrolü
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    let token, savedUser;
    if (rememberMe) {
      token = localStorage.getItem('token');
      savedUser = localStorage.getItem('user');
    } else {
      token = sessionStorage.getItem('token');
      savedUser = sessionStorage.getItem('user');
      // localStorage'dan token ve user'ı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    if (token && savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    // Sadece login, register ve forgot-password dışındakilerde yönlendir
    const publicRoutes = ['/login', '/register', '/forgot-password'];
    if (!isAuthenticated && !isLoading && !publicRoutes.includes(location.pathname)) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // Admin kullanıcı kontrolü - Online kullanıcılar için daha esnek
  const adminEmails = ['miracege0201@hotmail.com', 'admin@system.com'];
  const isOnlineUser = user?.email && user.email.includes('online-user');
  const isAdmin = user?.email && (
    adminEmails.includes(user.email) || 
    isOnlineUser || 
    user.role === 'admin'
  );
  
  // Kullanıcı rolünü belirle - Online kullanıcılar için özel yetki
  const userRole = isOnlineUser ? 'online-user' : (isAdmin ? 'admin' : 'user');

  // Debug bilgileri
  console.log('=== AUTH CONTEXT DEBUG ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('isLoading:', isLoading);
  console.log('user:', user);
  console.log('isAdmin:', isAdmin);
  console.log('isOnlineUser:', isOnlineUser);
  console.log('userRole:', userRole);
  console.log('signInError:', signInError);
  console.log('signUpError:', signUpError);

  // Giriş fonksiyonu
  const login = async (email, password) => {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Email:', email);
      console.log('Password length:', password.length);
      
      setIsLoading(true);
      setSignInError(null);
      
      const response = await authService.login(email, password);
      console.log('AuthContext login response:', response);
      
      if (response && response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('Login successful:', response.user);
        return { success: true };
      } else {
        const errorMessage = response?.error?.message || response?.error || 'Giriş başarısız';
        setSignInError({ message: errorMessage });
        return { success: false, error: { message: errorMessage } };
      }
    } catch (error) {
      console.error('Login exception:', error);
      const errorMessage = error.message || 'Giriş sırasında hata oluştu';
      setSignInError({ message: errorMessage });
      return { success: false, error: { message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  };

  // Çıkış fonksiyonu
  const logout = async () => {
    try {
      console.log('=== LOGOUT FUNCTION CALLED ===');
      console.log('Çıkış yapılıyor...');
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('Çıkış başarılı!');
      return { success: true };
    } catch (error) {
      console.error('Çıkış hatası:', error);
      return { success: false, error };
    }
  };

  // Kayıt fonksiyonu
  const register = async (name, email, password) => {
    try {
      setIsLoading(true);
      setSignUpError(null);
      
      const response = await authService.register(name, email, password);
      console.log('AuthContext register response:', response);
      
      // The backend now returns { success, user, token } directly
      if (response && response.success && response.user && response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        console.log('Register successful:', response.user);
        return { success: true };
      } else {
        // Handle failure case
        const msg = response?.error || 'Kayıt başarısız';
        setSignUpError({ message: msg });
        return { success: false, error: { message: msg } };
      }
    } catch (error) {
      console.error('Register exception:', error);
      const errorMessage = error.message || 'Kayıt sırasında hata oluştu';
      setSignUpError({ message: errorMessage });
      return { success: false, error: { message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcı güncelleme fonksiyonu
  const updateUser = async (updateData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      // Mevcut kullanıcı bilgilerini al
      const currentUser = user;
      // Zorunlu alanları eksiksiz gönder
      const userToUpdate = {
        id: currentUser.id,
        email: currentUser.email,
        name: updateData.name || currentUser.name,
        role: currentUser.role || 'user',
        license_type: currentUser.license_type || 'general',
        ...updateData
      };
      // Admin değilse role ve license_type güncellenemez
      if (!isAdmin) {
        delete userToUpdate.role;
        delete userToUpdate.license_type;
      }
      // Backend'e gönder
      const result = await window.electronAPI.updateUser(token, userToUpdate);
      if (result.success) {
        // Güncel user bilgisini state ve localStorage'a yaz
        setUser({ ...user, ...updateData });
        localStorage.setItem('user', JSON.stringify({ ...user, ...updateData }));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id || user?.userId || (user?.email?.includes('online-user') ? 'online-user' : (user?.id ? user.id : null)),
        isAuthenticated,
        isAdmin,
        isOnlineUser,
        role: userRole,
        loading: isLoading,
        login,
        logout,
        register,
        updateUser,
        signInError,
        signUpError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 