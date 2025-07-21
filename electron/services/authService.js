const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor(db) {
    this.db = db;
    this.jwtSecret = 'system-secret-key-2024';
  }

  async register(userData) {
    const { email, password, name } = userData;

    // Email kontrolü
    const existingUser = await this.db.get(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      throw new Error('Bu email adresi zaten kayıtlı');
    }

    // Şifre hash'leme
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcı oluşturma
    const result = await this.db.run(
      'INSERT INTO users (email, password, name, license_type) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, 'general']
    );

    const user = await this.db.get(
      'SELECT id, email, name, role, license_type FROM users WHERE id = ?',
      [result.id]
    );

    return {
      user,
      token: this.generateToken(user)
    };
  }

  async login(email, password) {
    // Kullanıcıyı bul
    const user = await this.db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Geçersiz şifre');
    }

    // Kullanıcı bilgilerini döndür (şifre hariç)
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: this.generateToken(userWithoutPassword)
    };
  }

  async checkLicense(userId) {
    const user = await this.db.get(
      'SELECT license_type, license_expires FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    const now = new Date();
    const isExpired = user.license_expires && new Date(user.license_expires) < now;

    return {
      licenseType: user.license_type,
      isExpired,
      expiresAt: user.license_expires,
      hasAccess: {
        market: user.license_type === 'market' && !isExpired,
        kafe: user.license_type === 'kafe' && !isExpired
      }
    };
  }

  async activateLicense(licenseData) {
    const { userId, licenseType, paymentResult } = licenseData;

    // Ödeme kontrolü (iyzico'dan gelen sonuç)
    if (!paymentResult.success) {
      throw new Error('Ödeme başarısız');
    }

    // Lisans süresini hesapla (1 yıl)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Lisansı güncelle
    await this.db.run(
      'UPDATE users SET license_type = ?, license_expires = ? WHERE id = ?',
      [licenseType, expiresAt.toISOString(), userId]
    );

    return {
      success: true,
      licenseType,
      expiresAt: expiresAt.toISOString()
    };
  }

  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        licenseType: user.license_type 
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token) {
    try {
      // Önce local secret ile dene
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      try {
        // Online token formatını decode et (secret olmadan)
        const decoded = jwt.decode(token);
        console.log('Online token decoded:', decoded);
        
        if (!decoded) {
          throw new Error('Token decode edilemedi');
        }
        
        // Online token'dan userId'yi al
        const userId = decoded.userId || decoded.id;
        console.log('Extracted userId:', userId);
        
        if (!userId) {
          throw new Error('Token\'da kullanıcı ID bulunamadı');
        }
        
        // Online token için geçici kullanıcı yetkisi ver
        // Local veritabanında bu kullanıcı olmayabilir
        return {
          id: userId,
          userId: userId,
          email: 'online-user@system.com',
          name: 'Online User',
          role: 'online-user', // Online kullanıcı yetkisi
          license_type: 'general'
        };
      } catch (decodeError) {
        console.log('Token decode error:', decodeError);
        throw new Error('Geçersiz token');
      }
    }
  }

  // Online kullanıcılar için esnek yetki kontrolü
  hasPermission(user, requiredRole = 'user') {
    // Online kullanıcılar her şeye erişebilir
    if (user.email && user.email.includes('online-user')) {
      return true;
    }
    
    // Online user ID kontrolü
    if (user.id === 'online-user' || user.userId === 'online-user') {
      return true;
    }
    
    // Admin kullanıcılar her şeye erişebilir
    if (user.role === 'admin') {
      return true;
    }
    
    // Normal kullanıcılar sadece kendi işlemlerini yapabilir
    return user.role === requiredRole;
  }

  async getUserById(userId) {
    console.log('Looking for user with ID:', userId);
    
    // Online kullanıcı kontrolü - UUID formatı dahil
    if (userId === 'online-user' || userId === 'online-user@system.com' || 
                  (userId && typeof userId === 'string' && userId.includes('-') && userId.length > 20)) {
      console.log('Online user detected (UUID or online-user), returning default user');
      return {
        id: 'online-user',
        userId: 'online-user',
        email: 'online-user@system.com',
        name: 'Online User',
        role: 'online-user',
        license_type: 'general'
      };
    }
    
    // Önce string ID ile dene
    let user = await this.db.get(
      'SELECT id, email, name, role, license_type FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      // Integer ID ile dene
      const numericId = parseInt(userId);
      if (!isNaN(numericId)) {
        user = await this.db.get(
          'SELECT id, email, name, role, license_type FROM users WHERE id = ?',
          [numericId]
        );
      }
    }
    
    if (!user) {
      // Email ile dene (online token'da email olabilir)
      user = await this.db.get(
        'SELECT id, email, name, role, license_type FROM users WHERE email = ?',
        [userId]
      );
    }
    
    if (!user) {
      console.log('User not found for ID:', userId);
      // Online kullanıcı olarak kabul et
      return {
        id: 'online-user',
        userId: 'online-user',
        email: 'online-user@system.com',
        name: 'Online User',
        role: 'online-user',
        license_type: 'general'
      };
    }
    
    console.log('Found user:', user);
    return user;
  }

  async getAllUsers() {
    // Tüm kullanıcıları (şifre hariç) döndür
    const users = await this.db.query(
      'SELECT id, email, name, role, license_type, license_expires, created_at FROM users'
    );
    return users;
  }

  // Admin: Kullanıcı silme
  async deleteUser(userId) {
    return await this.db.run('DELETE FROM users WHERE id = ?', [userId]);
  }

  // Admin: Kullanıcı ekleme
  async addUser({ email, password, name, role = 'user', license_type = 'general' }) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.db.run(
      'INSERT INTO users (email, password, name, role, license_type) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, role, license_type]
    );
  }

  // Admin: Kullanıcı güncelleme
  async updateUser(user) {
    // Şifre güncellenmek isteniyorsa hashle, yoksa eski şifreyi koru
    let setPassword = '';
    let params = [];
    if (user.password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(user.password, 10);
      setPassword = ', password = ?';
      params.push(hashedPassword);
    }
    return await this.db.run(
      `UPDATE users SET email = ?, name = ?, role = ?, license_type = ?${setPassword} WHERE id = ?`,
      [user.email, user.name, user.role, user.license_type, ...params, user.id]
    );
  }

  // Kullanıcı: Kendi hesabını silme (şifre doğrulamalı)
  async deleteSelf(userId, password) {
    const user = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('Kullanıcı bulunamadı');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Şifre yanlış');
    return await this.db.run('DELETE FROM users WHERE id = ?', [userId]);
  }
}

module.exports = AuthService; 