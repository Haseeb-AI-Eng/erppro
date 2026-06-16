# ERP Mobile App — Deployment & Download Guide

Your app is now ready for mobile deployment as a **PWA (Progressive Web App)** and as a **native Android app** (Capacitor).

## Option 1: Download & Install PWA (Fastest — Recommended) ✅

The PWA is the fastest way to install on mobile. It works on Android, iOS, and any device with a browser.

### On Android:
1. Open Chrome/Firefox on your phone.
2. Navigate to your deployed app URL (see deployment section below).
3. Tap the browser menu (⋯) → **"Install app"** or **"Add to Home Screen"**.
4. Confirm; the app appears as an icon on your home screen.
5. Open the app — it loads offline and works like a native app.

### On iOS:
1. Open Safari on your phone.
2. Navigate to your app URL.
3. Tap Share (arrow box) → **"Add to Home Screen"**.
4. Confirm; the app appears on your home screen.
5. Tap to open.

## Option 2: Deploy the Web App (Host Required)

The PWA needs to be hosted online for mobile devices to access. Choose one:

### **Vercel (Free, Recommended)**
```bash
cd frontend
npm install -g vercel
vercel
```
- Vercel auto-detects your Vite app and deploys automatically.
- Share the generated URL with users for PWA install.

### **Netlify (Free)**
```bash
cd frontend
npm install -g netlify-cli
netlify deploy --dir dist
```

### **Local Network (LAN Testing)**
```bash
cd frontend
npm install -g serve
serve dist -l 3000
```
Then access from your phone on the same WiFi:
- Get your PC's IP: `ipconfig` (look for IPv4 address, e.g., `192.168.1.100`)
- On phone browser: `http://192.168.1.100:3000`
- Install as PWA (tap menu → "Install app")

### **Docker (Production)**
```bash
cd frontend
docker build -t erp-app .
docker run -p 80:3000 erp-app
```

## Option 3: Native Android Build (Requires Android SDK)

If you have Android Studio & SDK set up locally:

```bash
cd frontend/android
# Windows:
cmd /c gradlew.bat assembleDebug

# macOS/Linux:
./gradlew assembleDebug
```

The APK appears at: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

Install on device:
```bash
adb install app-debug.apk
```

## Option 4: Use EAS (Cloud Build — When Service Recovers)

Once Expo EAS service is back online:
```bash
cd frontend
npx eas build --platform android --profile production
```
This produces a production APK without local SDK setup.

---

## What's New in Your App

- ✅ **PWA-Ready**: Installable on any mobile device via browser.
- ✅ **Offline Support**: Service worker caches assets for offline use.
- ✅ **Responsive Design**: Sidebar hides on mobile, renders as overlay.
- ✅ **Mobile Meta Tags**: Fullscreen, status bar styling, theme colors.
- ✅ **Capacitor Android**: Native wrapper ready to build if needed.
- ✅ **Fast Responsive**: Touch-friendly, optimized for small screens.

## Quick Start (Recommended Path)

1. **Deploy to Vercel** (fastest):
   ```bash
   cd frontend && vercel
   ```

2. **Get the URL** and share with users or access on your phone.

3. **Install from browser**:
   - Android: Menu (⋯) → "Install app"
   - iOS: Share → "Add to Home Screen"

4. **Done!** — You now have a mobile-installed app.

---

## Backend Configuration

Make sure `frontend/.env` has your backend URL:
```
VITE_API_URL=http://your-backend-url:5000
```
(or update at deployment time in Vercel/Netlify environment variables)

---

## Testing on Mobile

### Test responsive design:
- Open the web app on your phone at any of the URLs above.
- Verify login, dashboard, and employee screens are touch-friendly.
- Test offline: go airplane mode after loading the app once.

### Test PWA installation:
- Install the app and close your browser completely.
- Tap the home screen icon to reopen — it should load instantly.

---

## Files Added/Modified

- `frontend/public/manifest.json` — PWA app manifest with icons & metadata.
- `frontend/public/service-worker.js` — Offline caching and service worker.
- `frontend/index.html` — PWA meta tags, viewport, theme color.
- `frontend/src/components/layout/Layout.jsx` — Mobile-responsive layout.
- `frontend/src/components/layout/Sidebar.jsx` — Mobile overlay sidebar.
- `frontend/android/` — Capacitor native Android project (ready to build).

---

## Next Steps

1. **Deploy** using Vercel, Netlify, or a custom server.
2. **Test PWA install** on your phone.
3. **Verify backend connectivity** by logging in from mobile.
4. **Share the URL** or build native APK for production.

Enjoy your mobile ERP app! 🚀
