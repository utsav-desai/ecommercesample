import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json() as Record<string, string>;
  if (!process.env.RAZORPAY_KEY_SECRET || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const verified = expected.length === razorpay_signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  return NextResponse.json({ verified }, { status: verified ? 200 : 400 });
}
