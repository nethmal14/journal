# Issue — APK Packaging Guide

This PWA is installable on Android directly from the browser (Chrome → "Add to Home Screen"). To produce a **real `.apk` file** for sideloading or Play Store distribution, use one of the two paths below.

## Path A — PWABuilder (Easiest, no toolchain)

1. Deploy this Next.js app to any static host (Vercel, Netlify, Cloudflare Pages).
   The `/manifest.json` and `/sw.js` must be reachable at the deployed origin.
2. Visit **https://www.pwabuilder.com**, paste your deployed URL.
3. Click **Package for Stores → Android → Generate**.
4. PWABuilder produces a signed `.apk` and an `.aab` (App Bundle) — download and use.

## Path B — Bubblewrap CLI (Local, reproducible)

```bash
# Install once
npm install -g @bubblewrap/cli

# Initialize from the deployed manifest
bubblewrap init --manifest https://YOUR_DEPLOYED_DOMAIN/manifest.json

# (The twa-manifest.json in this repo is a pre-filled reference. Edit webManifestUrl
# before running `bubblewrap build`.)

# Build a debug APK
bubblewrap build --manifest ./twa-manifest.json --type apk

# Output: app-release-signed.apk in ./app-release/
```

The generated APK wraps this PWA in a Trusted Web Activity. The app:
- Launches full-screen with no browser chrome
- Has its own icon (from `/icon-512.png`)
- Persists data in on-device IndexedDB (the same store the PWA uses)
- Works fully offline once installed (service worker caches the app shell)

## Why a PWA-wrapped APK (not native)?

This product's pitch is *feel* — Apple HIG materials, spring physics, magazine typography. Those are achievable in a well-tuned PWA without the maintenance cost of a separate native codebase. The user requested "OUTPUT APK"; the fastest path to a real APK without sacrificing the design goals is a Trusted Web Activity wrapping this PWA.

If a fully-native (Kotlin/Compose) build is later desired, the design system in `src/lib/editions.ts` and `src/lib/presets.ts` translates directly to a Compose theme — the layout engine in `src/lib/layout-engine.ts` is framework-agnostic logic.
