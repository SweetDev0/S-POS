const fs = require('fs');

// Anahtarları oku
const keys = JSON.parse(fs.readFileSync('valid_keys.json', 'utf8'));

// Market ve Kafe anahtarlarını ayır
const marketKeys = keys.filter(k => k.panel === 'market').map(k => k.key);
const kafeKeys = keys.filter(k => k.panel === 'kafe').map(k => k.key);

// Çıktı oluştur
let output = '=== MARKET ANAHTARLARI ===\n';
marketKeys.forEach((key, i) => {
  output += `${i+1}. ${key}\n`;
});

output += '\n=== KAFE ANAHTARLARI ===\n';
kafeKeys.forEach((key, i) => {
  output += `${i+1}. ${key}\n`;
});

// Dosyaya yaz
fs.writeFileSync('anahtarlar.txt', output);

console.log('Anahtarlar anahtarlar.txt dosyasına yazıldı!');
console.log(`Market: ${marketKeys.length} adet`);
console.log(`Kafe: ${kafeKeys.length} adet`); 