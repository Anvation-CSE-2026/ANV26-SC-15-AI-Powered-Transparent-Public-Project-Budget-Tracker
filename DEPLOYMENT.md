# CivicSight — Production Deployment Guide

## 1. Overview
**CivicSight** is built as a single-page application (SPA) using React 19, TypeScript, and Vite 8, integrated with Firebase (Auth, Firestore, Storage, Cloud Functions) and the Google Gemini API.

This document details deployment workflows for both **Firebase Hosting & Cloud Functions** and **Vercel**.

---

## 2. Environment Configuration

Create a production `.env` (or configure platform environment variables in Firebase/Vercel dashboard):

```env
# Client-side Firebase Configuration
VITE_FIREBASE_API_KEY=your_production_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=civicsight-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=civicsight-prod
VITE_FIREBASE_STORAGE_BUCKET=civicsight-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Server-Side Google Gemini AI API Configuration (Keep Confidential)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

---

## 3. Firebase Deployment (Hosting, Rules & Functions)

### Prerequisites
- Node.js 20+
- Firebase CLI installed: `npm install -g firebase-tools`
- Authenticate CLI: `firebase login`

### Step 1: Initialize Project Reference
```bash
firebase use civicsight-prod
```

### Step 2: Build the Application
```bash
npm run build
```

### Step 3: Deploy Security Rules & Indexes
```bash
firebase deploy --only firestore:rules,storage
```

### Step 4: Deploy Cloud Functions
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Step 5: Deploy Frontend to Firebase Hosting
```bash
firebase deploy --only hosting
```

Or deploy all services simultaneously:
```bash
firebase deploy
```

---

## 4. Vercel Deployment

### Step 1: Connect GitHub Repository
- Import repository into Vercel Dashboard: `https://github.com/Anvation-CSE-2026/ANV26-SC-15-AI-Powered-Transparent-Public-Project-Budget-Tracker`

### Step 2: Configure Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 3: Environment Variables
Add the required `VITE_FIREBASE_*` and `GEMINI_*` keys under Project Settings > Environment Variables.

### Step 4: Deploy
Trigger deployment via `git push origin main` or Vercel CLI:
```bash
vercel --prod
```

---

## 5. Pre-Deployment Verification Checklist
- [x] Run `npm run test` (all 212 tests pass).
- [x] Run `npm run lint` (0 ESLint errors/warnings).
- [x] Run `npm run build` (`tsc -b && vite build` succeeds).
- [x] Verify `firestore.rules` and `storage.rules` contain strict RBAC and immutability rules.
- [x] Verify `.env` is omitted from Git via `.gitignore`.
- [x] Check CORS and security headers in `firebase.json` and `vercel.json`.
