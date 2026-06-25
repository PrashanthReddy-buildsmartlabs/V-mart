"use client";

import { useEffect, useState, Suspense } from "react";
import { CheckCircle2, ArrowRight, Package } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentId, setPaymentId] = useState<string>("Pending");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

  useEffect(() => {
    const id = searchParams.get("payment_id");
    if (id) {
      setPaymentId(id);
    } else {
      // Fallback for COD or missing payment id
      const randomId = "OD" + Math.floor(1000000000 + Math.random() * 9000000000);
      setPaymentId(randomId);
    }

    const deliveryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    setEstimatedDelivery(
      deliveryDate.toLocaleDateString("en-IN", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    );
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-wide">
          Payment Successful!
        </h1>

        <p className="text-sm text-gray-500 mb-6 font-medium">
          Your order has been placed successfully.
        </p>

        <div className="bg-gray-50 p-6 rounded-lg w-full text-left mb-8 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1 font-semibold">Transaction Reference</p>
          <p className="font-mono text-gray-800 mb-4">{paymentId}</p>

          <p className="text-sm text-gray-500 mb-1 font-semibold">Estimated Delivery</p>
          <p className="font-medium text-green-600">{estimatedDelivery}</p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => router.replace("/profile/orders")}
            className="w-full bg-black text-white py-4 rounded font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-900 transition active:scale-[0.98] shadow-md"
          >
            <Package className="w-4 h-4" /> View My Orders
          </button>

          <button
            onClick={() => router.replace("/")}
            className="w-full bg-pink-50 text-pink-600 py-4 rounded font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-pink-100 transition active:scale-[0.98]"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

