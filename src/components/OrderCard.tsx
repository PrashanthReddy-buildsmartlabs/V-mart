"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

export default function OrderCard({ order }: { order: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "packed":
      case "out for delivery":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"; // Pending
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header (Clickable) */}
      <div 
        className="p-5 border-b border-gray-50 flex gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 relative">
          {order.items?.[0]?.image ? (
            <Image 
              src={order.items[0].image} 
              alt="Order item" 
              fill
              className="object-cover" 
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${getStatusColor(order.status || 'Pending')}`}>
              {order.status || "Pending"}
            </span>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} 
            />
          </div>
          
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            }) : "Processing..."}
          </h3>
          
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-black text-gray-900">?{order.grandTotal || order.total || 0}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              ({order.items?.length || 1} {order.items?.length > 1 ? "Items" : "Item"})
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-5 py-3 flex justify-between items-center text-xs">
        <span className="text-gray-400 font-mono">ID: {order.id.substring(0, 10).toUpperCase()}</span>
        <span className="font-bold text-gray-900 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "Hide Details" : "View Details"}
        </span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200 p-5 space-y-4">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Items in this Order</h4>
          <div className="space-y-4">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="flex gap-4">
                <div className="w-16 h-16 bg-white rounded border border-gray-100 relative overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill 
                      className="object-cover" 
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.selectedColor && `Color: ${item.selectedColor} `}
                    {item.selectedSize && `| Size: ${item.selectedSize}`}
                  </p>
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    Qty: {item.quantity} | ?{item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Shipping Address</h4>
            {order.deliveryAddress ? (
              <div className="text-xs text-gray-600 leading-relaxed">
                <p className="font-bold text-gray-900">{order.deliveryAddress.name}</p>
                <p>{order.deliveryAddress.flat}, {order.deliveryAddress.area}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Address details not available.</p>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>?{order.subtotal || order.total || 0}</span>
            </div>
            {order.shippingFee !== undefined && (
              <div className="flex justify-between text-gray-500">
                <span>Shipping Fee</span>
                <span>?{order.shippingFee}</span>
              </div>
            )}
            {order.gst !== undefined && (
              <div className="flex justify-between text-gray-500">
                <span>GST (5%)</span>
                <span>?{order.gst}</span>
              </div>
            )}
            {order.packagingFee !== undefined && (
              <div className="flex justify-between text-gray-500">
                <span>Packaging Fee</span>
                <span>?{order.packagingFee}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
              <span>Total Amount</span>
              <span>?{order.grandTotal || order.total || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

