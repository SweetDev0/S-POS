import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShoppingCart, 
  Coffee, 
  Package, 
  Settings, 
  User, 
  BarChart3,
  Users,
  Shield,
  LogOut,
  BarChart2
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isAdmin, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('panels');

  // Loading durumu
  if (loading) {
    return <LoadingSpinner />;
  }

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Kullanıcı giriş yapmamışsa null döndür
  if (!isAuthenticated) {
    return null;
  }

  // Çıkış yapma fonksiyonu
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Başarıyla çıkış yapıldı');
      navigate('/login');
    } catch (error) {
      toast.error('Çıkış yapılırken hata oluştu');
    }
  };

  const panels = [
    {
      id: 'market',
      name: 'Market Paneli',
      description: 'Gelişmiş satış raporları ve analiz',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      path: '/market'
    },
    {
      id: 'kafe',
      name: 'Kafe Paneli',
      description: 'Masa bazlı sipariş ve adisyon yönetimi',
      icon: Coffee,
      color: 'bg-orange-500',
      path: '/kafe'
    },
    {
      id: 'stok-yonetim',
      name: 'Stok Yönetimi',
      description: 'Ürün ve stok takibi',
      icon: Package,
      color: 'bg-blue-500',
      path: '/stok-yonetim'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-between items-center mb-4">
              <div className="w-32"></div> {/* Sol taraf için sabit genişlik */}
              <h1 className="text-4xl font-bold text-gray-900">
                S-POS Dashboard
              </h1>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 w-32"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış Yap
              </button>
            </div>
            <p className="text-xl text-gray-600">
              Hoş geldiniz, {user?.displayName || user?.email}
            </p>
            {isAdmin && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4 mr-2" />
                Admin Hesabı - Tüm Yetkilere Sahipsiniz
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('panels')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'panels'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Paneller
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${
                    activeTab === 'admin'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Admin
                </button>
              )}
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Profil
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'panels' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {panels.map((panel) => (
                <div key={panel.id} className="card group hover:shadow-2xl hover:border-primary-400 transition-all duration-200 cursor-pointer animate-fade-in h-full p-8" style={{ minHeight: 220 }}>
                  <div className="card-body flex flex-col justify-between h-full">
                    <div className="flex items-center mb-6">
                      <div className={`p-4 rounded-xl ${panel.color} transition-all duration-200 group-hover:scale-110`}>
                        <panel.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">{panel.name}</h3>
                        <p className="text-base text-gray-500">Erişim Açık</p>
                      </div>
                    </div>
                    <p className="text-base text-gray-600 mb-6 group-hover:text-gray-900 transition-colors duration-200">{panel.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <Link to={panel.path} className="btn btn-primary w-full py-3 text-lg group-hover:scale-105 group-hover:bg-primary-700 transition-all duration-200">Aç</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Link to="/admin-panel" className="card group hover:shadow-2xl hover:border-primary-400 transition-all duration-200 cursor-pointer animate-fade-in h-full p-8">
                <div className="card-body flex flex-col justify-between h-full">
                  <div className="flex items-center mb-6">
                    <div className="p-4 rounded-xl bg-red-500 transition-all duration-200 group-hover:scale-110">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">Admin Paneli</h3>
                      <p className="text-base text-gray-500">Sistem Yönetimi</p>
                    </div>
                  </div>
                  <p className="text-base text-gray-600 mb-6 group-hover:text-gray-900 transition-colors duration-200">
                    Kullanıcı yönetimi, sistem istatistikleri ve diğer admin işlemleri
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="btn btn-primary w-full py-3 text-lg group-hover:scale-105 group-hover:bg-primary-700 transition-all duration-200">Aç</span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <Link to="/profil" className="card group hover:shadow-2xl hover:border-primary-400 transition-all duration-200 cursor-pointer animate-fade-in h-full p-8">
                  <div className="card-body flex flex-col justify-between h-full">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-green-500 transition-all duration-200 group-hover:scale-110">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">Profil</h3>
                        <p className="text-base text-gray-500">Hesap Ayarları</p>
                      </div>
                    </div>
                    <p className="text-base text-gray-600 mb-6 group-hover:text-gray-900 transition-colors duration-200">
                      Profil bilgilerinizi görüntüleyin ve düzenleyin
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="btn btn-primary w-full py-3 text-lg group-hover:scale-105 group-hover:bg-primary-700 transition-all duration-200">Aç</span>
                    </div>
                  </div>
                </Link>
                <Link to="/istatistikler" className="card group hover:shadow-2xl hover:border-primary-400 transition-all duration-200 cursor-pointer animate-fade-in h-full p-8">
                  <div className="card-body flex flex-col justify-between h-full">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-500 transition-all duration-200 group-hover:scale-110">
                        <BarChart2 className="h-8 w-8 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">İstatistikler</h3>
                        <p className="text-base text-gray-500">Satış Performansı</p>
                      </div>
                    </div>
                    <p className="text-base text-gray-600 mb-6 group-hover:text-gray-900 transition-colors duration-200">
                      Toplam kazanç, satılan ürünler ve diğer performans metriklerini görüntüleyin.
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="btn btn-primary w-full py-3 text-lg group-hover:scale-105 group-hover:bg-primary-700 transition-all duration-200">Aç</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} S-POS by SweetDev. All rights reserved.</p>
        <p>Version 1.0.0</p>
      </footer>
    </div>
  );
};

export default Dashboard; 