"use client";

import { ArrowLeft, Bell, Package, Tag, Clock } from "lucide-react";
import Link from "next/link";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Order Shipped!",
    message: "📦 Your order #ORD-8821 has been shipped and is on its way.",
    time: "2 hours ago",
    read: false,
    icon: Package,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 2,
    title: "New Arrival: Summer Denim",
    message: "🔥 The new Summer Denim Collection is live. Shop now before it sells out!",
    time: "5 hours ago",
    read: false,
    icon: Tag,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: 3,
    title: "Flash Sale Alert",
    message: "⚡ Get flat 50% off on premium jackets for the next 24 hours.",
    time: "1 day ago",
    read: true,
    icon: Clock,
    color: "bg-yellow-100 text-yellow-600",
  }
];

export default function NotificationsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 h-14 flex items-center border-b border-gray-100 sticky top-0 z-10 gap-4">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest flex-1">Notifications</h1>
      </div>

      <div className="flex flex-col">
        {NOTIFICATIONS.map((notification) => {
          const Icon = notification.icon;
          return (
            <div 
              key={notification.id} 
              className={`p-4 border-b border-gray-100 flex gap-4 items-start ${notification.read ? 'bg-white' : 'bg-pink-50/30'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm ${notification.read ? 'font-bold text-gray-700' : 'font-black text-gray-900'}`}>
                  {notification.title}
                </h3>
                <p className={`text-xs mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-800'}`}>
                  {notification.message}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">
                  {notification.time}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
