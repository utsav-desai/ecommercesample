import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getProductById, Product } from "@/lib/products";

type RequestItem = { id: string | number; quantity: number };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: RequestItem[] };
    const items = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    }

    // Verify each item against the trusted catalog
    const verifiedItems: Array<{ product: Product; quantity: number }> = [];

    for (const item of items) {
      const product = getProductById(item.id);
      if (!product) {
        return NextResponse.json(
          { error: `Invalid product in bag (ID: ${item.id}).` },
          { status: 400 }
        );
      }

      const quantity = Math.floor(Number(item.quantity));
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for ${product.name}.` },
          { status: 400 }
        );
      }

      verifiedItems.push({ product, quantity });
    }

    // Securely calculate total in Rupees on server
    const totalRupees = verifiedItems.reduce(
      (sum, { product, quantity }) => sum + product.price * quantity,
      0
    );
    const amountInPaise = Math.round(totalRupees * 100);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({
        mode: "demo",
        amount: totalRupees,
        amountInPaise,
        currency: "INR",
        itemsCount: verifiedItems.reduce((acc, i) => acc + i.quantity, 0),
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `juniper_${Date.now()}`,
      notes: {
        items: verifiedItems
          .map(({ product, quantity }) => `${quantity} × ${product.name}`)
          .join(", "),
      },
    });

    return NextResponse.json({
      mode: "razorpay",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the order." },
      { status: 500 }
    );
  }
}

