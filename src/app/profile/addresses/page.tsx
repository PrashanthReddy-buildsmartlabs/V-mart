"use client";

import { ChevronLeft, MapPin, Plus, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CheckoutAddressModal } from "@/components/CheckoutAddressModal";

export default function AddressesPage() {
  const { user } = useCartStore();
  const addresses = user?.addresses || [];
  const [isAdding, setIsAdding] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
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

  const handleDelete = async (addressToDelete: any) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedAddresses = addresses.filter(
        (addr: any) => addr.id !== addressToDelete.id
      );
      await updateDoc(userRef, { addresses: updatedAddresses });
      toast.success("Address deleted");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
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
                    onClick={() => handleDelete(addr)}
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

      <CheckoutAddressModal 
        isOpen={isAdding}
        onClose={() => setIsAdding(false)} 
        onContinue={() => setIsAdding(false)}
      />

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
