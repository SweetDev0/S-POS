const fs = require('fs');

function randomKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateKeys(panel, count) {
  const prefix = panel.toUpperCase();
  const keys = [];
  for (let i = 0; i < count; i++) {
    keys.push({
      key: `${prefix}-${randomKey(12)}`,
      panel: panel,
      used: false
    });
  }
  return keys;
}

const marketKeys = generateKeys('market', 50);
const kafeKeys = generateKeys('kafe', 50);
const allKeys = [...marketKeys, ...kafeKeys];

fs.writeFileSync('valid_keys.json', JSON.stringify(allKeys, null, 2));

console.log('Anahtarlar başarıyla üretildi ve valid_keys.json dosyasına yazıldı!'); 