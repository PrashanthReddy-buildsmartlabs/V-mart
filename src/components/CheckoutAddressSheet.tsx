"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore, Address } from "@/store/cartStore";

interface CheckoutAddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (address: Address) => void;
}

export function CheckoutAddressSheet({ isOpen, onClose, onComplete }: CheckoutAddressSheetProps) {
  const user = useCartStore((state) => state.user);
  const addAddress = useCartStore((state) => state.addAddress);

  const [formData, setFormData] = useState({
    title: "Home",
    name: user?.displayName || user?.name || "",
    phone: user?.phoneNumber || user?.phone || "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [saveToProfile, setSaveToProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.street || !formData.city || !formData.state || !formData.pincode) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    const newAddressObject: Address = {
      id: "addr-" + Date.now(),
      title: formData.title,
      name: formData.name,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      addressLine: `${formData.street}, ${formData.city}, ${formData.state}`,
      pincode: formData.pincode,
      // For demo, just reuse a fixed or random lat/lon
      lat: 17.3850 + Math.random() * 0.05,
      lon: 78.4867 + Math.random() * 0.05,
    };

    try {
      if (saveToProfile && user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          addresses: arrayUnion(newAddressObject),
        });
        addAddress(newAddressObject);
        toast.success("Address saved to profile");
      }

      onComplete(newAddressObject);
      onClose();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] transition-opacity flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">Delivery Address</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Save As (e.g., Home, Work)</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors"
              placeholder="Home"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                placeholder="10-digit number"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Street / House No</label>
            <textarea
              required
              rows={2}
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
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
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-gray-300 rounded px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">State</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full border border-gray-300 rounded px-4 py-3 text-sm focus:border-black outline-none transition-colors"
              placeholder="500001"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="saveToProfile"
              checked={saveToProfile}
              onChange={(e) => setSaveToProfile(e.target.checked)}
              className="w-4 h-4 accent-pink-500"
            />
            <label htmlFor="saveToProfile" className="text-sm text-gray-700 cursor-pointer">
              Save this address for future orders
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-black text-sm uppercase tracking-widest py-4 rounded shadow-md hover:bg-gray-900 transition-colors mt-6 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Deliver Here"}
          </button>
        </form>
      </div>
    </div>
  );
}
