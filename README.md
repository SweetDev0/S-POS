# System Stok & Sipariş Takip Uygulaması

Kapsamlı masaüstü stok ve sipariş takip uygulaması. Electron.js tabanlı, Windows ve macOS için geliştirilmiş, barkod destekli stok takibi, satış, masa siparişi, adisyon yönetimi ve lisanslı farklı arayüz panelleri içeren tam işlevsel bir sistem.

## 🚀 Özellikler

### Genel Özellikler
- **Cross-platform**: Windows ve macOS desteği
- **Offline çalışma**: SQLite veritabanı ile lokal depolama
- **Modern arayüz**: React + TailwindCSS ile responsive tasarım
- **Güvenli kimlik doğrulama**: JWT token tabanlı oturum yönetimi

### Panel Sistemi
- **Genel Panel** (Ücretsiz): Temel stok ve ürün yönetimi
- **Manav Paneli** (299₺/yıl): Barkodlu ürün satışı, stok takibi
- **Market Paneli** (399₺/yıl): Gelişmiş satış raporları ve analiz
- **Kafe Paneli** (499₺/yıl): Masa bazlı sipariş ve adisyon yönetimi

### Teknik Özellikler
- **Barkod desteği**: Ürün barkod okuma ve otomatik sepete ekleme
- **Stok yönetimi**: Otomatik stok düşürme ve uyarı sistemi
- **Satış raporları**: Detaylı satış istatistikleri ve analizler
- **Masa yönetimi**: Kafe için masa bazlı sipariş sistemi
- **Ödeme entegrasyonu**: İyzico API ile güvenli ödeme işlemleri

## 🛠️ Teknoloji Stack

- **Frontend**: React 18, TailwindCSS, Lucide React Icons
- **Backend**: Node.js (Electron main process)
- **Veritabanı**: SQLite3
- **Masaüstü**: Electron.js
- **Ödeme**: İyzico API
- **Build Tool**: Vite

## 📦 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Git

### Adım 1: Projeyi klonlayın
```bash
git clone <repository-url>
cd system-stok-siparis
```

### Adım 2: Bağımlılıkları yükleyin
```bash
npm install
```

### Adım 3: Geliştirme modunda çalıştırın
```bash
npm run dev
```

### Adım 4: Production build
```bash
npm run build
npm run dist
```

## 🔧 Konfigürasyon

### İyzico API Ayarları
`electron/services/paymentService.js` dosyasında API anahtarlarını güncelleyin:

```javascript
// Test ortamı (varsayılan)
this.apiKey = 'sandbox-afXhZPW0MQlE4dCUUlHcEopnMBgXnAZI';
this.secretKey = 'sandbox-wbwpzKJDmlGqJxlE4dCUUlHcEopnMBgXnAZI';

// Production için
this.apiKey = 'your-production-api-key';
this.secretKey = 'your-production-secret-key';
this.baseUrl = 'https://api.iyzipay.com';
```

## 📊 Veritabanı Yapısı

### Tablolar
- **users**: Kullanıcı bilgileri ve lisans durumu
- **products**: Ürün bilgileri, barkod, stok, fiyat
- **sales**: Satış kayıtları
- **sale_items**: Satış kalemleri
- **tables**: Kafe masaları
- **open_orders**: Aktif masa siparişleri
- **order_items**: Sipariş kalemleri

## 🎯 Kullanım

### İlk Kurulum
1. Uygulamayı başlatın
2. "Kayıt Ol" ile yeni hesap oluşturun veya demo hesabı kullanın:
   - Email: `admin@system.com`
   - Şifre: `admin123`

### Genel Panel (Ücretsiz)
- Ürün ekleme, düzenleme, silme
- Stok takibi
- Temel ürün listesi

### Premium Paneller
- **Manav Paneli**: Barkod okuyucu ile hızlı satış
- **Market Paneli**: Detaylı raporlar ve analizler
- **Kafe Paneli**: Masa bazlı sipariş sistemi

### Lisans Satın Alma
1. Dashboard'da "Lisans" butonuna tıklayın
2. İstediğiniz paneli seçin
3. İyzico ile güvenli ödeme yapın
4. Lisans otomatik olarak aktifleşir

## 🔒 Güvenlik

- Şifreler bcrypt ile hash'lenir
- JWT token tabanlı oturum yönetimi
- SQL injection koruması
- Güvenli ödeme işlemleri (İyzico)

## 📱 Özellikler Detayı

### Barkod Sistemi
- Barkod okuyucu entegrasyonu
- Otomatik ürün tanıma
- Sepete anında ekleme

### Stok Yönetimi
- Minimum stok uyarıları
- Otomatik stok düşürme
- Stok geçmişi takibi

### Satış Sistemi
- Hızlı satış ekranı
- Farklı ödeme yöntemleri
- Fiş yazdırma desteği

### Kafe Sistemi
- Masa durumu gösterimi
- Sipariş ekleme/çıkarma
- Adisyon yönetimi
- Hesap kapatma

## 🚀 Geliştirme

### Proje Yapısı
```
system-stok-siparis/
├── electron/                 # Electron main process
│   ├── database/            # Veritabanı işlemleri
│   ├── services/            # Backend servisleri
│   ├── main.js              # Ana process
│   └── preload.js           # Preload script
├── src/                     # React uygulaması
│   ├── components/          # React bileşenleri
│   ├── contexts/            # React context'leri
│   └── main.jsx             # Ana React dosyası
├── data/                    # SQLite veritabanı
└── dist/                    # Build çıktıları
```

### Geliştirme Komutları
```bash
# Geliştirme modu
npm run dev

# Electron ile geliştirme
npm run electron-dev

# Production build
npm run build

# Electron paketleme
npm run dist
```

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 Destek

- **Email**: support@system.com
- **Dokümantasyon**: [Wiki sayfası]
- **Issues**: GitHub Issues

## 🔄 Güncellemeler

### v1.0.0
- İlk sürüm
- Temel stok yönetimi
- Barkod desteği
- Lisans sistemi
- İyzico entegrasyonu

## ⚠️ Önemli Notlar

- Uygulama offline çalışır, internet bağlantısı sadece ödeme işlemleri için gereklidir
- Veritabanı dosyası `data/system.db` konumunda saklanır
- Lisans bilgileri veritabanında şifrelenmiş olarak tutulur
- Production kullanımı için İyzico production API anahtarları gerekir

---

**System Stok & Sipariş** - Küçük işletmeler için profesyonel çözüm 