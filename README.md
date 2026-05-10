# LibreTV Mobile MVP

Expo MVP for iOS and Android. It talks to CMS-style video APIs directly from the app and does not use the existing Express `/proxy` backend.

## Run

```bash
cd mobile
npm install
npm start
```

Then open it with Expo Go, an Android emulator, or an iOS simulator.

If the Expo CLI cannot reach Expo services in a restricted network, use:

```bash
npm start -- --offline
```

## MVP Scope

- Search several built-in API sources directly.
- Show grouped search results.
- Load detail data and parse HLS episode URLs.
- Play `.m3u8` streams with `expo-av`.
- Save watch history with `AsyncStorage`.
- Toggle API sources in a simple settings sheet.

## Notes

- Some sources may still fail because of source-side anti-hotlink rules, TLS issues, unavailable endpoints, or mobile network blocking.
- iOS/Android native fetch does not need a CORS proxy, but HTTP sources require the cleartext allowances configured in `app.json`.
