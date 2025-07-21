import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Users,
  Clock,
  Save,
  Printer,
  Calculator,
  DollarSign,
  X,
  Edit3,
  Search,
  Barcode,
  Package,
  ArrowRight,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import productService from "../../services/productService";

const MarketPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    barcode: "",
  });
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [info, setInfo] = useState("");
  const [selectedMode, setSelectedMode] = useState(null); // 'normal' veya 'barcode'

  const inputProductNameRef = useRef();
  const barcodeInputRef = useRef();

  useEffect(() => {
    if (showAddProductModal) {
      setTimeout(() => {
        inputProductNameRef.current?.focus();
      }, 100);
    }
    if (showBarcodeModal) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
    if (selectedMode === "barcode") {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [showAddProductModal, showBarcodeModal, selectedMode]);

  const handleCloseAddProductModal = () => {
    setShowAddProductModal(false);
    setNewProduct({ name: "", price: "", quantity: "", barcode: "" });
  };

  // Çıkış yapma fonksiyonu
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Başarıyla çıkış yapıldı");
      navigate("/login");
    } catch (error) {
      toast.error("Çıkış yapılırken hata oluştu");
    }
  };

  useEffect(() => {
    if (user && user.id) {
      loadProducts();
    }
  }, [user]);

  // Ürünleri yükle
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts(user.id, {
        category: "market",
      });
      const productsArray = Array.isArray(response)
        ? response
        : (response.data ?? response.products ?? []);
      setProducts(productsArray);
    } catch (error) {
      console.error("Ürünler yüklenirken hata:", error);
      toast.error("Ürünler yüklenirken hata oluştu");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Ürün ekle
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (
      !newProduct.name.trim() ||
      !newProduct.price.trim() ||
      !newProduct.barcode.trim()
    ) {
      toast.error("Ürün adı, fiyatı ve barkod zorunludur");
      return;
    }

    try {
      setLoading(true);
      const productData = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity) || 0,
        barcode: newProduct.barcode.trim(),
        category: "market",
        user_id: user.id,
      };

      const response = await productService.createProduct(productData, user.id);
      if (response && response.success) {
        toast.success("Ürün başarıyla eklendi");
        handleCloseAddProductModal();
        loadProducts();
      } else {
        toast.error(response?.error || "Ürün eklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Ürün ekleme hatası:", error);
      toast.error("Ürün eklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Ürün düzenle
  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (
      !editProduct.name.trim() ||
      !editProduct.price ||
      !editProduct.barcode.trim()
    ) {
      toast.error("Ürün adı, fiyatı ve barkod zorunludur");
      return;
    }

    try {
      setLoading(true);
      const productData = {
        name: editProduct.name.trim(),
        price: parseFloat(editProduct.price),
        quantity: parseInt(editProduct.quantity) || 0,
        barcode: editProduct.barcode.trim(),
        category: "market",
      };

      const response = await productService.updateProduct(editProduct.id, productData, user.id);
      if (response && response.success) {
        toast.success("Ürün başarıyla güncellendi");
        setShowEditProductModal(false);
        setEditProduct(null);
        loadProducts();
      } else {
        toast.error(response?.error || "Ürün güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("Ürün güncelleme hatası:", error);
      toast.error("Ürün güncellenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Ürün sil
  const handleDeleteProduct = async (productId) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await productService.deleteProduct(productId);
      if (response && response.success) {
        toast.success("Ürün başarıyla silindi");
        loadProducts();
      } else {
        toast.error(response?.error || "Ürün silinirken hata oluştu");
      }
    } catch (error) {
      console.error("Ürün silme hatası:", error);
      toast.error("Ürün silinirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Ürün seçimi
  const handleProductSelect = (product) => {
    // Sadece gerçekten sayısal bir stok varsa kontrol yap
    if (typeof product.stock_quantity === 'number' && !isNaN(product.stock_quantity)) {
      if (product.stock_quantity <= 0) {
        toast.error(`${product.name} ürününün stoku tamamen tükendi!`);
        return;
      }
      const existingProduct = selectedProducts.find((p) => p.id === product.id);
      if (existingProduct && existingProduct.quantity >= product.stock_quantity) {
        toast.error(
          `${product.name} ürününün stoku yetersiz! Mevcut stok: ${product.stock_quantity} adet`
        );
        return;
      }
    }
    const existingProduct = selectedProducts.find((p) => p.id === product.id);
    if (existingProduct) {
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts((prev) => [...prev, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} sepete eklendi`);
  };

  // Ürün miktarını artır
  const handleIncreaseQuantity = (productId) => {
    const productInCart = selectedProducts.find((p) => p.id === productId);
    const originalProduct = products.find((p) => p.id === productId);

    if (productInCart && originalProduct) {
      if (typeof originalProduct.stock_quantity === 'number' && !isNaN(originalProduct.stock_quantity)) {
        if (originalProduct.stock_quantity <= 0) {
          toast.error(`${originalProduct.name} ürününün stoku tamamen tükendi!`);
          return;
        }
        if (productInCart.quantity >= originalProduct.stock_quantity) {
          toast.error(
            `${originalProduct.name} ürününün stoku yetersiz! Mevcut stok: ${originalProduct.stock_quantity} adet`
          );
          return;
        }
      }

      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    }
  };

  // Ürün miktarını azalt
  const handleDecreaseQuantity = (productId) => {
    setSelectedProducts((prev) =>
      prev
        .map((p) =>
          p.id === productId
            ? { ...p, quantity: Math.max(0, p.quantity - 1) }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );
  };

  // Ürün seçimi kaldır
  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Toplam hesapla
  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);
  };

  // Satış tamamla
  const handleCompleteSale = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Lütfen en az bir ürün seçin");
      return;
    }

    try {
      setLoading(true);

      // Satış verilerini hazırla
      const saleData = {
        items: selectedProducts.map((product) => ({
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          total: product.price * product.quantity,
        })),
        total_amount: calculateTotal(),
        user_id: user.id,
        type: "market",
        status: "completed",
        payment_method: "cash",
        created_at: new Date().toISOString(),
      };

      // Satışı kaydet
      const response = await window.electronAPI.createSale(saleData);

      if (response && response.success) {
        // Stok güncelle
        for (const item of selectedProducts) {
          const updatedQuantity = item.quantity - item.quantity;
          await productService.updateProduct(item.id, {
            quantity: updatedQuantity,
          });
        }

        toast.success("Satış başarıyla tamamlandı");
        setSelectedProducts([]);
        setInfo("Satış başarıyla tamamlandı!");
        setTimeout(() => setInfo(""), 3000);
        loadProducts(); // Ürünleri güncelle
      } else {
        toast.error(response?.error || "Satış tamamlanırken hata oluştu");
      }
    } catch (error) {
      console.error("Satış tamamlama hatası:", error);
      toast.error("Satış tamamlanırken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Barkod ile ürün ara
  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) {
      toast.error("Barkod giriniz");
      return;
    }

    try {
      const product = products.find((p) => p.barcode === barcodeInput.trim());
      if (product) {
        handleProductSelect(product);
        setBarcodeInput("");
        setShowBarcodeModal(false);
        toast.success(`${product.name} sepete eklendi`);
      } else {
        toast.error("Bu barkoda sahip ürün bulunamadı");
      }
    } catch (error) {
      console.error("Barkod arama hatası:", error);
      toast.error("Barkod arama hatası");
    }
  };

  // Satışı yazdır
  const handlePrintSale = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Lütfen en az bir ürün seçin");
      return;
    }
    try {
      const response = await window.electronAPI.printSale(selectedProducts);
      if (response.success) {
        toast.success("Satış başarıyla yazdırıldı.");
      } else {
        toast.error("Yazdırma işlemi başarısız.");
      }
    } catch (error) {
      console.error("Yazdırma hatası:", error);
      toast.error("Yazdırma işlemi sırasında hata oluştu.");
    }
  };

  // Fişi kapat
  const handleCloseReceipt = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Lütfen en az bir ürün seçin");
      return;
    }
    try {
      const response = await window.electronAPI.closeSale(selectedProducts);
      if (response.success) {
        toast.success("Fiş başarıyla kapatıldı.");
        setSelectedProducts([]);
      } else {
        toast.error("Fiş kapatma işlemi başarısız.");
      }
    } catch (error) {
      console.error("Fiş kapatma hatası:", error);
      toast.error("Fiş kapatma işlemi sırasında hata oluştu.");
    }
  };

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm)),
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-10 px-2 md:px-0">
      <div className="w-full max-w-7xl mx-auto">
        {/* Seçim Ekranı */}
        {!selectedMode ? (
          <>
            {/* Seçim Ekranı Header */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="btn btn-secondary text-base px-5 py-2.5 shadow-md"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Geri Dön
                </Link>
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 flex items-center tracking-tight">
                    <ShoppingCart className="w-10 h-10 mr-4 text-purple-600 drop-shadow-lg" />
                    Market Satış Paneli
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg leading-relaxed">
                    Satış türünü seçerek başlayın
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {/* Normal Satış Kartı */}
              <div
                className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-t-8 border-purple-200 group"
                onClick={() => setSelectedMode("normal")}
              >
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-7 group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-12 h-12 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Normal Satış
                  </h2>
                  <p className="text-gray-500 mb-8 text-base">
                    Ürünleri listeden seçerek satış yapın
                  </p>
                  <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center text-lg group-hover:scale-105">
                    <span>Başla</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>

              {/* Barkodlu Satış Kartı */}
              <div
                className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-t-8 border-green-200 group"
                onClick={() => setSelectedMode("barcode")}
              >
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-7 group-hover:scale-110 transition-transform">
                    <Barcode className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Barkodlu Satış
                  </h2>
                  <p className="text-gray-500 mb-8 text-base">
                    Barkod okuyucu ile hızlı satış yapın
                  </p>
                  <button className="w-full bg-gradient-to-r from-green-500 to-teal-400 hover:from-teal-400 hover:to-green-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center text-lg group-hover:scale-105">
                    <span>Başla</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* İçerik Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedMode(null)}
                  className="btn btn-secondary"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri Dön
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <ShoppingCart className="w-8 h-8 mr-3 text-purple-600" />
                    {selectedMode === "normal"
                      ? "Normal Satış"
                      : "Barkodlu Satış"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedMode === "normal"
                      ? "Ürünleri seçerek satış yapın"
                      : "Barkod okuyucu ile hızlı satış yapın"}
                  </p>
                </div>
              </div>
              {selectedMode && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    <span className="mr-4">Toplam Ürün {products.length}</span>
                    <span>Sepet {selectedProducts.length} ürün</span>
                  </div>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="btn btn-primary flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ürün Ekle
                  </button>
                  {/* Çıkış butonu tamamen kaldırıldı */}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sol Panel - Ürün Listesi */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg">
                  <div className="p-6">
                    {selectedMode === "normal" ? (
                      // Normal Satış Modu
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Ürün adı veya barkod ile arayın..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                            {filteredProducts.map((product) => (
                              <div
                                key={product.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center mb-2">
                                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                    <Package className="w-4 h-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">
                                      {product.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {product.barcode}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-lg font-bold text-purple-600">
                                      {product.price}₺
                                    </span>
                                    <span className="text-sm text-gray-500 ml-1">
                                      adet
                                    </span>
                                    <span
                                      className={`text-xs font-semibold px-2 py-1 rounded min-w-[60px] text-center whitespace-nowrap ${
                                        (product.stock_quantity ?? 0) > 10
                                          ? "bg-green-100 text-green-800 border border-green-200"
                                          : (product.stock_quantity ?? 0) > 0
                                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                            : "bg-red-100 text-red-800 border border-red-200"
                                      }`}
                                    >
                                      Stok: {product.stock_quantity ?? 0}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleProductSelect(product)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-lg flex items-center text-xs font-medium min-w-[90px] ml-2 transition-colors"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Sepete Ekle
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Barkodlu Satış Modu
                      <>
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4">
                            IIIII Barkod ile Ürün Ekle
                          </h3>
                          <div className="relative">
                            <input
                              ref={barcodeInputRef}
                              type="text"
                              placeholder="Barkodu okutun veya yazın"
                              value={barcodeInput}
                              onChange={e => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 13) setBarcodeInput(value);
                              }}
                              onKeyPress={e => {
                                if (e.key === 'Enter') {
                                  handleBarcodeSearch(e);
                                }
                              }}
                              maxLength={13}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="w-full border-2 border-yellow-400 focus:border-yellow-500 text-lg py-4 px-4 rounded-lg pr-16"
                              autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none bg-white px-1 pointer-events-none">{barcodeInput.length}/13</span>
                          </div>
                          <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Ürün adı veya barkod ile arayın..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto">
                            {filteredProducts.map((product) => (
                              <div
                                key={product.id}
                                className="border border-gray-200 rounded-lg p-4 mb-4 hover:border-green-300 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                                      <Package className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-900">
                                        {product.name}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        {product.barcode}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">
                                      {product.price}₺
                                    </div>
                                    <span
                                      className={`text-sm font-medium px-3 py-2 rounded-lg ${
                                        (product.stock_quantity ?? 0) > 10
                                          ? "bg-green-100 text-green-800 border border-green-200"
                                          : (product.stock_quantity ?? 0) > 0
                                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                            : "bg-red-100 text-red-800 border border-red-200"
                                      }`}
                                    >
                                      Stok: {product.stock_quantity ?? 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <button
                                    onClick={() => handleProductSelect(product)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-colors"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Sepete Ekle
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ Panel - Sepet */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg sticky top-4">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <ShoppingCart className="w-5 h-5 mr-2 text-gray-600" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Sepet
                      </h2>
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        {selectedProducts.length} ürün
                      </span>
                    </div>

                    {selectedProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Henüz ürün seçilmedi</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {selectedProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {product.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {product.price}₺ × {product.quantity}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900">
                                  {product.price * product.quantity}₺
                                </span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() =>
                                      handleDecreaseQuantity(product.id)
                                    }
                                    className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-semibold min-w-[2rem] text-center">
                                    {product.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleIncreaseQuantity(product.id)
                                    }
                                    className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemoveProduct(product.id)
                                  }
                                  className="w-6 h-6 border border-red-300 rounded flex items-center justify-center hover:bg-red-50 text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4 mt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold">
                              Toplam:
                            </span>
                            <span className="text-2xl font-bold text-purple-600">
                              {calculateTotal()}₺
                            </span>
                          </div>

                          <button
                            onClick={handleCompleteSale}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          >
                            {loading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                İşleniyor...
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Ödeme Al
                              </div>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bilgi Mesajı */}
            {info && (
              <div className="mt-4 p-4 rounded-xl text-center bg-green-50 text-green-800 border border-green-200">
                {info}
              </div>
            )}
          </>
        )}
      </div>

      {/* Ürün Ekleme Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Yeni Ürün Ekle</h3>
            <form onSubmit={handleAddProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı
                  </label>
                  <input
                    ref={inputProductNameRef}
                    type="text"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="input w-full"
                    placeholder="Ürün adı"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="input w-full"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Miktarı
                  </label>
                  <input
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, quantity: e.target.value })
                    }
                    className="input w-full"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barkod *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newProduct.barcode}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 13) setNewProduct({ ...newProduct, barcode: value });
                      }}
                      className="input w-full pr-16"
                      placeholder="Barkod (zorunlu)"
                      required
                      maxLength={13}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none bg-white px-1 pointer-events-none">{newProduct.barcode.length}/13</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? "Ekleniyor..." : "Ekle"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseAddProductModal}
                  className="btn btn-secondary flex-1"
                >
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, name: e.target.value })
                    }
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.price}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, price: e.target.value })
                    }
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Miktarı
                  </label>
                  <input
                    type="number"
                    value={editProduct.quantity}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        quantity: e.target.value,
                      })
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barkod *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editProduct.barcode || ""}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 13) setEditProduct({ ...editProduct, barcode: value });
                      }}
                      className="input w-full pr-16"
                      placeholder="Barkod (zorunlu)"
                      required
                      maxLength={13}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none bg-white px-1 pointer-events-none">{(editProduct.barcode || "").length}/13</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? "Güncelleniyor..." : "Güncelle"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barkod Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Barkod ile Ürün Ara</h3>
            <form onSubmit={handleBarcodeSearch}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barkod
                  </label>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="input w-full"
                    placeholder="Barkod giriniz"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  Ara
                </button>
                <button
                  type="button"
                  onClick={() => setShowBarcodeModal(false)}
                  className="btn btn-secondary flex-1"
                >
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

export default MarketPanel;
