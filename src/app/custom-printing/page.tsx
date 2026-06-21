"use client";

import Link from "next/link";
import { ChevronLeft, Sparkles, Shirt, Coffee, Type } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

const PRODUCT_TYPES = [
  { 
    id: "tshirt", 
    name: "T-Shirt", 
    icon: Shirt,
    // A flat white t-shirt image that works well with mix-blend-multiply
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: "mug", 
    name: "Classic Mug", 
    icon: Coffee,
    // A blank white mug
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800"
  }
];

const COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#2d2d2d" },
  { name: "Gray", value: "#9ca3af" },
  { name: "Navy", value: "#1e3a8a" },
];

export default function CustomPrintingPage() {
  const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [customText, setCustomText] = useState("");
  const { addItem } = useCartStore();
  const router = useRouter();

  const handleAddToCart = () => {
    if (!customText.trim()) {
      toast.error("Please add some custom text for your design.");
      return;
    }

    addItem({
      productId: `prod-custom-${productType.id}`,
      name: `Custom ${productType.name} - "${customText}"`,
      price: 999,
      image: productType.image,
      size: "Free Size",
      color: selectedColor.name,
    });

    toast.success("Custom design added to bag!");
    router.push("/cart");
  };

  // The overlay color determines how the base image is tinted.
  // White means no tint.
  const isWhite = selectedColor.name === "White";

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 shadow-sm z-10">
        <Link href="/" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest">Design Lab</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-200 flex items-center justify-center overflow-hidden p-6">
          <div className="relative w-full max-w-sm aspect-square bg-white shadow-lg rounded-xl overflow-hidden">
            {/* Base Image */}
            <Image 
              src={productType.image} 
              alt={productType.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
            
            {/* Color Overlay */}
            {!isWhite && (
              <div 
                className="absolute inset-0 mix-blend-multiply opacity-80"
                style={{ backgroundColor: selectedColor.value }}
              />
            )}

            {/* Custom Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
              <p 
                className="text-4xl font-black uppercase text-center leading-tight break-words w-full mix-blend-difference"
                style={{ 
                  color: isWhite ? '#000000' : '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  marginTop: productType.id === 'tshirt' ? '-20%' : '0' // Adjust position for t-shirts
                }}
              >
                {customText}
              </p>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white w-full md:w-96 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col overflow-y-auto z-20">
          <div className="p-6 space-y-8 flex-1">
            
            {/* Product Type Selection */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">1. Select Base Product</h3>
              <div className="grid grid-cols-2 gap-3">
                {PRODUCT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setProductType(type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      productType.id === type.id 
                        ? 'border-black bg-gray-50 text-black' 
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <type.icon className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase tracking-wide">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">2. Choose Color</h3>
              <div className="flex gap-4">
                {COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`relative w-12 h-12 rounded-full border-2 transition-transform ${
                      selectedColor.name === color.name ? 'scale-110 border-black' : 'border-transparent shadow-sm hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name}`}
                  >
                    {color.name === "White" && <div className="absolute inset-0 rounded-full border border-gray-200" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">3. Add Custom Text</h3>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  maxLength={20}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter text (max 20 chars)"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded text-sm font-bold focus:outline-none focus:border-black transition-colors uppercase"
                />
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-gray-100 bg-white pb-safe">
            <button
              onClick={handleAddToCart}
              className="w-full bg-pink-500 text-white py-4 rounded font-black text-sm uppercase tracking-widest shadow-md hover:bg-pink-600 transition-colors active:scale-[0.98]"
            >
              Save Design & Add to Bag (₹999)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
