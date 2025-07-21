import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Shield, 
  Mail, 
  User, 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  ShoppingCart,
  Coffee
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State'ler
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    activeUsers: 0
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Tab'lar
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Kullanıcı Yönetimi', icon: Users },
    { id: 'settings', label: 'Sistem Ayarları', icon: Settings }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsers(),
        loadSystemStats()
      ]);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      setUsers([]);
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await window.electronAPI.getSystemStats();
      if (response.success) {
        setSystemStats({
          totalProducts: response.data.totalProducts,
          totalSales: response.data.totalSales,
          totalRevenue: response.data.totalRevenue,
          activeUsers: response.data.activeUsers,
          totalTables: response.data.totalTables,
          openOrders: response.data.openOrders
        });
      }
    } catch (error) {
      console.error('Sistem istatistikleri yüklenirken hata:', error);
    }
  };

  // Kullanıcı ekleme/düzenleme modalını aç
  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user'
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'user' });
    }
    setShowUserModal(true);
  };

  // Kullanıcı ekle/düzenle form submit
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      
      if (!token) {
        toast.error('Token bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      let response;
      if (editingUser) {
        response = await window.electronAPI.updateUser(editingUser.id, userForm);
        if (response.success) {
          toast.success('Kullanıcı başarıyla güncellendi');
        } else {
          toast.error(response.error || 'Kullanıcı güncellenirken hata oluştu');
        }
      } else {
        response = await window.electronAPI.createUser(userForm);
        if (response.success) {
          toast.success('Kullanıcı başarıyla oluşturuldu');
        } else {
          toast.error(response.error || 'Kullanıcı oluşturulurken hata oluştu');
        }
      }

      if (response.success) {
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({ name: '', email: '', password: '', role: 'user' });
        loadUsers();
      }
    } catch (error) {
      console.error('Kullanıcı işlemi hatası:', error);
      toast.error('Kullanıcı işlemi sırasında hata oluştu');
    }
  };

  // Kullanıcı sil
  const handleDeleteUser = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await window.electronAPI.deleteUser(userId);
      if (response.success) {
        toast.success('Kullanıcı başarıyla silindi');
        loadUsers();
      } else {
        toast.error(response.error || 'Kullanıcı silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      toast.error('Kullanıcı silinirken hata oluştu');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Geri Dön</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
                <p className="text-sm text-gray-500">Sistem yönetimi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Admin</p>
                <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {activeTab === 'dashboard' && <DashboardTab systemStats={systemStats} />}
              {activeTab === 'users' && <UsersTab users={users} onDeleteUser={handleDeleteUser} onEditUser={openUserModal} onAddUser={() => openUserModal(null)} />}
              {activeTab === 'settings' && <SettingsTab />}
            </div>
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
            </h3>
            <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  className="input input-bordered w-full"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  className="input input-bordered w-full"
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-3 mt-4">
                <button type="submit" className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                  Kaydet
                </button>
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ systemStats }) => {
  const [dailyActivity, setDailyActivity] = useState(null);
  const [productStats, setProductStats] = useState([]);

  useEffect(() => {
    loadDetailedStats();
  }, []);

  const loadDetailedStats = async () => {
    try {
      // Burada detaylı istatistikler yüklenebilir
      setDailyActivity({
        today: 15,
        yesterday: 12,
        thisWeek: 89,
        lastWeek: 76
      });
      
      setProductStats([
        { name: 'Market Ürünleri', count: 45, color: 'bg-purple-500' },
        { name: 'Kafe Ürünleri', count: 23, color: 'bg-orange-500' }
      ]);
    } catch (error) {
      console.error('Detaylı istatistikler yüklenirken hata:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sistem Genel Bakış</h2>
      
      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.totalProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Satış</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.totalSales}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.totalRevenue}₺</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktif Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detaylı İstatistikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Günlük Aktivite */}
        {dailyActivity && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Günlük Aktivite
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Bugün:</span>
                <span className="font-semibold">{dailyActivity.today} işlem</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dün:</span>
                <span className="font-semibold">{dailyActivity.yesterday} işlem</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bu Hafta:</span>
                <span className="font-semibold">{dailyActivity.thisWeek} işlem</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Geçen Hafta:</span>
                <span className="font-semibold">{dailyActivity.lastWeek} işlem</span>
              </div>
            </div>
          </div>
        )}

        {/* Ürün İstatistikleri */}
        {productStats.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-green-600" />
              Ürün Dağılımı
            </h3>
            <div className="space-y-3">
              {productStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
                    <span className="text-gray-600">{stat.name}</span>
                  </div>
                  <span className="font-semibold">{stat.count} ürün</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, onDeleteUser, onEditUser, onAddUser }) => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
        <button
          onClick={onAddUser}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kullanıcı
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-posta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Aktif
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sistem Ayarları</h2>
      
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Genel Ayarlar</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sistem Adı
              </label>
              <input
                type="text"
                defaultValue="S POS"
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Varsayılan Para Birimi
              </label>
              <select className="input input-bordered w-full">
                <option value="TRY">Türk Lirası (₺)</option>
                <option value="USD">Amerikan Doları ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yedekleme</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Otomatik Yedekleme</h4>
                <p className="text-sm text-gray-600">Verilerinizi otomatik olarak yedekleyin</p>
              </div>
              <button className="btn btn-primary">
                <Download className="w-4 h-4 mr-2" />
                Yedekle
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Yedek Geri Yükleme</h4>
                <p className="text-sm text-gray-600">Önceki yedekten veri geri yükleyin</p>
              </div>
              <button className="btn btn-outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Geri Yükle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 