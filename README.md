S-POS
S-POS: Küçük işletmeler için modern, güvenli ve kullanıcı dostu bir satış noktası (POS) ve stok yönetim uygulaması.
İçindekiler
Özellikler
Ekran Görüntüleri
Kurulum
Kullanım
Teknolojiler
Geliştirici Notları
Katkı Sağlama
Lisans
İletişim
Özellikler
Kafe ve Market Modu: Masa yönetimi, hızlı satış, ürün ekleme/çıkarma, sipariş takibi
Kullanıcı Bazlı Veri: Her kullanıcının verileri kendine özel, admin tüm verilere erişebilir
Stok Takibi: Ürünler için isteğe bağlı stok kontrolü, düşük stok uyarıları, negatif stok engelleme
Yedekleme & Geri Yükleme: Otomatik ve manuel yedekleme, kullanıcıya özel yedek dosyaları, kolay geri yükleme
İstatistikler: Satış ve ürün istatistikleri, toplam gelir, en çok satan ürünler, kategori bazlı raporlar
Modern Arayüz: React.js + Tailwind CSS ile hızlı ve şık kullanıcı deneyimi
Güvenlik: Tüm hassas bilgiler .env dosyalarında saklanır, kullanıcı yetkilendirme ve rol yönetimi
Kolay Kurulum: SQLite3 ile ek sunucuya gerek yok, tamamen lokal çalışır
Çoklu Platform: Electron ile Windows, Mac ve Linux desteği
Ekran Görüntüleri
> Buraya uygulamanızdan birkaç ekran görüntüsü ekleyin (örn. docs/screenshots/ klasörüne koyup markdown ile ekleyebilirsiniz):
Apply to .gitignore
Kurulum
Gereksinimler
Node.js (v18+ önerilir)
npm, pnpm veya yarn
Git
Adımlar
Projeyi Klonlayın:
Apply to .gitignore
Bağımlılıkları Yükleyin:
Apply to .gitignore
Ortam Değişkenlerini Ayarlayın:
.env dosyasını oluşturun, örnek için .env.sample dosyasına bakabilirsiniz.
Uygulamayı Başlatın:
Geliştirme için:
Apply to .gitignore
Electron masaüstü uygulaması olarak:
Apply to .gitignore
Kullanım
Kafe Paneli: Masaları yönetin, sipariş alın, masa durumlarını takip edin.
Market Paneli: Barkod ile hızlı satış yapın, ürünleri yönetin.
Stok Yönetimi: Ürün ekleyin, stokları güncelleyin, düşük stok uyarılarını görün.
Profil: Kullanıcı bilgilerinizi güncelleyin, yedek alın/yükleyin.
İstatistikler: Satış ve ürün performansını kategori bazında görüntüleyin, istatistikleri sıfırlayın.
Teknolojiler
Frontend: React.js, Tailwind CSS, Lucide React
Backend: Node.js, Electron, SQLite3
Veritabanı: SQLite3 (tamamen lokal)
Diğer: IPC (Electron), dotenv, fs/promises, Prisma (opsiyonel), Git
Geliştirici Notları
Tüm veriler system.db dosyasında lokal olarak saklanır.
Yedekler backups/{userId}/ klasöründe tutulur.
Admin kullanıcılar tüm verileri görebilir ve yönetebilir.
Her kullanıcı kendi ürün, masa ve satış verilerini görür.
.env dosyasında API anahtarları ve hassas bilgiler saklanır.
Uygulama açıldığında otomatik yedek alınır.
Masaüstü uygulaması olarak çalışır, internet gerektirmez.
Katkı Sağlama
Fork'layın ve yeni bir branch açın.
Değişikliklerinizi yapın.
Pull request gönderin.
Hataları veya önerileri Issues kısmından bildirin.
Lisans
MIT Lisansı
İletişim
Geliştirici: SweetDev
E-posta: miracege0201@hotmail.com
Not:
Bu uygulama tamamen yerel çalışır, verileriniz bilgisayarınızda saklanır. Yedeklerinizi düzenli olarak almayı unutmayın!
