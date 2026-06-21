"use client";

import { useCartStore } from "@/store/cartStore";
import { X, HeartCrack } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, addItem } = useCartStore();
  const [selectedProductForSize, setSelectedProductForSize] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlistProducts() {
      try {
        const snap = await getDocs(collection(db, "products"));
        const fetched: any[] = [];
        snap.forEach(doc => {
          if (wishlistItems.includes(doc.id)) {
            fetched.push({ id: doc.id, ...doc.data() });
          }
        });
        setProducts(fetched);
      } catch (error) {
        console.error("Error fetching wishlist products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWishlistProducts();
  }, [wishlistItems]);

  const wishlistProducts = products;

  const handleMoveToBag = (product: any) => {
    setSelectedProductForSize(product);
  };

  const confirmMoveToBag = (size: string) => {
    if (!selectedProductForSize) return;

    addItem({
      productId: selectedProductForSize.id,
      name: selectedProductForSize.name,
      price: selectedProductForSize.price,
      image: selectedProductForSize.image,
      size: size,
      color: "Default"
    });
    
    removeFromWishlist(selectedProductForSize.id);
    setSelectedProductForSize(null);
    toast.success("Moved to bag successfully!");
  };

  const handleRemove = (productId: string, brand: string) => {
    removeFromWishlist(productId);
    toast.success(`${brand} removed from wishlist`);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 pb-20 px-6">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-gray-100">
          <HeartCrack className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-2">Wishlist is Empty</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Your wishlist is empty. Start adding your favorites!
        </p>
        <Link 
          href="/" 
          className="bg-pink-500 text-white px-8 py-3 rounded font-black text-sm uppercase tracking-widest shadow-md hover:bg-pink-600 transition active:scale-[0.98]"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-4 py-4 border-b border-gray-100 flex items-center shadow-sm sticky top-0 z-20 bg-white">
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest">
          Wishlist <span className="text-gray-400 font-medium text-sm ml-1">({wishlistProducts.length})</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24">
        {loading ? (
          <>
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-3">
                  <div className="w-3/4 h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          wishlistProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col group relative">
              <button 
                onClick={() => handleRemove(product.id, product.brand)}
                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <Link href={`/product/${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-gray-100 block">
                <Image
                  src={product.images && product.images[0] ? product.images[0] : "/placeholder.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>
              
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-gray-900 truncate">{product.brand || "V-MART"}</h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">{product.name}</p>
                
                <div className="mt-2 flex items-center flex-wrap gap-1">
                  <span className="text-sm font-black text-gray-900">₹{product.price}</span>
                  <span className="text-[10px] text-gray-400 line-through">₹{product.mrp || Math.round(product.price * 1.5)}</span>
                </div>
                
                <div className="mt-auto pt-3">
                  <button 
                    onClick={() => handleMoveToBag(product)}
                    className="w-full py-2 bg-gray-50 hover:bg-black hover:text-white text-gray-900 border border-gray-200 hover:border-black rounded text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Move to Bag
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Size Selector Bottom Sheet */}
      {selectedProductForSize && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100] transition-opacity" onClick={() => setSelectedProductForSize(null)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-2xl z-[101] animate-in slide-in-from-bottom-full duration-300 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Select Size</h3>
              <button onClick={() => setSelectedProductForSize(null)} className="p-1 text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-20 relative bg-gray-100 rounded overflow-hidden shadow-sm border border-gray-200">
                <Image src={selectedProductForSize.image || "/placeholder.jpg"} alt="product" fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{selectedProductForSize.name}</p>
                <p className="text-sm font-black text-pink-600 mt-1">₹{selectedProductForSize.price}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4 border-t border-gray-100 pt-6">
              {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                <button
                  key={size}
                  onClick={() => confirmMoveToBag(size)}
                  className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-sm text-gray-700 hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50 transition-all shadow-sm"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
