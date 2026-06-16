"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Bell, Heart, X, Clock, ArrowRight, Settings } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducts() {
      const snap = await getDocs(collection(db, "products"));
      const p: any[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() }));
      setAllProducts(p);
    }
    loadProducts();
  }, []);

  const recentSearches = ["Zara shirts", "Denim jackets", "White sneakers", "Summer dresses"];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      const results = allProducts.filter(p => 
        (p.name && p.name.toLowerCase().includes(query.toLowerCase())) || 
        (p.brand && p.brand.toLowerCase().includes(query.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex flex-col">
          {/* Top Header Row */}
          <div className="flex h-14 items-center justify-between px-4 gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Link href={isAdminRoute ? '/admin' : '/'} className="font-serif text-xl tracking-widest uppercase font-bold text-black flex-shrink-0">
                V-MART
              </Link>
            </div>
            
            <div className="flex items-center gap-4 text-gray-700">
              <Link href={isAdminRoute ? '/admin/search' : '/search'} className="hover:text-black">
                <Search className="w-5 h-5" />
              </Link>
              <Link href={isAdminRoute ? '/admin/notifications' : '/notifications'} className="hover:text-black relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </Link>
              {isAdminRoute ? (
                <Link href="/admin/settings" className="hover:text-black">
                  <Settings className="w-5 h-5" />
                </Link>
              ) : (
                <Link href="/wishlist" className="hover:text-black">
                  <Heart className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
      </header>

      {/* Full-Screen Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex h-16 items-center px-4 border-b border-gray-100 gap-3">
            <button onClick={() => setIsSearchOpen(false)} className="text-gray-600">
              <X className="w-6 h-6" />
            </button>
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <input 
                type="text" 
                placeholder="Search for products, brands..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
                className="w-full h-full py-2 bg-transparent outline-none text-base placeholder-gray-400"
              />
            </form>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {searchQuery.trim() ? (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Search Results</h3>
                {searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/product/${product.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 py-2 border-b border-gray-100 group"
                    >
                      <div className="w-12 h-16 bg-gray-100 rounded relative overflow-hidden flex-shrink-0">
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">{product.brand}</h4>
                        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{product.name}</p>
                        <p className="text-xs font-bold mt-1">₹{product.price}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-pink-600" />
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-500 font-bold">No products found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Recent Searches</h3>
                <div className="space-y-4">
                  {recentSearches.map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setSearchQuery(item);
                        handleSearchChange({ target: { value: item } } as any);
                      }}
                      className="flex items-center gap-3 w-full text-left text-gray-800"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{item}</span>
                    </button>
                  ))}
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-8 mb-4">Trending Now</h3>
                <div className="flex flex-wrap gap-2">
                  {["Oversized T-Shirts", "Cargo Pants", "Running Shoes", "Sunglasses"].map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setSearchQuery(item);
                        handleSearchChange({ target: { value: item } } as any);
                      }}
                      className="px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-700 bg-gray-50 hover:border-black transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
