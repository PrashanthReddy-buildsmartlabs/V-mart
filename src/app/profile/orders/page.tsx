"use client";

import { ChevronLeft, Package } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrderCard from "@/components/OrderCard";

export default function OrdersPage() {
  const { isAuthenticated, uid, isAuthLoading } = useCartStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!uid || !isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const ordersRef = collection(db, "orders");
        const q = query(
          ordersRef, 
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedOrders: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() });
        });
        
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [uid, isAuthenticated]);

  if (isAuthLoading || loading) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    ); 
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">Please Log In</h2>
        <p className="text-sm text-gray-500 mt-2 text-center">Log in to view your order history.</p>
        <Link href="/profile" className="mt-8 bg-pink-500 text-white px-8 py-3 rounded font-black text-sm uppercase tracking-widest hover:bg-pink-600 transition shadow-md">
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <Link href="/profile" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
            <Package className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide mb-2">No Orders Yet</h2>
          <p className="text-sm font-medium text-gray-500 mb-8">You haven't placed any orders yet.</p>
          <Link href="/" className="bg-black text-white px-8 py-4 rounded font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition shadow-md w-full max-w-xs">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

