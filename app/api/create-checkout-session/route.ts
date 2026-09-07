import Stripe from "stripe";
import { NextResponse } from "next/server";

type CartItem = { name: string; price: number; quantity: number; image: string };

export async function POST(request: Request) {
  const { items } = (await request.json()) as { items: CartItem[] };
  if (!items?.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  // A functional local fallback keeps the sample usable before Stripe credentials are added.
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ mode: "demo" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(item.price * 100),
        product_data: { name: item.name, images: [item.image] },
      },
    })),
    success_url: `${origin}/?payment=success`,
    cancel_url: `${origin}/?payment=cancelled`,
  });
  return NextResponse.json({ mode: "stripe", url: session.url });
}
