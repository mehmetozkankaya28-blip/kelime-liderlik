# Kelime Oyunları — Online Liderlik Sunucusu

Bağımlılıksız küçük Node sunucusu. Skorları `leaderboard.json`'da tutar.
Uçlar: `GET /api/top?limit=50` · `POST /api/score {device,nick,score}` · `GET /health`

## Yerelde test
```
node server/index.js      # http://localhost:8787/health
```

## Ücretsiz yayına alma — Render.com (önerilen, ~5 dk)
1. Bu projeyi bir **GitHub** deposuna yükle (server klasörü dahil).
2. https://render.com → ücretsiz hesap → **New → Web Service** → GitHub deposunu seç.
3. Ayarlar:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** Free
   (Repoda `render.yaml` var; Render "Blueprint" ile otomatik de okuyabilir.)
4. Deploy bitince adresi al, örn: `https://kelime-liderlik.onrender.com`
5. Test: tarayıcıda `<adres>/health` → `{"ok":true}` görmelisin.

## Railway / Heroku
Repoda kök `Procfile` var (`web: node server/index.js`). Yeni proje → repoyu bağla → otomatik çalışır.

## Docker (kendi sunucun)
```
docker build -t kelime-liderlik server
docker run -p 8787:8787 kelime-liderlik
```

## Uygulamaya bağlama
`www/app.js` ilk satırlarındaki:
```js
let LB_URL = '';
```
değerini yayın adresinle değiştir:
```js
let LB_URL = 'https://kelime-liderlik.onrender.com';
```
Sonra: `npx cap copy android` → yeniden derle. Boş bırakılırsa uygulama **çevrimdışı** (bot) liderliğe düşer.

> Not: Render ücretsiz katmanı 15 dk hareketsizlikte uykuya geçer; ilk istek birkaç sn gecikebilir. Kalıcı/hızlı için ücretli katman veya kendi VPS'in.
