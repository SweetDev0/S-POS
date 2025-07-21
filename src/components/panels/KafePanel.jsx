import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Coffee, 
  Plus, 
  Minus, 
  Trash2,
  Receipt,
  Users,
  Clock,
  Save,
  Printer,
  Calculator,
  ShoppingCart,
  DollarSign,
  X,
  Edit3,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import tableService from '../../services/tableService';

const KafePanel = () => {
  const { user, userId, logout } = useAuth();
  const navigate = useNavigate();
  
  // Debug için userId'yi logla
  console.log('=== KAFE PANEL DEBUG ===');
  console.log('user:', user);
  console.log('userId:', userId);
  console.log('user.id:', user?.id);
  console.log('user.userId:', user?.userId);
  
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  
  // Modal state'leri
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: 4 });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: 0, trackStock: true });
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const inputProductNameRef = useRef();
  const inputTableNumberRef = useRef();

  useEffect(() => {
    if (showAddProductModal) {
      setTimeout(() => {
        inputProductNameRef.current?.focus();
      }, 100);
    }
    if (showAddTableModal) {
      setTimeout(() => {
        inputTableNumberRef.current?.focus();
      }, 100);
    }
  }, [showAddProductModal, showAddTableModal]);

  const handleCloseAddProductModal = () => {
    setShowAddProductModal(false);
    setNewProduct({ name: '', price: '', quantity: 0, trackStock: true });
  };

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

  useEffect(() => {
    if (userId) {
      loadTables();
    }
  }, [userId]);

  // Kullanıcı değiştiğinde ürünleri de yükle
  useEffect(() => {
    if (userId) {
      loadProducts();
    }
  }, [userId]);

  // Masaları yükle
  const loadTables = async () => {
    try {
      setLoading(true);
      
      // Online kullanıcı kontrolü
      const currentUserId = userId || 'online-user';
      console.log('loadTables called with currentUserId:', currentUserId);
      
      const response = await tableService.getAllTables(currentUserId);
      console.log('loadTables response:', response);
      
      if (response && Array.isArray(response)) {
        setTables(response);
      } else if (response && response.success && Array.isArray(response.data)) {
        setTables(response.data);
      } else {
        setTables([]);
        if (response && response.error) {
          toast.error(response.error);
        }
      }
    } catch (error) {
      console.error('Masalar yüklenirken hata:', error);
      toast.error('Masalar yüklenirken hata oluştu');
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  // Ürünleri yükle
  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Online kullanıcı kontrolü
      const currentUserId = userId || 'online-user';
      console.log('loadProducts called with currentUserId:', currentUserId);
      
      const response = await productService.getAllProducts(currentUserId, { category: 'kafe' });
      console.log('loadProducts response:', response);
      
      let loadedProducts = [];
      if (response && Array.isArray(response)) {
        loadedProducts = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        loadedProducts = response.data;
      } else {
        loadedProducts = [];
        if (response && response.error) {
          toast.error(response.error);
        }
      }
      setProducts(loadedProducts);
      // Stok uyarısı
      loadedProducts.forEach(product => {
        if (typeof product.quantity !== 'undefined' && product.quantity < 5) {
          toast.error(`${product.name} ürününün stoğu kritik seviyede! (${product.quantity} adet kaldı)`);
        }
      });
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Masa ekle
  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.number.trim()) {
      toast.error('Masa numarası zorunludur');
      return;
    }

    try {
      setLoading(true);
      const tableData = {
        name: `Masa ${newTable.number.trim()}`,
        number: newTable.number.trim(),
        capacity: parseInt(newTable.capacity) || 4,
        status: 'available'
      };

      // Online kullanıcı kontrolü
      const currentUserId = userId || 'online-user';
      console.log('handleAddTable called with currentUserId:', currentUserId);
      console.log('tableData:', tableData);
      
      const response = await tableService.addTable(tableData, currentUserId);
      console.log('handleAddTable response:', response);
      
      if (response && response.success) {
        toast.success('Masa başarıyla eklendi');
        setShowAddTableModal(false);
        setNewTable({ number: '', capacity: 4 });
        loadTables();
      } else {
        toast.error(response?.error || 'Masa eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Masa ekleme hatası:', error);
      toast.error('Masa eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Ürün ekle
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.price.trim()) {
      toast.error('Ürün adı ve fiyatı zorunludur');
      return;
    }
    try {
      setLoading(true);
      const productData = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        stock: newProduct.trackStock ? (newProduct.quantity === '' ? null : parseInt(newProduct.quantity, 10)) : null,
        barcode: null,
        category: 'kafe',
        description: ''
      };
      // Online kullanıcı kontrolü
      const currentUserId = userId || 'online-user';
      console.log('handleAddProduct called with currentUserId:', currentUserId);
      console.log('productData:', productData);
      const response = await productService.createProduct(productData, currentUserId);
      console.log('handleAddProduct response:', response);
      if (response && response.success) {
        toast.success('Ürün başarıyla eklendi');
        setShowAddProductModal(false);
        setNewProduct({ name: '', price: '', quantity: 0, trackStock: true });
        loadProducts();
      } else {
        toast.error(response?.error || 'Ürün eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Ürün ekleme hatası:', error);
      toast.error('Ürün eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Ürün düzenle
  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!editProduct.name.trim() || !editProduct.price) {
      toast.error('Ürün adı ve fiyatı zorunludur');
      return;
    }

    try {
      setLoading(true);
      const productData = {
        name: editProduct.name.trim(),
        price: parseFloat(editProduct.price),
        quantity: parseInt(editProduct.quantity) || 0,
        barcode: null, // Kafe ürünleri için barkod yok
        category: 'kafe'
      };

      // Online kullanıcı kontrolü
      const currentUserId = userId || 'online-user';
      const response = await productService.updateProduct(editProduct.id, productData, currentUserId);
      if (response && response.success) {
        toast.success('Ürün başarıyla güncellendi');
        setShowEditProductModal(false);
        setEditProduct(null);
        loadProducts();
      } else {
        toast.error(response?.error || 'Ürün güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error);
      toast.error('Ürün güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Ürün sil
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await productService.deleteProduct(productId);
      if (response && response.success) {
        toast.success('Ürün başarıyla silindi');
        loadProducts();
      } else {
        toast.error(response?.error || 'Ürün silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Ürün silme hatası:', error);
      toast.error('Ürün silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Masa silme
  const handleDeleteTable = async (tableId) => {
    if (!confirm('Bu masayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      // Online kullanıcı kontrolü
      const currentUserId = userId || 'online-user';
      const response = await tableService.deleteTable(tableId, currentUserId);
      if (response && response.success) {
        toast.success('Masa başarıyla silindi');
        loadTables();
      } else {
        toast.error(response?.error || 'Masa silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Masa silme hatası:', error);
      toast.error('Masa silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Masa seç
  const handleTableSelect = async (table) => {
    setSelectedTable(table);
    setLoading(true);
    try {
      const response = await tableService.getActiveTableOrder(table.id);
      console.log('[handleTableSelect] response:', response);
      if (response && response.success && response.data && response.data.items) {
        console.log('[handleTableSelect] items:', response.data.items);
        setCurrentOrder(response.data.items.map(item => ({
          id: item.product_id || item.id, // fallback
          name: item.name || '',
          price: item.price,
          quantity: item.quantity
        })));
        setActiveOrderId(response.data.id); // aktif sipariş id'sini kaydet
      } else {
        setCurrentOrder([]);
        setActiveOrderId(null);
      }
    } catch (error) {
      setCurrentOrder([]);
      setActiveOrderId(null);
    } finally {
      setLoading(false);
    }
  };

  // Ürün seçimi
  const handleProductSelect = (product) => {
    if (!selectedTable) {
      toast.error('Önce bir masa seçin');
      return;
    }

    // Stok takibi varsa ve stok sayısal ise kontrol yap
    if (product.stock_quantity !== null && typeof product.stock_quantity === 'number' && !isNaN(product.stock_quantity)) {
      if (product.stock_quantity <= 0) {
        toast.error(`${product.name} ürününün stoku tamamen tükendi!`);
        return;
      }
      const existingProduct = currentOrder.find(p => p.id === product.id);
      if (existingProduct && existingProduct.quantity >= product.stock_quantity) {
        toast.error(`${product.name} ürününün stoku yetersiz! Mevcut stok: ${product.stock_quantity} adet`);
        return;
      }
    }

    const existingProduct = currentOrder.find(p => p.id === product.id);
    if (existingProduct) {
      setCurrentOrder(prev =>
        prev.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setCurrentOrder(prev => [...prev, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} siparişe eklendi`);
  };

  // Ürün miktarını artır
  const handleIncreaseQuantity = (productId) => {
    const productInOrder = currentOrder.find(p => p.id === productId);
    const originalProduct = products.find(p => p.id === productId);

    if (productInOrder && originalProduct) {
      // Stok takibi varsa ve stok sayısal ise kontrol yap
      if (originalProduct.stock_quantity !== null && typeof originalProduct.stock_quantity === 'number' && !isNaN(originalProduct.stock_quantity)) {
        if (originalProduct.stock_quantity <= 0) {
          toast.error(`${originalProduct.name} ürününün stoku tamamen tükendi!`);
          return;
        }
        if (productInOrder.quantity >= originalProduct.stock_quantity) {
          toast.error(`${originalProduct.name} ürününün stoku yetersiz! Mevcut stok: ${originalProduct.stock_quantity} adet`);
          return;
        }
      }
      setCurrentOrder(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    }
  };

  // Ürün miktarını azalt
  const handleDecreaseQuantity = (productId) => {
    setCurrentOrder(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, quantity: Math.max(0, p.quantity - 1) }
          : p
      ).filter(p => p.quantity > 0)
    );
  };

  // Ürün siparişten çıkar
  const handleRemoveFromOrder = (productId) => {
    setCurrentOrder(prev => prev.filter(p => p.id !== productId));
    toast.success('Ürün siparişten çıkarıldı');
  };

  // Toplam hesapla
  const calculateTotal = () => {
    return currentOrder.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  // Sipariş tamamla
  const handleCompleteOrder = async () => {
    if (!selectedTable) {
      toast.error('Lütfen bir masa seçin');
      return;
    }

    if (currentOrder.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    try {
      setLoading(true);
      const items = currentOrder.map(product => ({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        total: product.price * product.quantity
      }));
      const total_amount = calculateTotal();
      let response;
      if (activeOrderId) {
        // Aktif sipariş varsa güncelle
        response = await tableService.updateTableOrder(activeOrderId, items, total_amount);
      } else {
        // Yoksa yeni sipariş oluştur
        const orderData = {
          items,
          total_amount,
          user_id: userId,
          table_id: selectedTable.id,
          type: 'kafe',
          status: 'completed',
          payment_method: 'cash',
          created_at: new Date().toISOString()
        };
        response = await window.electronAPI.createTableOrder(orderData);
      }
      if (response && response.success) {
        toast.success('Sipariş başarıyla kaydedildi');
        setCurrentOrder([]);
        setSelectedTable(null);
        setActiveOrderId(null);
        loadTables();
      } else {
        toast.error(response?.error || 'Sipariş kaydedilirken hata oluştu');
      }
    } catch (error) {
      toast.error('Sipariş kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptText, setReceiptText] = useState('');

  // Adisyon metni oluşturucu
  const generateReceiptText = () => {
    const lines = [];
    lines.push('S-POS Kafe Adisyonu');
    lines.push('--------------------------');
    lines.push(`Masa: ${selectedTable?.number || selectedTable?.name || '-'}  Tarih: ${new Date().toLocaleString('tr-TR')}`);
    lines.push('');
    lines.push('Ürünler:');
    currentOrder.forEach(item => {
      lines.push(`- ${item.name}  ${item.quantity} x ${item.price}₺   ${item.price * item.quantity}₺`);
    });
    lines.push('--------------------------');
    lines.push(`Toplam: ${calculateTotal()}₺`);
    lines.push('Teşekkürler!');
    return lines.join('\n');
  };

  // Siparişi yazdır (artık modal üzerinden)
  const handlePrintOrder = async () => {
    if (currentOrder.length === 0) {
      toast.error('Lütfen siparişi tamamlayın.');
      return;
    }
    setReceiptText(generateReceiptText());
    setShowReceiptModal(true);
  };

  // Modalda "Yazdır"a basınca gerçek yazdırma
  const handlePrintReceipt = async () => {
    try {
      // Adisyonu yazdır
      await window.electronAPI.printSale({
        items: currentOrder,
        table_number: selectedTable?.number || selectedTable?.name,
        total_amount: calculateTotal()
      });
      toast.success('Sipariş başarıyla yazdırıldı.');
      setShowReceiptModal(false);
    } catch (error) {
      toast.error('Yazdırma işlemi sırasında hata oluştu.');
    }
  };

  // Hesapı kapat
  const handleCloseBill = async () => {
    if (!activeOrderId) {
      toast.error('Kapatılacak aktif sipariş bulunamadı.');
      return;
    }
    try {
      setLoading(true);
      const response = await tableService.closeTableOrder(activeOrderId);
      if (response && response.success) {
        toast.success('Hesap başarıyla kapatıldı.');
        setCurrentOrder([]);
        setSelectedTable(null);
        setActiveOrderId(null);
        loadTables();
        loadProducts(); // stokları da güncelle
      } else {
        toast.error('Hesap kapatma işlemi başarısız.');
      }
    } catch (error) {
      console.error('Hesap kapatma hatası:', error);
      toast.error('Hesap kapatma işlemi sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Üst Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 cursor-pointer" onClick={() => navigate('/dashboard')} />
          <span className="text-xl font-bold text-primary-700 ml-2">Kafe Paneli</span>
        </div>
        <div className="flex items-center gap-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="font-mono text-gray-700">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex flex-1 overflow-hidden">
        {/* Masalar */}
        <div className="w-1/5 min-w-[220px] bg-white border-r p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-lg">Masalar</span>
            <button onClick={() => setShowAddTableModal(true)} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /></button>
          </div>
          <div className={`grid grid-cols-2 gap-3 ${tables.length > 4 ? 'overflow-y-auto max-h-[calc(100vh-200px)]' : 'overflow-y-visible max-h-none'}`}>
            {tables.map((table) => {
              const isOccupied = table.status === 'occupied';
              const isSelected = selectedTable?.id === table.id;
              return (
                <div
                  key={table.id}
                  className={`rounded-lg p-3 flex flex-col items-center shadow cursor-pointer border-2 transition-all select-none 
                    ${isSelected ? 'border-primary-500 scale-105' : 'border-transparent'} 
                    ${isOccupied ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'}`}
                  onClick={() => handleTableSelect(table)}
                >
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-1 
                    ${isOccupied ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                    {isOccupied ? <Users className="w-5 h-5"/> : <Coffee className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-lg text-gray-800">Masa {table.number || table.name}</span>
                  <span className={`text-xs mt-1 font-semibold ${isOccupied ? 'text-red-600' : 'text-green-600'}`}>
                    {isOccupied ? 'Dolu' : 'Boş'}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }} 
                    className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ürünler */}
        <div className="w-2/5 bg-gray-50 p-6 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-lg">Ürünler</span>
            <button onClick={() => setShowAddProductModal(true)} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /></button>
          </div>
          <input
            type="text"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Ürün ara..."
            className="input input-bordered mb-4 w-full"
          />
          <div className="flex flex-col gap-3">
            {products
              .filter(product =>
                product.name.toLowerCase().includes(productSearch.toLowerCase())
              )
              .map((product) => (
                <div key={product.id} className="flex items-center justify-between bg-white rounded-lg shadow p-3">
                  <div>
                    <span className="font-semibold">{product.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{product.category}</span>
                    {typeof product.stock_quantity === 'number' && !isNaN(product.stock_quantity) && product.stock_quantity >= 0 && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full align-middle ${product.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>Stok: {product.stock_quantity}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary-600">{product.price}₺</span>
                    <button onClick={() => handleProductSelect(product)} className="btn btn-success btn-xs"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Sipariş Detayı */}
        <div className="w-2/5 bg-white p-6 flex flex-col">
          <span className="font-semibold text-lg mb-4">Masa {selectedTable?.number || selectedTable?.name} - Sipariş</span>
          <div className="flex-1 overflow-y-auto">
            {currentOrder.length === 0 ? (
              <div className="text-gray-400 text-center mt-10">Sipariş seçilmedi</div>
            ) : (
              <div className="flex flex-col gap-4">
                {currentOrder.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between bg-white rounded-xl shadow-md p-4 transition hover:shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-bold text-lg truncate max-w-[120px]">{product.name}</span>
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full ml-2">{product.price}₺</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDecreaseQuantity(product.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-xl w-8 text-center select-none">{product.quantity}</span>
                      <button
                        onClick={() => handleIncreaseQuantity(product.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromOrder(product.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-500 hover:text-white text-red-500 transition"
                        title="Ürünü sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Toplam:</span>
              <span className="text-2xl font-bold text-primary-600">{calculateTotal()}₺</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={handleCompleteOrder} disabled={loading} className="btn btn-primary text-lg py-3 flex items-center justify-center">
                <Save className="w-5 h-5 mr-2" /> Siparişi Kaydet
              </button>
              <button onClick={handleCloseBill} disabled={currentOrder.length === 0} className="btn btn-success text-lg py-3 flex items-center justify-center">
                <DollarSign className="w-5 h-5 mr-2" /> Hesap Kapat
              </button>
              <button onClick={handlePrintOrder} disabled={currentOrder.length === 0} className="btn btn-warning text-lg py-3 flex items-center justify-center">
                <Printer className="w-5 h-5 mr-2" /> Yazdır
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modaller burada kalacak (mevcut kod) */}
      {/* Masa Ekleme Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Yeni Masa Ekle</h3>
            <form onSubmit={handleAddTable}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masa Numarası</label>
                  <input
                    ref={inputTableNumberRef}
                    type="text"
                    value={newTable.number}
                    onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                    className="input w-full"
                    placeholder="Masa numarası"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasite</label>
                  <input
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                    className="input w-full"
                    placeholder="4"
                    min="1"
                    max="20"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                  {loading ? 'Ekleniyor...' : 'Ekle'}
                </button>
                <button type="button" onClick={() => setShowAddTableModal(false)} className="btn btn-secondary flex-1">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ürün Ekleme Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Yeni Ürün Ekle</h3>
            <form onSubmit={handleAddProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                  <input
                    ref={inputProductNameRef}
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="input w-full"
                    placeholder="Ürün adı"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                    required
                  />
                </div>
                {/* Yeni ürün ekle modalında stok takibi seçeneği */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="trackStock"
                    checked={newProduct.trackStock ?? true}
                    onChange={e => setNewProduct({ ...newProduct, trackStock: e.target.checked })}
                  />
                  <label htmlFor="trackStock" className="text-sm text-gray-700">Stok Takibi Yapılsın</label>
                </div>
                {(newProduct.trackStock ?? true) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok (adet)</label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.quantity}
                      onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })}
                      className="input w-full"
                      placeholder="Boş bırakılabilir"
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                  {loading ? 'Ekleniyor...' : 'Ekle'}
                </button>
                <button type="button" onClick={handleCloseAddProductModal} className="btn btn-secondary flex-1">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ürün Düzenleme Modal */}
      {showEditProductModal && editProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ürün Düzenle</h3>
            <form onSubmit={handleEditProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                  {loading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
                <button type="button" onClick={() => setShowEditProductModal(false)} className="btn btn-secondary flex-1">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adisyon Önizleme</h3>
            <pre className="bg-gray-100 rounded p-4 mb-4 whitespace-pre-wrap text-sm">{receiptText}</pre>
            <div className="flex space-x-3">
              <button onClick={handlePrintReceipt} className="btn btn-primary flex-1">Yazdır</button>
              <button onClick={() => setShowReceiptModal(false)} className="btn btn-secondary flex-1">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KafePanel; 