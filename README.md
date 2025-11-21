# WordLadder (Frontend)

This repository contains the frontend for the WordLadder mobile app — a React Native/Expo-based word ladder game targeted for both iOS and Android.

## Overview

- Framework: React Native (Expo)
- Usage: Mobile word ladder game (players transform one word into another by valid operations)
- Platform targets: iOS and Android

The app uses Redux for state management and integrates Google Mobile Ads and Firebase config files (sample files present in the repo).

## Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- macOS + Xcode for iOS simulator or App Store builds
- Android Studio for Android emulator or native builds
- (Optional) EAS CLI for building production binaries: `npm install -g eas-cli` or use `npx eas`.

## Quick start (development)

1. Install dependencies

```bash
npm install
# or
yarn install
```

2. Start the Expo dev server

```bash
npx expo start
```

3. Open the app

- Use the QR code shown in the terminal to open the app with Expo Go on a physical device.
- Press `i` in the terminal to open the iOS simulator (macOS + Xcode).
- Press `a` to open the Android emulator (if configured).

## Running on device or creating release builds

- This repository includes `eas.json` and is set up for EAS builds. To create production builds, configure your Apple/Google credentials and run:

```bash
npx eas build --platform ios
npx eas build --platform android
```

- You can also eject/compile natively, but the recommended path for production is EAS.

## Configuration and secrets

- Firebase config files are present as `GoogleService-Info.plist` (iOS) and `google-services.json` (Android). Replace with your own files before building production apps.
- Keep any API keys or secrets out of the repo and use environment variables or a secure secrets manager for production.

## Project structure (high level)

- `App.js`, `index.js`, `package.json` — app entry and config
- `components/` — React components
  - `main/` — main screens (Game, Play, Home, Profile, etc.)
  - `shared/` — shared components (buttons, UI parts)
- `redux/` — actions, reducers, store
- `api/` — small server-side helpers used by the app (e.g. `getWordLadderLevelOne.js`)
- `utils/` — helper utilities (validations, word lists)
- `ios/` — native iOS project files

## Notes for developers

- The game uses Google Mobile Ads (React Native Google Mobile Ads). To enable ads in production, configure your ad units and ensure the native setup is completed.
- The `Game` component contains rewarded/interstitial ad logic that gates access to Level Two when the ad has not been watched.
- If you need to debug without ads, you can modify or stub out the ad logic in `components/main/Game.js`.

## Contributing

- Open an issue or submit a PR with a clear description of the change.
- Keep changes focused and follow the existing code style.

## Troubleshooting

- If the Expo dev server fails to start, ensure dependencies are installed and clear any caches: `npx expo start -c`.
- If the iOS build fails locally, ensure Xcode command line tools are installed and the correct iOS SDK is selected.
