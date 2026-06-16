"use client";

import { useCartStore } from "@/store/cartStore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function UserInfoPage() {
  const { user } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <Link href="/profile" className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-wide">User Info</h1>
      </div>

      <div className="p-4 mt-2">
        <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Name</h3>
            <p className="text-sm font-bold text-gray-900">{user?.displayName || "Not provided"}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Phone Number</h3>
            <p className="text-sm font-bold text-gray-900">{user?.phoneNumber || "Not provided"}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</h3>
            <p className="text-sm font-bold text-gray-900">{user?.email || "Not provided"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
