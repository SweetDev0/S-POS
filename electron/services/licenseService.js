const fs = require('fs');
const path = require('path');

class LicenseService {
  constructor() {
    this.keysFilePath = path.join(__dirname, '../../valid_keys.json');
  }

  // Tüm anahtarları oku
  async getAllKeys() {
    try {
      const data = fs.readFileSync(this.keysFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Anahtarlar okunamadı:', error);
      return [];
    }
  }

  // Anahtarları kaydet
  async saveKeys(keys) {
    try {
      fs.writeFileSync(this.keysFilePath, JSON.stringify(keys, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Anahtarlar kaydedilemedi:', error);
      return { success: false, error: error.message };
    }
  }

  // Anahtar kullanıldı olarak işaretle
  async markKeyAsUsed(key) {
    try {
      const keys = await this.getAllKeys();
      const keyIndex = keys.findIndex(k => k.key === key);
      
      if (keyIndex === -1) {
        return { success: false, error: 'Anahtar bulunamadı' };
      }

      keys[keyIndex].used = true;
      keys[keyIndex].usedAt = new Date().toISOString();
      
      await this.saveKeys(keys);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lisans istatistikleri
  async getLicenseStats() {
    try {
      const keys = await this.getAllKeys();
      
      const stats = {
        total: keys.length,
        market: {
          total: keys.filter(k => k.panel === 'market').length,
          used: keys.filter(k => k.panel === 'market' && k.used).length,
          unused: keys.filter(k => k.panel === 'market' && !k.used).length
        },
        kafe: {
          total: keys.filter(k => k.panel === 'kafe').length,
          used: keys.filter(k => k.panel === 'kafe' && k.used).length,
          unused: keys.filter(k => k.panel === 'kafe' && !k.used).length
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Yeni anahtar üret
  async generateNewKey(panel) {
    try {
      const keys = await this.getAllKeys();
      
      // Panel kontrolü
      if (!['market', 'kafe'].includes(panel)) {
        return { success: false, error: 'Geçersiz panel' };
      }

      // Yeni anahtar oluştur
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let key;
      let isUnique = false;
      
      while (!isUnique) {
        key = `${panel.toUpperCase()}-`;
        for (let i = 0; i < 12; i++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Benzersizlik kontrolü
        isUnique = !keys.some(k => k.key === key);
      }

      // Yeni anahtarı ekle
      const newKey = {
        key: key,
        panel: panel,
        used: false,
        createdAt: new Date().toISOString()
      };

      keys.push(newKey);
      await this.saveKeys(keys);

      return { success: true, data: newKey };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Kullanılan anahtarları listele
  async getUsedKeys() {
    try {
      const keys = await this.getAllKeys();
      return keys.filter(k => k.used);
    } catch (error) {
      console.error('Kullanılan anahtarlar alınamadı:', error);
      return [];
    }
  }

  // Kullanılmayan anahtarları listele
  async getUnusedKeys() {
    try {
      const keys = await this.getAllKeys();
      return keys.filter(k => !k.used);
    } catch (error) {
      console.error('Kullanılmayan anahtarlar alınamadı:', error);
      return [];
    }
  }
}

module.exports = new LicenseService(); 