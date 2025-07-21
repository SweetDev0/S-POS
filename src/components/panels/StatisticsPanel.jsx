import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import statsService from '../../services/statsService';
import { ArrowLeft, BarChart2, DollarSign, Package, TrendingUp, ShoppingCart, Coffee, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'market', label: 'Market İstatistikleri', icon: ShoppingCart },
  { key: 'kafe', label: 'Kafe İstatistikleri', icon: Coffee },
];

const StatCard = ({ icon, title, value, color }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 flex items-center gap-6 border-l-4 ${color}`}>
    <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border', 'bg')}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const StatisticsPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('market');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const data = await statsService.getOverallStats(user.id, activeTab);
          setStats(data);
        } catch (error) {
          toast.error('İstatistikler yüklenirken bir hata oluştu.');
          setStats(null);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchStats();
  }, [user, activeTab]);

  const handleResetStats = async () => {
    setLoading(true);
    try {
      const fn = activeTab === 'market' ? window.electronAPI.resetMarketStats : window.electronAPI.resetKafeStats;
      const res = await fn(user.id);
      if (res.success) {
        toast.success('İstatistikler başarıyla sıfırlandı!');
        // Refresh stats
        const data = await statsService.getOverallStats(user.id, activeTab);
        setStats(data);
      } else {
        toast.error(res.error || 'İstatistikler sıfırlanamadı.');
      }
    } catch (error) {
      toast.error('İstatistikler sıfırlanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 py-10 px-4">
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md hover:bg-gray-200 transition" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <BarChart2 className="w-7 h-7 mr-3 text-primary-600" />
              İstatistikler
            </h1>
          </div>
        </header>

        <div className="flex space-x-2 bg-gray-200 p-1 rounded-lg mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition 
                ${activeTab === tab.key ? 'bg-white text-primary-700 shadow' : 'text-gray-600 hover:bg-gray-300'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleResetStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 ml-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            {loading ? 'Sıfırlanıyor...' : 'İstatistikleri Sıfırla'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="spinner"></div></div>
        ) : !stats ? (
          <div className="text-center py-20 text-gray-500">Bu kategori için istatistik verisi bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Genel Bakış</h2>
              <StatCard
                icon={<DollarSign className="w-6 h-6 text-green-600" />}
                title="Toplam Kazanç"
                value={`${(stats.totalRevenue || 0).toFixed(2)} ₺`}
                color="border-green-500"
              />
              <StatCard
                icon={<Package className="w-6 h-6 text-blue-600" />}
                title="Satılan Ürün Sayısı"
                value={stats.totalProductsSold || 0}
                color="border-blue-500"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
                title="Toplam Satış Adedi"
                value={stats.totalSales || 0}
                color="border-purple-500"
              />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">En Çok Satan Ürünler</h2>
                {stats.topProducts.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">Bu kategoride satılan ürün bulunmuyor.</div>
                ) : (
                  <ul className="space-y-3">
                    {stats.topProducts.map((product, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-500 mr-4">{index + 1}</span>
                          <p className="font-semibold text-gray-800">{product.name}</p>
                        </div>
                        <p className="font-bold text-primary-600 bg-primary-100 px-3 py-1 rounded-full text-sm">
                          {product.total_sold} <span className="font-normal">adet satıldı</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPanel; 