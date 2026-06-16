"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { ChevronRight } from "lucide-react";

const CATEGORIES_DATA = [
  {
    id: "topwear",
    label: "Topwear",
    subCategories: ["T-Shirts", "Shirts", "Jackets", "Sweatshirts"],
  },
  {
    id: "bottomwear",
    label: "Bottomwear",
    subCategories: ["Jeans", "Trousers", "Joggers", "Shorts"],
  },
  {
    id: "activewear",
    label: "Activewear",
    subCategories: ["Track Pants", "Gym T-Shirts", "Shorts"],
  },
  {
    id: "footwear",
    label: "Footwear",
    subCategories: ["Sneakers", "Formal Shoes", "Sandals"],
  }
];

export default function CategoriesPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES_DATA[0].id);
  const router = useRouter();
  const setSearchCategory = useCartStore((state) => state.setSearchCategory);

  const handleSubCategoryClick = (subCategory: string) => {
    setSearchCategory(subCategory);
    router.push("/");
  };

  const activeData = CATEGORIES_DATA.find((c) => c.id === activeCategory);

  return (
    <div className="flex flex-col h-full bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center shadow-sm sticky top-0 bg-white z-10">
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest">Categories</h1>
      </div>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-60px-80px)]">
        {/* Left Sidebar */}
        <div className="w-[30%] bg-gray-50 border-r border-gray-200 overflow-y-auto">
          {CATEGORIES_DATA.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full text-left py-5 px-3 text-xs font-bold uppercase tracking-widest transition-colors border-l-4 ${
                activeCategory === cat.id
                  ? "bg-white border-pink-500 text-pink-600 shadow-sm"
                  : "border-transparent text-gray-500 hover:bg-gray-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="w-[70%] bg-white p-4 overflow-y-auto">
          <h2 className="text-xs font-black text-gray-900 mb-6 uppercase tracking-widest border-b border-gray-100 pb-2">{activeData?.label}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {activeData?.subCategories.map((sub, idx) => (
              <button
                key={idx}
                onClick={() => handleSubCategoryClick(sub)}
                className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center gap-3 border border-gray-100 hover:border-pink-500 hover:shadow-md transition-all group"
              >
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-1 group-hover:bg-pink-50 transition-colors">
                  {/* Placeholder for actual images */}
                  <span className="text-[10px] font-black text-gray-300 group-hover:text-pink-400">IMG</span>
                </div>
                <span className="text-[10px] font-bold text-gray-700 text-center uppercase tracking-wider group-hover:text-pink-600">
                  {sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
