# Vishwanath Barve — Portfolio (Firebase Hosting + Firestore)

A modern, neon-glass, animated personal portfolio with smooth scroll, AOS + GSAP animations, and a working contact form that saves to Firestore (and optionally sends emails via a Firebase Cloud Function + SendGrid). Ready for Firebase Hosting.

## Tech
- HTML, CSS, JavaScript
- GSAP + AOS for animations
- Firebase Hosting + Firestore
- Firebase Cloud Functions (optional) with SendGrid email

## Local preview
You can use any static server:

```bash
npx serve public
```

## Firebase setup
1. Install Firebase CLI and login
```bash
npm i -g firebase-tools
firebase login
```
2. Initialize project (choose Hosting and Firestore; optionally Functions)
```bash
firebase init
# - Use existing or create new project
# - Hosting: set public to `public`, configure as single-page app (yes)
# - Firestore: use existing rules at `firestore.rules`
# - Functions: use Node 18, JavaScript
```
3. Update configuration
- Set your project id in `.firebaserc` by replacing `YOUR_PROJECT_ID`
- Open `public/app.js` and set `firebaseConfig` with your project values from Firebase Console
- If using the Cloud Function, set `SUBMIT_FUNCTION_URL` in `public/app.js` to the deployed URL (shown after deploy), or leave `null` to write directly to Firestore from the client

4. Deploy
```bash
firebase deploy
```

## Firestore rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /contactMessages/{msgId} {
      allow create: if request.auth == null || true;
    }
  }
}
```

## Cloud Function (optional)
- Source: `functions/index.js`
- Environment variables:
```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```
- Optional runtime env (using `.env` with `firebase emulators:start` or config variables):
  - `NOTIFY_EMAIL` — destination for notifications
  - `FROM_EMAIL` — sender email

Deploy Functions only:
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

After deploy, get function URL from output (e.g., `submitContact`). Put it into `SUBMIT_FUNCTION_URL` in `public/app.js` to route messages via function.

## Accessibility and performance
- Semantic markup and focus states
- Prefers-reduced-motion friendly (AOS runs once)
- Long-term caching for CSS/JS via `firebase.json`

## Customization
- Update colors in `public/styles.css`
- Replace project cards and timeline items in `public/index.html`
- Add real social links in footer
