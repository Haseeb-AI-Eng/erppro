Expo mobile scaffold instructions

This folder contains starter files and instructions to create an Expo-managed React Native app that can connect to the existing backend.

Recommended workflow

1. Create a new Expo app in this folder (run from the repo root):

```bash
npx create-expo-app mobile
```

2. Install runtime dependencies inside `mobile`:

```bash
cd mobile
npm install axios
npx expo install expo-secure-store
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

3. Copy the starter `src/services/api.js` from this folder into `mobile/src/services/api.js` (or merge its contents).

4. Configure the API URL in `app.json` under `expo.extra.apiUrl` or set `API_URL` environment variable for development.

Example `app.json` snippet:

```json
"expo": {
  "extra": {
    "apiUrl": "http://<your-backend-host>:5000"
  }
}
```

5. Start the app with Expo:

```bash
npx expo start
```

6. Use Expo Go on your mobile device or build dev clients/EAS for native testing.

Notes
- Use `expo-secure-store` to persist auth tokens on device.
- For sockets/push notifications, install and configure `socket.io-client` and `expo-notifications` respectively.
- This README intentionally leaves UI and navigation decisions to be implemented next.
