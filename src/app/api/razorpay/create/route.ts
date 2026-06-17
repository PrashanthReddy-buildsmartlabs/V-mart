import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    // 1. Verify environment variables exist at runtime
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("CRITICAL: Razorpay keys are missing from process.env");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 2. Initialize inside the request (Lazy Initialization)
    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
    });

    // 3. Process the request
    const body = await req.json();
    const { amount, currency = "INR" } = body;

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: "Invalid amount provided" }, { status: 400 });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order, { status: 200 });

  } catch (error: any) {
    console.error("Razorpay Order Creation Failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
