"use client";

import { ChevronLeft, Package, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";

const STATUSES = ["Pending", "Packed", "Out for Delivery", "Delivered"];

const OrderTimeline = ({ currentStatus }: { currentStatus: string }) => {
  const currentIndex = STATUSES.indexOf(currentStatus) !== -1 ? STATUSES.indexOf(currentStatus) : 0;
  
  return (
    <div className="mt-4 px-2 pb-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 h-1 bg-gray-200 top-2 -z-10 rounded"></div>
        <div 
          className="absolute left-0 h-1 bg-pink-500 top-2 -z-10 rounded transition-all duration-500" 
          style={{ width: `${(currentIndex / (STATUSES.length - 1)) * 100}%` }}
        ></div>
        
        {STATUSES.map((status, index) => (
          <div key={status} className="flex flex-col items-center bg-white rounded-full p-0.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${index <= currentIndex ? 'bg-pink-500 text-white shadow-sm' : 'bg-gray-200 text-transparent'}`}>
              ✓
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {STATUSES.map((status, index) => (
          <div key={status} className={`text-[8px] font-bold uppercase tracking-wider text-center w-14 ${index <= currentIndex ? 'text-pink-600' : 'text-gray-400'}`}>
            {status}
          </div>
        ))}
      </div>
    </div>
  );
};

const MOCK_ORDERS = [
  {
    id: "ODR1234567890",
    date: "12 Oct 2026",
    total: 3598,
    items: 2,
    status: "Delivered",
    statusColor: "text-green-600",
    statusBg: "bg-green-100 border-green-200",
    image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "ODR0987654321",
    date: "05 Nov 2026",
    total: 1299,
    items: 1,
    status: "In Transit",
    statusColor: "text-orange-600",
    statusBg: "bg-orange-100 border-orange-200",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200"
  }
];

export default function OrdersPage() {
  const { isAuthenticated, uid, isAuthLoading } = useCartStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const previousOrdersRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let unsubscribe: () => void;

    if (!uid || !isAuthenticated) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"), 
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: any[] = [];
      
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;
        const newStatus = data.status;
        
        if (change.type === "modified") {
          const oldStatus = previousOrdersRef.current[id];
          if (oldStatus && oldStatus !== newStatus) {
            toast.success(`Order Status Updated: ${newStatus}`);
          }
        }
        previousOrdersRef.current[id] = newStatus;
      });

      snapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() });
      });
      
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [uid, isAuthenticated]);

  if (isAuthLoading) { 
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>; 
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">Please Log In</h2>
        <p className="text-sm text-gray-500 mt-2 text-center">Log in to view your order history.</p>
        <Link href="/profile" className="mt-8 bg-pink-500 text-white px-8 py-3 rounded font-black text-sm uppercase tracking-widest hover:bg-pink-600 transition">
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

      {loading ? (
        <div className="p-4 space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
            <Package className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-2">No Orders Yet</h2>
          <p className="text-sm font-medium text-gray-500 mb-8 text-center">You haven't placed any orders yet. Start exploring our collection!</p>
          <Link href="/" className="bg-black text-white px-8 py-3 rounded font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition shadow-md">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex gap-4">
                <div className="w-20 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img src={order.items?.[0]?.image || "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?auto=format&fit=crop&q=80&w=200"} alt="Order item" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-black text-gray-900">₹{order.grandTotal || order.total}</div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1 mb-1">
                    {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">ID: {order.id.substring(0, 10).toUpperCase()}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">({order.items?.length || 1} {order.items?.length > 1 ? 'Items' : 'Item'})</p>
                </div>
              </div>
              <OrderTimeline currentStatus={order.status || "Pending"} />
              <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
                <button className="text-xs font-bold text-gray-900 uppercase tracking-widest hover:text-pink-600 transition-colors">View Details</button>
                <button className="text-xs font-black text-pink-600 uppercase tracking-widest bg-white border border-pink-200 px-4 py-2 rounded shadow-sm hover:bg-pink-50 transition-colors">Track</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
