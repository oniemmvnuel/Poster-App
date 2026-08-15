# AI Poster Generator — Deploy Guide

This is your full app: the poster maker frontend + a secure backend that
holds your Gemini API key privately (never exposed to visitors).

## Deploy it live in ~10 minutes

### 1. Put this project on GitHub
- Go to github.com, sign in (create a free account if needed)
- Create a new repository (e.g. "poster-app")
- Upload all files from this folder into it
  (on mobile: GitHub's website lets you upload files directly — no
  command line needed)

### 2. Connect it to Vercel
- Go to vercel.com, sign in with your GitHub account
- Click "Add New Project"
- Select the repository you just created
- Click "Deploy" — it will build automatically using the settings
  already in this project (no configuration needed)

### 3. Add your API key (critical step)
- In your Vercel project, go to **Settings → Environment Variables**
- Add a new variable:
  - Name: `GEMINI_API_KEY`
  - Value: (paste the key you got from aistudio.google.com)
- Save, then go to the **Deployments** tab and redeploy so the key
  takes effect

### 4. You're live
Vercel gives you a free link like `poster-app-yourname.vercel.app` —
that's a real, working website anyone can visit.

## Notes on the free tier

The 3-free-generations counter currently uses the visitor's browser
storage. This is fine for a first version, but it resets if someone
clears their browser data or uses a different device/browser — so a
determined person could get more free generations than intended.
This is a normal MVP tradeoff. If it becomes a real problem once
you have real users, the fix is tracking usage server-side (e.g. by
device fingerprint or requiring sign-in), which is a good next
upgrade once the basic version is working and you have some traction.

## Adding real payments (Stripe)

The paywall buttons are currently visual only — they don't charge
anyone yet. Once you're ready to actually take payments, let me know
and we'll wire up Stripe Checkout, which handles the payment form
and card processing for you (no need to store card details yourself).

## Costs to expect

- Vercel hosting: free at this scale
- Gemini API: roughly $0.13–0.30 per poster generated (only charged
  for actual generations, nothing upfront)
- Domain name (optional): ~$10-15/year if you want a custom URL
  instead of the free vercel.app one
