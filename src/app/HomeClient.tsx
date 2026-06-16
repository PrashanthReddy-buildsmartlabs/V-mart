"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function HomeClient() {
  const router = useRouter();
  const user = useCartStore((state) => state.user);
  const selectedCategory = useCartStore((state) => state.searchCategory);
  const setSelectedCategory = useCartStore((state) => state.setSearchCategory);
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const wishlistItems = useCartStore((state) => state.wishlistItems);

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, router]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const snap = await getDocs(collection(db, "products"));
        const fetched: any[] = [];
        snap.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
        setProducts(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = [
    { name: "All", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200" },
    { name: "T-Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200" },
    { name: "Shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ce3?auto=format&fit=crop&q=80&w=200" },
    { name: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=200" },
    { name: "Trousers", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=200" },
    { name: "Jackets", image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=200" },
  ];

  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => p?.category && selectedCategory ? p.category.toLowerCase() === selectedCategory.toLowerCase() : true);

  const handleWishlist = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    const isAdded = toggleWishlist(product.id);
    if (isAdded) {
      toast.success(`${product.brand} added to Wishlist`);
    } else {
      toast.info(`${product.brand} removed from Wishlist`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      {/* Hero Carousel (Static for now) */}
      <div className="w-full h-48 bg-gray-200 relative">
        <Image 
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=800" 
          alt="Sale Banner" 
          fill 
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex flex-col justify-center items-center text-white">
          <h2 className="text-3xl font-bold italic tracking-widest uppercase">End of Season Sale</h2>
          <p className="text-lg font-semibold mt-1">50-80% OFF</p>
        </div>
      </div>

      {/* Category Circles */}
      <div className="bg-white py-4 mb-2">
        <div className="flex overflow-x-auto hide-scrollbar px-4 gap-4">
          {categories.map((cat, idx) => (
            <button 
              key={idx} 
              onClick={() => setSelectedCategory(cat.name)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden relative border-2 ${selectedCategory === cat.name ? 'border-red-500' : 'border-gray-100'}`}>
                <Image src={cat.image} alt={cat.name} fill className="object-cover" />
              </div>
              <span className={`text-xs font-medium ${selectedCategory === cat.name ? 'text-red-500' : 'text-gray-700'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 bg-white min-h-[400px]">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            {selectedCategory === "All" ? "Deals of the Day" : selectedCategory}
          </h2>
          {selectedCategory !== "All" && (
            <button onClick={() => setSelectedCategory("All")} className="text-xs font-bold text-red-500">
              Clear Filter
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-3">
                  <div className="w-3/4 h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-24">
            {filteredProducts.map((product) => {
              const isWished = wishlistItems.includes(product.id);
              return (
                <Link key={product.id} href={`/product/${product.id}`} className="group flex flex-col relative">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md mb-2 bg-gray-100">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 300px"
                    />
                    {/* Rating Badge */}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold text-gray-800">
                      {product.rating} <span className="text-green-600">★</span> | {product.reviews > 1000 ? (product.reviews / 1000).toFixed(1) + 'k' : product.reviews}
                    </div>
                  </div>

                  {/* Wishlist Button Overlay */}
                  <button 
                    onClick={(e) => handleWishlist(e, product)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 z-10"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </button>

                  <div className="flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{product.brand}</h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{product.name}</p>
                    <div className="flex items-center flex-wrap gap-1 mt-1.5">
                      <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
                      <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                      <span className="text-[10px] font-bold text-orange-500">({product.discount}% OFF)</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
