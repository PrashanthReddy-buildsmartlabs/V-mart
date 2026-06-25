import React, { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const CheckoutAddressModal = ({ isOpen, onClose, onContinue }: { isOpen: boolean, onClose: () => void, onContinue: (address: any) => void }) => {
  const currentUser = useCartStore((state) => state.user);
  
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [flat, setFlat] = useState("");
  const [area, setArea] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addressType, setAddressType] = useState("Home");
  const [lat, setLat] = useState<number>(0);
  const [lon, setLon] = useState<number>(0);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || currentUser.name || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser]);

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLon(longitude);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data && data.address) {
            if (data.address.postcode) setPincode(data.address.postcode);
            if (data.address.city || data.address.state_district || data.address.county) {
              setCity(data.address.city || data.address.state_district || data.address.county || "");
            }
            if (data.address.state) setState(data.address.state);
            if (data.address.suburb || data.address.neighbourhood || data.address.road) {
              setArea(data.address.suburb || data.address.neighbourhood || data.address.road || "");
            }
            toast.success("Location detected successfully");
          }
        } catch (error) {
          console.error("Failed to reverse geocode");
          toast.error("Could not fetch address from coordinates");
        }
        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        if (error.code === 1) toast.error("Please allow location access");
        else toast.error("Could not fetch location");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(code);
    
    if (code.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
        const data = await res.json();
        if (data[0].Status === "Success") {
          setCity(data[0].PostOffice[0].District);
          setState(data[0].PostOffice[0].State);
        } else {
          toast.error("Invalid Pincode");
        }
      } catch (error) {
        console.error("Failed to fetch pincode details");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || !city || !state || !flat || !area || !name || !email) {
      toast.error("Please fill all fields");
      return;
    }
    
    if (lat === 0 || lon === 0) {
      toast.error("Please use GPS location to capture exact coordinates for delivery calculation.");
      return;
    }
    
    const newAddressObject = {
      id: "addr-" + Date.now(),
      title: addressType,
      name,
      email,
      pincode,
      city,
      state,
      addressLine: `${flat}, ${area}`,
      street: area,
      flat: flat,
      lat,
      lon
    };

    if (currentUser && currentUser.uid) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        
        // 1. Check and update root profile name if changed
        if (name !== (currentUser.displayName || currentUser.name)) {
          await updateDoc(userRef, {
            name: name,
            displayName: name
          });
        }
        
        // 2. Fetch current addresses, remove duplicates, and append new
        const userSnap = await getDoc(userRef);
        let updatedAddresses = userSnap.data()?.addresses || [];
        
        updatedAddresses = updatedAddresses.filter((addr: any) => !(addr.pincode === pincode && addr.flat === flat));
        updatedAddresses.push(newAddressObject);
        
        await updateDoc(userRef, { addresses: updatedAddresses });

      } catch (error) {
        console.error("Error saving address logic:", error);
      }
    }

    onContinue(newAddressObject);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex flex-col justify-end">
      <div className="bg-white w-full rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="font-bold text-lg">Add Delivery Address</h2>
          <button onClick={onClose} className="p-2"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Pincode</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={pincode} onChange={handlePincodeChange} placeholder="6-digit Pincode" className="flex-1 border-b-2 border-gray-200 focus:border-pink-500 pb-2 outline-none transition-colors" required />
              <button 
                type="button" 
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="flex items-center gap-1 text-xs font-bold text-pink-600 bg-pink-50 px-3 py-2 rounded disabled:opacity-50"
              >
                <MapPin className="w-3 h-3" />
                {isDetecting ? "Detecting..." : "Use GPS"}
              </button>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase">City</label>
              <input type="text" value={city} disabled className="w-full mt-1 border-b-2 border-gray-200 pb-2 outline-none bg-gray-50 text-gray-500" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase">State</label>
              <input type="text" value={state} disabled className="w-full mt-1 border-b-2 border-gray-200 pb-2 outline-none bg-gray-50 text-gray-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Flat / House No.</label>
            <input type="text" value={flat} onChange={e => setFlat(e.target.value)} placeholder="House, Flat, Block No." className="w-full mt-1 border-b-2 border-gray-200 focus:border-pink-500 pb-2 outline-none" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Area / Street</label>
            <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="Area, Street, Sector, Village" className="w-full mt-1 border-b-2 border-gray-200 focus:border-pink-500 pb-2 outline-none" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full mt-1 border-b-2 border-gray-200 focus:border-pink-500 pb-2 outline-none" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="w-full mt-1 border-b-2 border-gray-200 focus:border-pink-500 pb-2 outline-none" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Address Type</label>
            <div className="flex gap-4 mt-2">
              <button type="button" onClick={() => setAddressType("Home")} className={`flex-1 py-2 rounded-full text-sm font-bold border ${addressType === "Home" ? "border-pink-500 bg-pink-50 text-pink-600" : "border-gray-200 text-gray-600"}`}>Home</button>
              <button type="button" onClick={() => setAddressType("Work")} className={`flex-1 py-2 rounded-full text-sm font-bold border ${addressType === "Work" ? "border-pink-500 bg-pink-50 text-pink-600" : "border-gray-200 text-gray-600"}`}>Work</button>
            </div>
          </div>
          <button type="submit" className="w-full bg-pink-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg hover:bg-pink-700 transition-colors">
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

