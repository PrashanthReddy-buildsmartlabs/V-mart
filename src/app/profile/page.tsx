"use client";

import { useCartStore } from "@/store/cartStore";
import { useState, useEffect } from "react";
import { User, Package, HelpCircle, Heart, ChevronRight, Settings, CreditCard, Gift, ShieldAlert, Plus, Star, MapPin, Edit2, Check, X } from "lucide-react";
import { LoginBottomSheet } from "@/components/LoginBottomSheet";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProfilePage() {
  const { isAuthenticated, isAuthLoading, user, logout } = useCartStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Kill the session on Firebase's servers
      await signOut(auth);
      
      // 2. Wipe the local Zustand state completely
      useCartStore.setState({ user: null, uid: null, isAuthenticated: false, isAuthLoading: false });
      
      // 3. Force redirect to the home page so they don't linger on a protected route
      router.push('/');
      
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSaveName = async () => {
    if (!editNameValue.trim() || !user?.uid) {
      setIsEditingName(false);
      return;
    }
    
    setIsSavingName(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: editNameValue,
        name: editNameValue
      });
      
      const currentState = useCartStore.getState();
      useCartStore.setState({
        user: { ...currentState.user, displayName: editNameValue, name: editNameValue } as any
      });
      
      toast.success("Name updated");
      setIsEditingName(false);
    } catch (error) {
      console.error("Error saving name:", error);
      toast.error("Failed to update name");
    } finally {
      setIsSavingName(false);
    }
  };

  if (isAuthLoading || !isMounted) {
    return (
      <div className="flex flex-col h-full bg-gray-50 min-h-screen pb-20 animate-pulse">
        <div className="bg-gray-900 pt-12 pb-24 px-4 relative"></div>
        <div className="px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full border-4 border-white -mt-16 mb-4"></div>
            <div className="w-48 h-6 bg-gray-200 rounded mb-2"></div>
            <div className="w-32 h-4 bg-gray-200 rounded mb-6"></div>
            <div className="w-full h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full bg-gray-50 min-h-screen pb-20">
        {/* Pre-login Header */}
        <div className="bg-gray-900 pt-12 pb-24 px-4 relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm -mt-16 mb-4">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Welcome to V-MART</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">Log in to track orders, save wishlist & more</p>
            
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full bg-pink-500 text-white py-4 rounded font-black text-sm uppercase tracking-widest shadow-md hover:bg-pink-600 transition active:scale-[0.98]"
            >
              Log In / Sign Up
            </button>
          </div>
        </div>

        {/* Links List */}
        <div className="mt-6 bg-white border-y border-gray-200">
          <button className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50">
            <div className="flex items-center gap-4">
              <Package className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-bold text-gray-900">Orders</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <Link href="/help" className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50">
            <div className="flex items-center gap-4">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-bold text-gray-900">Help Center</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-4">
              <Heart className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-bold text-gray-900">Wishlist</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-8 px-4 flex flex-col items-center gap-4 mb-8">
          <div className="flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span className="cursor-pointer hover:text-black">FAQs</span>
            <span className="cursor-pointer hover:text-black">About Us</span>
            <span className="cursor-pointer hover:text-black">Terms of Use</span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">App Version 1.0.0</p>
        </div>

        <LoginBottomSheet isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen pb-24">
      {/* Post-login Header */}
      <div className="bg-white px-4 pt-10 pb-6 shadow-sm flex justify-between items-start">
        <div className="w-full">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full max-w-sm">
              <input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="flex-1 border-b-2 border-pink-500 py-1 px-0 text-xl font-black text-gray-900 outline-none bg-transparent"
                placeholder="Full Name"
                autoFocus
              />
              <button 
                onClick={handleSaveName}
                disabled={isSavingName}
                className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition"
              >
                {isSavingName ? <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div> : <Check className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsEditingName(false)}
                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900 tracking-wide truncate max-w-[200px]">
                {user?.displayName ? user.displayName.split(" ")[0] + " !" : "Welcome !"}
              </h1>
              <button 
                onClick={() => {
                  setEditNameValue(user?.displayName || user?.name || "");
                  setIsEditingName(true);
                }}
                className="text-gray-400 hover:text-pink-600 transition p-1"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">
            {user?.phoneNumber || user?.email || user?.phone || "No contact info"}
          </p>
        </div>
      </div>

      {/* List Menu */}
      <div className="mt-2 bg-white border-y border-gray-200 shadow-sm">
        <Link href="/profile/info" className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-bold text-gray-900">User Info</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        
        <Link href="/profile/orders" className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <Package className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-bold text-gray-900">Orders</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link href="/profile/addresses" className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <MapPin className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-bold text-gray-900">Saved Addresses</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link href="/help" className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <HelpCircle className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-bold text-gray-900">Help Center</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Logout Action */}
      <div className="mt-8 px-4">
        <button 
          onClick={handleLogout}
          className="w-full border-2 border-gray-300 text-gray-500 font-black py-4 rounded text-sm uppercase tracking-widest hover:border-black hover:text-black transition-colors"
        >
          Log Out
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
