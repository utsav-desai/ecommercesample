import Razorpay from "razorpay";
import { NextResponse } from "next/server";

type CartItem = { name: string; price: number; quantity: number };

export async function POST(request: Request) {
  const { items } = (await request.json()) as { items: CartItem[] };
  if (!items?.length) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ mode: "demo" });
  }

  const amount = Math.round(items.reduce((total, item) => total + item.price * item.quantity, 0) * 100);
  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `juniper_${Date.now()}`,
    notes: { items: items.map((item) => `${item.quantity} × ${item.name}`).join(", ") },
  });
  return NextResponse.json({ mode: "razorpay", keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency });
}
