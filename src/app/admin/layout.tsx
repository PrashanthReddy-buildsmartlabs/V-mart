"use client";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthLoading } = useCartStore();

  useEffect(() => {
    if (!isAuthLoading && user?.role !== "admin") {
      toast.error("Access Denied");
      router.replace("/");
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="bg-gray-900 text-white shadow-md">
        <div className="p-4 flex justify-between items-center border-b border-gray-800">
          <h1 className="text-xl font-black tracking-widest uppercase">
            V-Mart <span className="text-pink-500">Admin</span>
          </h1>
          <button 
            onClick={() => router.push("/profile")} 
            className="text-xs uppercase tracking-widest hover:text-pink-400 transition"
          >
            Exit
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex px-4 gap-6 text-sm font-bold uppercase tracking-widest">
          <button 
            onClick={() => router.push("/admin")} 
            className="py-4 text-gray-400 hover:text-white transition-colors focus:text-white focus:border-b-2 focus:border-pink-500"
          >
            Orders
          </button>
          <button 
            onClick={() => router.push("/admin/inventory")} 
            className="py-4 text-gray-400 hover:text-white transition-colors focus:text-white focus:border-b-2 focus:border-pink-500"
          >
            Inventory
          </button>
        </div>
      </div>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
