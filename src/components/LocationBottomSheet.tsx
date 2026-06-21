"use client";

import { X, MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { calculateDistance } from "@/lib/geolocation";
import { toast } from "sonner";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface LocationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCheck: (pincode?: string) => void;
  onDetectLocation: (address: any) => void;
}

export function LocationBottomSheet({ isOpen, onClose, onCheck, onDetectLocation }: LocationBottomSheetProps) {
  const [pincode, setPincode] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const { savedAddresses, setUserLocation, setDeliveryLocation, setDeliveryDetails, saveGuestAddress, setSaveGuestAddress, user, addAddress, setActiveDeliveryAddress, setAuth } = useCartStore();

  if (!isOpen) return null;

  const handleDetectClick = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          const building = data.address?.building || data.address?.suburb || data.address?.neighbourhood || "";
          const street = data.address?.road || data.address?.street || "";
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || "";
          const state = data.address?.state || "";
          const detectedPincode = data.address?.postcode || "";

          const streetPart = [building, street].filter(Boolean).join(", ");
          const formattedAddress = `${streetPart ? streetPart + ', ' : ''}${city} - ${detectedPincode}`;

          const deterministicId = "detected-" + detectedPincode;

          const newAddress = {
            id: deterministicId,
            title: "Current Location",
            addressLine: `${streetPart ? streetPart + ', ' : ''}${city} - ${detectedPincode}`,
            city: city,
            state: state,
            pincode: detectedPincode,
            lat: Number(latitude) || 0,
            lon: Number(longitude) || 0
          };

          setActiveDeliveryAddress(newAddress);

          const currentUser = auth.currentUser;
          
          if (saveGuestAddress && currentUser) {
            try {
              const userRef = doc(db, 'users', currentUser.uid);
              const userDoc = await getDoc(userRef);
              const existingDbAddresses = userDoc.exists() ? (userDoc.data().addresses || []) : [];
              
              // Check if this pincode is already saved
              const isDuplicate = existingDbAddresses.some((addr: any) => addr.id === newAddress.id);
              
              if (!isDuplicate) {
                const updatedAddresses = [...existingDbAddresses, newAddress];
                await updateDoc(userRef, { addresses: updatedAddresses });
                toast.success("Address saved successfully!");
              } else {
                toast.success("Address selected!");
              }
              
              // Always set the active address for the checkout session
              useCartStore.getState().setActiveDeliveryAddress(newAddress);
            } catch (error: any) {
              console.error("Firebase Write Error:", error);
              toast.error(`Permission Error: ${error.message}`);
            }
          }

          onDetectLocation(newAddress);
          onClose();
        } catch (error) {
          console.error(error);
          toast.error("Failed to detect address");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        toast.error("Unable to retrieve your location");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSavedAddressClick = (address: any) => {
    const storeLat = parseFloat(process.env.NEXT_PUBLIC_STORE_LAT || "17.3850");
    const storeLon = parseFloat(process.env.NEXT_PUBLIC_STORE_LON || "78.4867");

    const distance = calculateDistance(address.lat, address.lon, storeLat, storeLon);
    const outOfZone = distance > 5;
    const fee = outOfZone ? 0 : Math.round(distance * 15);

    setActiveDeliveryAddress(address);
    setUserLocation(address.lat, address.lon);
    setDeliveryLocation(`${address.title} - ${address.pincode}`);
    setDeliveryDetails(fee, outOfZone);

    if (outOfZone) {
      toast.error(`Address is out of delivery zone (${distance.toFixed(1)} km)`);
    } else {
      toast.success(`Delivery available to ${address.title} (Fee: ₹${fee})`);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100] transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-2xl z-[101] animate-in slide-in-from-bottom-full duration-300 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">Check Delivery</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto pb-8">
          <div className="flex border border-gray-300 rounded overflow-hidden mb-6 focus-within:border-black transition-colors">
            <input 
              type="text" 
              placeholder="Enter Pincode" 
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="flex-1 px-4 py-3 outline-none text-sm font-medium"
            />
            <button 
              onClick={() => {
                if (pincode) {
                  onCheck(pincode);
                  onClose();
                }
              }} 
              className="px-4 text-sm font-bold text-pink-600 uppercase bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              Check
            </button>
          </div>

          <label className="flex items-center gap-2 mb-6 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded group-hover:border-pink-500 transition-colors">
              <input 
                type="checkbox" 
                className="opacity-0 absolute inset-0 cursor-pointer"
                checked={saveGuestAddress}
                onChange={(e) => setSaveGuestAddress(e.target.checked)}
              />
              {saveGuestAddress && <div className="w-2.5 h-2.5 bg-pink-500 rounded-sm"></div>}
            </div>
            <span className="text-sm font-medium text-gray-600">Save this address for future orders</span>
          </label>

          <div className="space-y-4">
            <button 
              onClick={handleDetectClick}
              disabled={isDetecting}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors rounded-lg text-left border border-gray-200 disabled:opacity-50"
            >
              <Navigation className="w-5 h-5 text-pink-500" />
              <span className="text-sm font-bold text-pink-600">
                {isDetecting ? "Detecting location..." : "Detect my current location"}
              </span>
            </button>
            
            {savedAddresses.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Saved Addresses</h3>
                <div className="space-y-2">
                  {savedAddresses.map((addr: any) => (
                    <button 
                      key={addr.id}
                      onClick={() => handleSavedAddressClick(addr)}
                      className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors rounded-lg border border-gray-100 text-left"
                    >
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-sm font-bold text-gray-900 block">{addr.title}</span>
                        <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">{addr.addressLine}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 block">Pincode: {addr.pincode}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
