"use client";

import { ChevronLeft, MapPin, Plus, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function AddressesPage() {
  const { removeAddress, addAddress, user } = useCartStore();
  const addresses = user?.addresses || [];
  const [isAdding, setIsAdding] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [newAddress, setNewAddress] = useState({
    title: "",
    name: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          const fetchedAddresses = docSnap.exists() ? (docSnap.data().addresses || []) : [];
          
          // 1. Sync the Global Store (so Cart can use it)
          const currentState = useCartStore.getState();
          useCartStore.setState({
            user: { ...currentState.user, addresses: fetchedAddresses, uid: user.uid } as any
          });
          
          // 2. Unlock the UI
          setIsFetching(false);
        });
        
        return () => unsubscribeDoc();
      } else {
        setIsFetching(false);
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.title || !newAddress.street || !newAddress.pincode || !user?.uid) return;

    const newAddressObject = {
      id: "addr-" + Date.now(),
      title: newAddress.title,
      name: newAddress.name,
      street: newAddress.street,
      city: newAddress.city,
      state: newAddress.state,
      addressLine: `${newAddress.street}, ${newAddress.city}, ${newAddress.state}`,
      pincode: newAddress.pincode,
      // For demo, just reuse a fixed or random lat/lon
      lat: 17.3850 + (Math.random() * 0.05),
      lon: 78.4867 + (Math.random() * 0.05),
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        addresses: arrayUnion(newAddressObject) 
      });
      addAddress(newAddressObject);

      setNewAddress({ title: "", name: "", street: "", city: "", state: "", pincode: "" });
      setIsAdding(false);
      toast.success("Address Saved");
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <Link href="/profile" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest">Saved Addresses</h1>
      </div>

      <div className="p-4 space-y-4">
        {isFetching ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2">No Saved Addresses</h3>
            <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
              Add an address to make your checkout experience faster and seamless.
            </p>
          </div>
        ) : (
          addresses.map((addr: any) => (
            <div key={addr.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-pink-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">{addr.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-gray-400 hover:text-gray-900 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeAddress(addr.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 mt-2">{addr.addressLine}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">Pincode: {addr.pincode}</p>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-[100] transition-opacity flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">Add New Address</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-900">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Save As (e.g., Home, Work)</label>
                <input 
                  type="text" 
                  required
                  value={newAddress.title}
                  onChange={(e) => setNewAddress({...newAddress, title: e.target.value})}
                  className="w-full border border-gray-300 rounded px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors"
                  placeholder="Home"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                  className="w-full border border-gray-300 rounded px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Street Address</label>
                <textarea 
                  required
                  rows={2}
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                  className="w-full border border-gray-300 rounded px-4 py-3 text-sm focus:border-black outline-none transition-colors resize-none"
                  placeholder="123, Street Name, Area..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">City</label>
                  <input 
                    type="text" 
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    className="w-full border border-gray-300 rounded px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">State</label>
                  <input 
                    type="text" 
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                    className="w-full border border-gray-300 rounded px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                    placeholder="State"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pincode</label>
                <input 
                  type="text" 
                  required
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                  className="w-full border border-gray-300 rounded px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors"
                  placeholder="500001"
                />
              </div>
              <button type="submit" className="w-full bg-pink-500 text-white font-black text-sm uppercase tracking-widest py-4 rounded shadow-md hover:bg-pink-600 transition-colors mt-6">
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fixed Add Address Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 max-w-md mx-auto">
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full border-2 border-gray-300 text-gray-500 font-black py-4 rounded text-sm uppercase tracking-widest hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      </div>
    </div>
  );
}
