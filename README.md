# Juniper Market

A polished sample e-commerce storefront built with Next.js, TypeScript, and Stripe Checkout.

## Included

- Responsive home, shop, product-card, about, and contact experiences
- Product search and category filtering
- Persistent shopping cart (browser local storage)
- Login and sign-up UI
- Contact and newsletter forms with validation
- Test checkout: a usable demo checkout by default, or real Stripe Checkout once configured

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Enable Stripe test payments

1. Copy `.env.example` to `.env.local`.
2. Create a Stripe account and get a **test mode** secret key from its developer dashboard.
3. Set `STRIPE_SECRET_KEY` in `.env.local` and set `NEXT_PUBLIC_SITE_URL` to the public app URL (or `http://localhost:3000` locally).
4. Restart the development server. Checkout will now redirect to Stripe’s hosted secure test checkout. Use Stripe’s test card `4242 4242 4242 4242` with any future date and CVC.

Without a Stripe key, checkout intentionally opens an in-app demo form so the sample remains fully explorable.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Keep the detected Next.js settings.
4. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL` in **Project Settings → Environment Variables**.
5. Deploy, then set `NEXT_PUBLIC_SITE_URL` to the deployed `https://...vercel.app` URL and redeploy once.

Vercel’s free Hobby tier is suitable for a lightweight sample. Stripe test mode is free; accepting live payments requires a Stripe account and incurs Stripe’s normal payment processing fees.

## Production notes

This sample deliberately uses a small static product catalogue and browser-only cart to stay lightweight. For a live store, add a database and authentication provider (for example, Supabase), validate prices from a server-side product database before creating a Stripe session, and replace the external placeholder images with owned assets.
