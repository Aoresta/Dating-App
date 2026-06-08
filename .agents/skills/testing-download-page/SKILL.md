---
name: testing-download-page
description: Test the /download page and Amour APK build pipeline. Use when verifying download page UI, APK workflow changes, or navigation updates.
---

# Testing the Download Page & APK Pipeline

## Local Dev Setup

```bash
cd /home/ubuntu/repos/Dating-App
npm install
npm run dev
# Dev server runs on http://localhost:3000
```

## What to Test

### 1. Navigation
- "Download" link should appear as the last item in the site nav bar
- Clicking it navigates to `/download/`

### 2. Product Cards (3 total)
- **Dating**: WEB badge, gold/yellow theme, CTA "Open Dating" → `https://aoresta.online`
- **Friends**: WEB badge, green theme, CTA "Open Friends" → `https://aoresta.online`
- **Amour**: ANDROID badge, red theme, CTA "Download APK" → `https://github.com/Aoresta/Dating-App/releases/latest/download/amour-release.apk` with `download` attribute

### 3. Amour Details Section
- 6 feature cards: Shared Memories, Mood Tracker, Couple Doodles, Daily Questions, Day Counter, Home Screen Widgets
- 4 screenshot placeholders: Home, Memories, Mood, Doodle
- Download box: version, platform (Android 7.0+), size, "View all releases" link, Download APK button

### 4. Workflow YAML Validation
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/build-apk.yml')); print('VALID')"
```
Key checks:
- Java 21 (required for AGP 8.13.0)
- Node 22
- Triggers: push tags `v*` + workflow_dispatch
- Release upload conditioned on `startsWith(github.ref, 'refs/tags/')`

### 5. APK Build (requires tag push)
Cannot be tested locally. After merging:
```bash
git tag v1.0.0 && git push origin v1.0.0
```
Or use Actions → Build Amour APK → Run workflow (manual, produces artifact only).

## Project Structure Notes
- Root: Next.js 16 static site (`app/` directory)
- `amour/`: Vite + React + Capacitor app with Android project at `amour/android/`
- `dating-app/`: Separate Next.js TypeScript app
- Workflow: `.github/workflows/build-apk.yml`
- Download page: `app/download/page.js`
- CSS: `app/globals.css` (download-related classes prefixed with `.download-`, `.product-`, `.amour-`)

## Devin Secrets Needed
None required for local testing. Supabase keys needed only if testing the Amour app itself (not the download page).
