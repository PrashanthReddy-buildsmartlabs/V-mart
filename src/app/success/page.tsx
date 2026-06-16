"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    // Generate a random mock order ID
    const randomId = "OD" + Math.floor(1000000000 + Math.random() * 9000000000);
    setOrderId(randomId);
    
    // Clear the cart on successful load
    clearCart();

    // Hide global bottom nav on this page (similar to PDP)
  }, [clearCart]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-wide">
          Order Placed Successfully!
        </h1>
        
        <p className="text-sm text-gray-500 mb-6">
          Thank you for shopping at V-MART. Your premium fashion is on its way.
        </p>

        <div className="w-full bg-gray-50 rounded-lg p-4 mb-8 border border-gray-100 flex items-center gap-4">
          <Package className="w-6 h-6 text-pink-500" />
          <div className="text-left">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Order ID</p>
            <p className="text-sm font-black text-gray-900">{orderId}</p>
          </div>
        </div>

        <Link 
          href="/"
          className="w-full bg-pink-500 text-white py-4 rounded font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-pink-600 transition active:scale-[0.98] shadow-md shadow-pink-200"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
