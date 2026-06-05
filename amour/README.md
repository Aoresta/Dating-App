# Amour 💕

A dark, romantic couples PWA built with React, Vite, TailwindCSS, Zustand, Framer Motion, and Supabase.

## Quick Start
1. Clone repo
2. `npm install`
3. Copy `.env.example` → `.env`, fill Supabase keys
4. `npm run dev`

You can also use Demo Mode from the sign-in screen without configuring Supabase.

Local memory uploads are compressed and stored as base64 for offline/demo use. Browsers commonly cap localStorage near 5MB, so production deployments should upload memory images to Supabase Storage and keep the URL in `image_url`.

## Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Run SQL from `/supabase/schema.sql`
3. Enable Google OAuth in Auth → Providers
4. Add Site URL: `https://amour-sooty.vercel.app`
5. Add redirect URLs:
   - `http://localhost:5173/auth`
   - `https://amour-sooty.vercel.app/auth`
   - `com.aoresta.amour://auth-callback`
6. Add env vars in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Deploy FREE on Vercel
1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy

## Deploy FREE on Netlify
1. `netlify deploy --build`
2. Add env vars in site settings
3. Set publish directory: `dist`

## Enable PWA Install
- On Chrome Android: "Add to Home Screen" appears in browser menu
- On iOS Safari: Share → "Add to Home Screen"

## Convert to Native App (Capacitor)
```bash
npm install
npm run build && npx cap sync
npx cap open android
```

The Android project is in `/android`. It includes:
- Package id: `com.aoresta.amour`
- Native OAuth callback: `com.aoresta.amour://auth-callback`
- A basic Android home-screen widget that opens Amour

To build an APK from the command line:
```bash
cd android
gradlew assembleDebug
```

The APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.
