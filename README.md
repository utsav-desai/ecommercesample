# Juniper Market

A sample India-first e-commerce storefront built with Next.js, TypeScript, and Razorpay Standard Checkout.

## Included

- **Dedicated Seller & Store Owner Portal (`/seller`)**:
  - Secure PIN protection (default PIN: `1234`) with instant unlock
  - **Overview & Analytics**: Total revenue, pending order count, active products count, low stock warnings, and recent order stream
  - **Catalog & Inventory Management**: Add new products (with custom or curated image presets), edit pricing, inline stock adjustment (`+`/`−`), filter by stock status (In stock, Low stock, Sold out), and delete items
  - **Order Fulfillment Pipeline**: View customer orders, inspect line items & receipts, advance fulfillment status (`Confirmed` → `Preparing` → `On its way` → `Delivered`), or simulate test orders
  - **Store Branding & Settings**: Customize store name, announcement banner, free shipping threshold, studio details, and security PIN
- Responsive home, shop, product-detail, about, and contact experiences
- Dynamic product search, category filtering, and real-time inventory reflection (sold-out badges)
- Indian-rupee product prices and locally persisted shopping cart
- Razorpay payment flow for UPI, Indian cards, and netbanking with dynamic product catalog verification

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Enable Razorpay test payments

1. Create a Razorpay account and open its **Test Mode** dashboard.
2. Copy `.env.example` to `.env.local`.
3. Generate Test Mode API keys in **Account & Settings → API Keys**.
4. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env.local`.
5. Restart the app. Checkout will open Razorpay’s test checkout, where no real money is deducted.

Never expose `RAZORPAY_KEY_SECRET` in browser code or commit it to Git. Until API keys are set, the app deliberately uses a local demo checkout so the whole sample remains explorable.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository at [Vercel](https://vercel.com/new).
3. Keep the detected Next.js settings and deploy.
4. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` under **Project Settings → Environment Variables** for Production, Preview, and Development.
5. Redeploy after adding the variables.

Vercel’s free Hobby tier is suitable for this lightweight sample. Razorpay test mode is free; live payments require completed Razorpay KYC and incur Razorpay’s standard payment-processing fees.

## Production notes

This sample deliberately uses static product data and a browser-only cart. Before fulfilling real orders, store products and orders in a database, add a Razorpay webhook to record confirmed payments server-side, set clear shipping/returns/privacy policies, and connect real authentication (for example, Supabase).
