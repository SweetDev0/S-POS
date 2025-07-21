import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import { Package, ArrowLeft, Edit, Trash2, PlusCircle, Tag, Barcode, Box } from 'lucide-react';

const TABS = [
  { key: 'market', label: 'Market Ürünleri', icon: Tag },
  { key: 'kafe', label: 'Kafe Ürünleri', icon: Box },
];

const StockManagementPanel = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', stock: '', barcode: '', trackStock: true });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('market');
  const navigate = useNavigate();

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user, activeTab]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, [activeTab, editingId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts(user.id, { category: activeTab });
      setProducts(Array.isArray(response) ? response : (response.data ?? []));
    } catch (err) {
      toast.error('Ürünler yüklenirken bir hata oluştu.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    handleCancel();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      setError('Ürün adı ve fiyatı zorunludur.');
      return;
    }
    if (activeTab === 'market' && form.barcode.length !== 13) {
      setError('Market ürünleri için barkod 13 haneli ve sadece rakamlardan oluşmalıdır.');
      return;
    }

    setLoading(true);
    setError('');
    
    const productData = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      stock: activeTab === 'kafe' ? (form.trackStock ? (form.stock === '' ? null : parseInt(form.stock)) : null) : parseInt(form.stock) || 0,
      barcode: activeTab === 'market' ? form.barcode.trim() : null,
      category: activeTab,
      description: '',
    };

    try {
      const response = editingId
        ? await productService.updateProduct({ ...productData, id: editingId }, user.id)
        : await productService.createProduct(productData, user.id);

      if (response?.success) {
        toast.success(`Ürün başarıyla ${editingId ? 'güncellendi' : 'eklendi'}.`);
        handleCancel();
        loadProducts();
      } else {
        toast.error(response?.error || 'Bir hata oluştu.');
      }
    } catch (err) {
      toast.error('İşlem sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price.toString(),
      stock: (product.stock_quantity ?? product.stock ?? '').toString(),
      barcode: product.barcode || '',
      trackStock: product.stock_quantity !== null && product.stock_quantity !== undefined,
    });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    setLoading(true);
    try {
      const response = await productService.deleteProduct(productId, user.id);
      if (response?.success) {
        toast.success('Ürün başarıyla silindi.');
        loadProducts();
      } else {
        toast.error(response?.error || 'Ürün silinirken bir hata oluştu.');
      }
    } catch (err) {
      toast.error('Ürün silinirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', price: '', stock: '', barcode: '', trackStock: true });
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'barcode') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length <= 13) {
        setForm(f => ({ ...f, barcode: numericValue }));
      }
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 py-10 px-4">
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md hover:bg-gray-200 transition" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <Package className="w-7 h-7 mr-3 text-primary-600" />
              Ürün Yönetimi
            </h1>
          </div>
        </header>

        <div className="flex space-x-2 bg-gray-200 p-1 rounded-lg mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition 
                ${activeTab === tab.key ? 'bg-white text-primary-700 shadow' : 'text-gray-600 hover:bg-gray-300'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <PlusCircle className="w-6 h-6 mr-3 text-primary-500"/>
                {editingId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form alanları */}
                <div>
                  <label className="label">Ürün Adı *</label>
                  <input ref={nameInputRef} type="text" name="name" value={form.name} onChange={handleChange} className="input" placeholder="Ürün adı" required />
                </div>
                <div>
                  <label className="label">Fiyat (₺) *</label>
                  <input type="number" name="price" step="0.01" value={form.price} onChange={handleChange} className="input" placeholder="0.00" required />
                </div>
                {activeTab === 'kafe' && (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="trackStock"
                      checked={form.trackStock}
                      onChange={e => setForm(f => ({ ...f, trackStock: e.target.checked }))}
                    />
                    <label htmlFor="trackStock" className="text-sm text-gray-700">Stok Takibi Yapılsın</label>
                  </div>
                )}
                {((activeTab === 'kafe' && form.trackStock) || activeTab === 'market') && (
                  <div>
                    <label className="label">Stok Miktarı</label>
                    <input type="number" name="stock" value={form.stock} onChange={handleChange} className="input" placeholder="0" min="0" />
                  </div>
                )}
                {activeTab === 'market' && (
                  <div>
                    <label className="label">Barkod (13 Hane) *</label>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
                      <input type="text" name="barcode" value={form.barcode} onChange={handleChange} className="input pl-10 pr-16" placeholder="Sadece rakam" required maxLength={13} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">{form.barcode.length}/13</span>
                    </div>
                  </div>
                )}
                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-3 rounded-lg shadow hover:from-blue-600 hover:to-blue-800 transition-all text-lg tracking-wide"
                  >
                    {loading ? (editingId ? 'Güncelleniyor...' : 'Ekleniyor...') : (editingId ? 'Değişiklikleri Kaydet' : 'Ürünü Ekle')}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-all font-medium"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mevcut Ürünler ({products.length})</h2>
              {loading ? (
                <div className="text-center py-10"><div className="spinner"></div></div>
              ) : products.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Bu kategoride ürün bulunmuyor.</div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{product.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="font-semibold text-primary-600">{product.price}₺</span>
                          {typeof product.stock_quantity === 'number' && !isNaN(product.stock_quantity) && product.stock_quantity > 0 && (
                            <span>Stok: {product.stock_quantity}</span>
                          )}
                          {product.barcode && <span>Barkod: {product.barcode}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleEdit(product)} className="p-2 rounded-md hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 rounded-md hover:bg-gray-200 text-gray-500 hover:text-red-600 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagementPanel; 