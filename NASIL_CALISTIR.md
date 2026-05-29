# Arc Swap - Nasıl Çalıştırılır? 🚀

## 📋 Gereksinimler
- Node.js (v18 veya üzeri)
- MetaMask cüzdan eklentisi (tarayıcınızda)
- Terminal/Komut satırı

---

## 🎯 Adım 1: Terminali Aç

**Mac'te:**
1. Spotlight'ı aç (Cmd + Space)
2. "Terminal" yaz ve Enter'a bas

---

## 🎯 Adım 2: Proje Klasörüne Git

Terminal'de şu komutu çalıştır:

```bash
cd /Users/ibrahimacar/Documents/arc-swap
```

---

## 🎯 Adım 3: Bağımlılıkları Yükle (İlk Kez)

**Sadece ilk çalıştırmada gerekli:**

```bash
npm install
```

Bu komut tüm gerekli paketleri indirecek (1-2 dakika sürebilir).

---

## 🎯 Adım 4: Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Şu mesajı göreceksin:

```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.5s
```

---

## 🎯 Adım 5: Tarayıcıda Aç

1. Tarayıcını aç (Chrome, Brave, Edge, vb.)
2. Adres çubuğuna yaz: **http://localhost:3000**
3. Enter'a bas

---

## 🎯 Adım 6: MetaMask'ı Bağla

1. Sayfada **"Cüzdan Bağla"** butonuna tıkla
2. MetaMask'ı seç
3. MetaMask'ta **"Bağlan"** onayını ver
4. Sayfa **"Arc Testnet'e Geç"** diyorsa, butona tıkla
5. MetaMask'ta **"Ağı Ekle"** ve **"Ağı Değiştir"** onaylarını ver

---

## 🎯 Adım 7: Test Token Al (Faucet)

Arc Testnet'te swap yapmak için test USDC/EURC gerekli:

1. Tarayıcıda yeni sekme aç: **https://faucet.circle.com**
2. MetaMask adresini yapıştır
3. **Arc Testnet** seç
4. **USDC** ve **EURC** için token talep et
5. 1-2 dakika bekle, bakiyen yüklenecek

---

## 🎯 Adım 8: Swap Yap

1. **Sell** alanına miktar gir (örn: 10)
2. Token'ları seç (USDC → EURC)
3. **Swap** butonuna tıkla
4. MetaMask'ta **2 onay** gelecek:
   - **Approve** (token iznini ver)
   - **Swap** (işlemi onayla)
5. İşlem tamamlanınca **ArcScan** linkine tıklayıp blockchain'de görebilirsin

---

## 🛑 Sunucuyu Durdurma

Terminal'de **Ctrl + C** tuşlarına bas.

---

## 🔧 Sorun Giderme

### "npm: command not found"
Node.js yüklü değil. İndir: https://nodejs.org

### "Port 3000 already in use"
Başka bir uygulama 3000 portunu kullanıyor. Şunu dene:
```bash
npm run dev -- -p 3001
```
Sonra tarayıcıda: http://localhost:3001

### "MetaMask'ta Arc Testnet görünmüyor"
Sayfa otomatik ekleyecek. Manuel eklemek için:
- **Ağ Adı:** Arc Testnet
- **RPC URL:** https://rpc.testnet.arc.network
- **Chain ID:** 5042002
- **Para Birimi:** USDC
- **Block Explorer:** https://testnet.arcscan.app

### "Swap simulation failed"
1. Daha küçük miktar dene (örn: 5 USDC)
2. Slippage'i artır (Settings → 2%)
3. Gas için ~1 USDC bırak (Max yerine manuel miktar gir)

### "Circle API'ye ulaşılamadı"
Sunucuyu yeniden başlat:
```bash
npm run dev:clean
```

---

## 📱 Komutlar Özeti

| Komut | Ne Yapar |
|-------|----------|
| `npm install` | Bağımlılıkları yükler (ilk kez) |
| `npm run dev` | Geliştirme sunucusunu başlatır |
| `npm run dev:clean` | Cache'i temizleyip başlatır |
| `npm run build` | Production build yapar |
| `npm run start` | Production sunucusunu başlatır |
| `npm run lint` | Kod kalitesini kontrol eder |

---

## 🎉 Başarılı!

Artık Arc Testnet'te USDC ve EURC swap yapabilirsin!

**Önemli:** Bu bir test ağı. Gerçek para kullanılmıyor, sadece test token'ları.
