# Arc Swap

Arc Testnet üzerinde USDC ↔ EURC swap uygulaması. [Circle App Kit](https://docs.arc.io/app-kit) + RainbowKit.

## Kurulum

```bash
cd "/Users/ibrahimacar/Documents/arc-swap"
cp .env.example .env.local
# .env.local içini doldurun
npm install
npm run health
npm run dev:clean
```

Tarayıcı: http://localhost:3000

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_KIT_KEY` | [Circle Console](https://console.circle.com) App Kit Key |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | [WalletConnect Cloud](https://cloud.walletconnect.com) |
| `NEXT_PUBLIC_ARC_RPC` | Varsayılan: `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_CHAIN_ID` | Varsayılan: `5042002` |

## Arc Testnet

- Chain ID: **5042002**
- RPC: `https://rpc.testnet.arc.network`
- Faucet: https://faucet.circle.com
- Explorer: https://testnet.arcscan.app

## Not

Arc Testnet swap (App Kit) yalnızca **USDC** ve **EURC** destekler.
