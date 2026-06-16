"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IndianRupee, Truck, Activity, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [deliveryOverhead, setDeliveryOverhead] = useState(0);
  const [activeThroughput, setActiveThroughput] = useState(0);

  useEffect(() => {
    // Fetch all users to map profiles
    async function fetchUsers() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const map: Record<string, any> = {};
        usersSnap.forEach(doc => {
          map[doc.id] = doc.data();
        });
        setUsersMap(map);
      } catch (err) {
        console.error("Error fetching users", err);
      }
    }
    fetchUsers();

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: any[] = [];
      let rev = 0;
      let overhead = 0;
      let active = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({ id: doc.id, ...data });
        
        // Compute metrics
        if (data.grandTotal) rev += data.grandTotal;
        else if (data.total) rev += data.total;
        
        if (data.deliveryFee) overhead += data.deliveryFee;
        
        if (data.status === "Pending" || data.status === "Packed" || data.status === "Out for Delivery") {
          active += 1;
        }
      });
      
      setOrders(fetchedOrders);
      setGrossRevenue(rev);
      setDeliveryOverhead(overhead);
      setActiveThroughput(active);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      toast.success(`Order ${orderId.substring(0, 8)} status updated`);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update status");
    }
  };

  const statusOptions = ["Pending", "Packed", "Out for Delivery", "Delivered"];

  if (loading) {
    return <div className="h-64 flex items-center justify-center font-bold text-gray-500 uppercase tracking-widest text-sm">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gross Revenue</p>
            <h3 className="text-2xl font-black text-gray-900">₹{grossRevenue.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Overhead</p>
            <h3 className="text-2xl font-black text-gray-900">₹{deliveryOverhead.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Throughput</p>
            <h3 className="text-2xl font-black text-gray-900">{activeThroughput} <span className="text-sm font-medium text-gray-400 normal-case">orders</span></h3>
          </div>
        </div>
      </div>

      {/* Live Orders Ledger */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">Live Orders Ledger</h2>
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search orders..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 w-48 md:w-64 font-medium" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="p-4 whitespace-nowrap">Order ID & Date</th>
                <th className="p-4 whitespace-nowrap">Customer Profile</th>
                <th className="p-4 whitespace-nowrap">Logistics & Route</th>
                <th className="p-4 whitespace-nowrap">Amount & Method</th>
                <th className="p-4 whitespace-nowrap text-right">State Controller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const user = usersMap[order.userId] || {};
                return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">{order.id.substring(0, 10).toUpperCase()}</p>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                      {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">{user.displayName || "Guest"}</p>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">{user.email || "N/A"}</p>
                    <p className="text-xs font-black text-pink-600 mt-0.5 tracking-wider">{user.phone || "N/A"}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-900">
                      {order.deliveryAddress?.pincode ? `Pincode: ${order.deliveryAddress.pincode}` : "Unknown"}
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                      {order.deliveryAddress?.distance ? `${order.deliveryAddress.distance.toFixed(1)} km away` : "N/A"}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">₹{order.grandTotal || order.total}</p>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-gray-100 border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest text-gray-600">
                      {order.paymentMethod || "N/A"}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <select
                      value={order.status || "Pending"}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`text-[10px] font-black uppercase tracking-widest border rounded px-3 py-2 outline-none cursor-pointer shadow-sm
                        ${order.status === 'Delivered' ? 'bg-green-50 border-green-200 text-green-700' : 
                          order.status === 'Out for Delivery' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          order.status === 'Packed' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                          'bg-orange-50 border-orange-200 text-orange-700'
                        }
                      `}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-white text-gray-900 font-bold">{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )})}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-sm font-black text-gray-400 uppercase tracking-widest">
                    No orders found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
