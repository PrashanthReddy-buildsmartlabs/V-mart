"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, Heart, Search, ShoppingBag, Share2, Star, Truck, ShieldCheck, Undo2, LayoutGrid, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { calculateDistance, calculateDeliveryFee } from "@/lib/geolocation";
import { toast } from "sonner";
import Link from "next/link";
import { LocationBottomSheet } from "@/components/LocationBottomSheet";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect } from "react";

const FallbackImage = ({ src, alt, fill, priority, sizes, className }: any) => {
  const [imgSrc, setImgSrc] = useState(src || '/placeholder.jpg');
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setImgSrc('/placeholder.jpg')}
    />
  );
};

export function ProductClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const wishlistItems = useCartStore((state) => state.wishlistItems);
  const cartItems = useCartStore((state) => state.items);
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isOutOfZone, setIsOutOfZone] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [sizeChartUnit, setSizeChartUnit] = useState<"in" | "cm">("in");

  const [activeImage, setActiveImage] = useState(0);

  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [deliveryMsg, setDeliveryMsg] = useState("Enter Pincode / Check Location");
  const [fee, setFee] = useState<number | null>(null);

  // Dynamic out-of-stock sizes logic
  const [outOfStockSizes, setOutOfStockSizes] = useState<string[]>([]);
  
  useEffect(() => {
    async function loadProductAndStock() {
      try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const data = { id: productSnap.id, ...productSnap.data() } as any;
          setProduct(data);
          
          if (data.stock) {
            const outOfStock: string[] = [];
            Object.keys(data.stock).forEach((size) => {
              if (data.stock[size] <= 0) {
                outOfStock.push(size);
              }
            });
            setOutOfStockSizes(outOfStock);
          }

          // Load Similar Products
          const q = query(
            collection(db, "products"),
            where("category", "==", data.category),
            limit(5)
          );
          const similarSnap = await getDocs(q);
          const simProds: any[] = [];
          similarSnap.forEach(docSnap => {
            if (docSnap.id !== data.id) {
              simProds.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
          setSimilarProducts(simProds.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProductAndStock();
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen pb-32 animate-pulse">
        <div className="w-full aspect-[3/4] bg-gray-200"></div>
        <div className="p-4 space-y-4">
          <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
          <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
          <div className="w-1/4 h-6 bg-gray-200 rounded mt-2"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Product not found</p>
        <Link href="/" className="mt-4 text-pink-500 font-bold uppercase tracking-widest text-xs hover:underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a colour");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
    });
    toast.success("Item added to your bag");
  };

  const handleWishlistClick = () => {
    const isAdded = toggleWishlist(product.id);
    if (isAdded) {
      toast.success("Added to Wishlist");
    } else {
      toast.info("Removed from Wishlist");
    }
  };

  const isWished = product ? wishlistItems.includes(product.id) : false;

  const handleCheckLocation = () => {
    setLocationStatus("loading");
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setDeliveryMsg("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const storeLat = parseFloat(process.env.NEXT_PUBLIC_STORE_LAT || "17.3850");
        const storeLon = parseFloat(process.env.NEXT_PUBLIC_STORE_LON || "78.4867");
        const distance = calculateDistance(latitude, longitude, storeLat, storeLon);
        const { fee, valid } = calculateDeliveryFee(distance);
        
        if (!valid) {
          setLocationStatus("error");
          setDeliveryMsg(`Out of Delivery Zone (${distance.toFixed(1)} km away). Max 5km.`);
          setFee(null);
          toast.error("Out of Delivery Zone");
        } else {
          setLocationStatus("success");
          setFee(fee);
          setDeliveryMsg(`Delivery available to your location (${distance.toFixed(1)} km).`);
        }
      },
      () => {
        setLocationStatus("error");
        setDeliveryMsg("Unable to retrieve location.");
      }
    );
  };

  const handlePincodeCheck = (pincode?: string) => {
    if (pincode) {
      // Mock pincode logic
      setLocationStatus("success");
      setFee(50);
      setDeliveryMsg(`Delivery available to ${pincode}`);
    }
  };

  // Delivery date formatting
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryDateString = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen pb-10 font-sans text-gray-900">
      {/* Header */}
      <div className="fixed top-0 z-50 w-full max-w-md bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100 transition-all">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-bold uppercase tracking-wider text-sm truncate max-w-[150px]">{product.brand}</span>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-700" />
          <Link href="/cart" className="relative">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-pink-500 text-white text-[9px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-14">
        {/* Full-Width Image Gallery */}
        <div className="relative w-full aspect-[4/5] bg-gray-100">
          <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar" onScroll={(e) => {
            const scrollLeft = e.currentTarget.scrollLeft;
            const width = e.currentTarget.clientWidth;
            setActiveImage(Math.round(scrollLeft / width));
          }}>
            {product.images.map((img: string, i: number) => (
              <div key={i} className="w-full h-full flex-shrink-0 snap-center relative">
                <FallbackImage src={img || "/placeholder.jpg"} alt={`${product.name} ${i}`} fill className="object-cover" priority={i===0} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              </div>
            ))}
          </div>

          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 uppercase tracking-widest flex items-center shadow-sm">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" /> Bestseller
          </div>

          {/* Floating Actions */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-10">
            <button className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-gray-700 active:scale-95 transition-transform">
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-gray-700 active:scale-95 transition-transform">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={handleWishlistClick} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-gray-700 active:scale-95 transition-transform">
              <Heart className={`w-5 h-5 transition-colors ${isWished ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
            {product.images.map((_: any, i: number) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${activeImage === i ? "w-4 bg-gray-900" : "w-1.5 bg-gray-400/60"}`} />
            ))}
          </div>
        </div>

        {/* Product Header & Pricing */}
        <div className="bg-white px-4 pt-4 pb-5 shadow-sm">
          <h1 className="text-xl font-black uppercase tracking-wide text-gray-900">{product.brand}</h1>
          <p className="text-sm text-gray-500 mt-1">{product.name}</p>
          
          <div className="mt-4 flex items-center flex-wrap gap-2">
            <span className="text-2xl font-black text-gray-900">₹{product.price}</span>
            <span className="text-sm text-gray-400 line-through">MRP ₹{product.originalPrice}</span>
            <span className="text-sm font-black text-orange-500 ml-1">{product.discount}% OFF</span>
          </div>
          <p className="text-xs text-green-700 font-bold mt-1">Inclusive of all taxes</p>

          {/* Offers Banner */}
          <div className="mt-4 bg-green-50 border border-green-200 rounded p-3 flex items-start gap-2">
            <span className="text-green-700 mt-0.5">🏷️</span>
            <div>
              <p className="text-sm font-bold text-green-800">Bank Offer</p>
              <p className="text-xs text-green-700 mt-0.5">Extra ₹164 Off on ICICI Bank Credit Cards. <span className="underline font-bold cursor-pointer">T&C</span></p>
            </div>
          </div>
        </div>

        {/* Variant Selectors */}
        <div className="bg-white px-4 py-5 mt-2 shadow-sm">
          {/* Colors */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Colour: <span className="text-gray-500 font-medium capitalize">{selectedColor || "Select Colour"}</span></h3>
            <div className="flex gap-3">
              {product.colors.map((color: string, idx: number) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`relative w-14 h-16 rounded overflow-hidden transition-all ${
                    selectedColor === color ? "ring-2 ring-offset-2 ring-pink-500" : "border border-gray-200"
                  }`}
                >
                  <Image src={(product.images && product.images[idx % product.images.length]) || "/placeholder.jpg"} alt={color} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-gray-900 tracking-widest uppercase">Select Size</span>
              <button onClick={() => setIsSizeChartOpen(true)} className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Size Chart &gt;</button>
            </div>
            <div className="flex gap-3 flex-wrap mb-6">
              {product.sizes.map((size: string) => {
                const isOutOfStock = outOfStockSizes.includes(size);
                return (
                  <button
                    key={size}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm transition-all
                      ${isOutOfStock ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed" : 
                        selectedSize === size
                          ? "bg-black text-white border-black ring-2 ring-black ring-offset-2"
                          : "bg-white text-gray-800 border border-gray-300 hover:border-black"}
                    `}
                  >
                    {size}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-[1.5px] bg-gray-300 transform -rotate-45" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Inline Add to Bag Button */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-pink-500 text-white py-4 rounded font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-pink-600 transition active:scale-[0.98] shadow-md shadow-pink-200"
            >
              <ShoppingBag className="w-5 h-5" /> Add to Bag
            </button>
          </div>
        </div>

        {/* Delivery & Services */}
        <div className="bg-white px-4 py-5 mt-2 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
            Check Delivery & Services
          </h3>
          
          <button 
            onClick={() => setIsLocationSheetOpen(true)}
            className="w-full flex justify-between items-center border border-gray-300 rounded p-4 mb-4 hover:border-black transition-colors text-left"
          >
            <span className={`text-sm ${locationStatus === "idle" || locationStatus === "loading" ? "text-gray-500" : "text-gray-900 font-bold"}`}>
              {locationStatus === "loading" ? "Locating..." : deliveryMsg}
            </span>
            <span className="text-pink-600 font-bold text-xs uppercase tracking-wide">Change</span>
          </button>

          {locationStatus !== "idle" && locationStatus !== "loading" && fee !== null && (
            <div className="mb-4 text-sm font-bold text-gray-900">
              Delivery Fee: ₹{fee}
            </div>
          )}

          <div className="space-y-4 text-sm font-medium text-gray-700">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>Standard Delivery by <span className="font-bold text-gray-900">{deliveryDateString}</span></div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>Pay on Delivery is available</div>
            </div>
            <div className="flex items-start gap-3">
              <Undo2 className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>Hassle free 7 days Return & Exchange</div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white px-4 py-5 mt-2 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Product Details</h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{product.description}</p>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Material</p>
              <p className="text-sm font-medium text-gray-900 mt-1">100% Premium Cotton</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Fit</p>
              <p className="text-sm font-medium text-gray-900 mt-1">Regular Fit</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Care Instructions</p>
              <p className="text-sm font-medium text-gray-900 mt-1">Machine Wash Cold</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Origin</p>
              <p className="text-sm font-medium text-gray-900 mt-1">Made in India</p>
            </div>
          </div>
        </div>

        {/* Ratings & Reviews */}
        <div className="bg-white px-4 py-5 mt-2 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wide">Ratings & Reviews</h3>
            <span className="text-xs font-bold text-pink-600 uppercase cursor-pointer">View All</span>
          </div>
          
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center justify-center gap-1.5 text-2xl font-black text-gray-900">
              {product.rating} <Star className="w-6 h-6 fill-green-600 text-green-600" />
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">{product.reviews} Verified Buyers</p>
            </div>
          </div>

          <p className="text-sm font-bold text-gray-900 mb-3">Customer Photos (12)</p>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative w-20 h-24 rounded overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                <Image src={`https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=200`} alt="Review" fill className="object-cover opacity-80" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              </div>
            ))}
          </div>
        </div>

        {/* Similar Products Carousel */}
        <div className="bg-white px-4 py-5 mt-2 mb-2 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Similar Products</h3>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {similarProducts.map((simProduct) => (
              <Link key={simProduct.id} href={`/product/${simProduct.id}`} className="w-[140px] flex-shrink-0 flex flex-col group">
                <div className="relative aspect-[3/4] overflow-hidden rounded bg-gray-100 mb-2">
                  <Image src={(simProduct.images && simProduct.images[0]) || "/placeholder.jpg"} alt={simProduct.name} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 truncate">{simProduct.brand}</h4>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-bold text-gray-900">₹{simProduct.price}</span>
                  <span className="text-[10px] text-gray-400 line-through">₹{simProduct.originalPrice}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <LocationBottomSheet 
        isOpen={isLocationSheetOpen} 
        onClose={() => setIsLocationSheetOpen(false)} 
        onCheck={handlePincodeCheck}
        onDetectLocation={handleCheckLocation}
      />

      {/* Size Chart Bottom Sheet */}
      {isSizeChartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100] transition-opacity" onClick={() => setIsSizeChartOpen(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-2xl z-[101] animate-in slide-in-from-bottom-full duration-300 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Size Chart</h3>
              <button onClick={() => setIsSizeChartOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded mb-6 w-full max-w-[200px] mx-auto">
              <button 
                onClick={() => setSizeChartUnit("in")}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded ${sizeChartUnit === "in" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                Inches
              </button>
              <button 
                onClick={() => setSizeChartUnit("cm")}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded ${sizeChartUnit === "cm" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                CM
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left font-black text-gray-900 uppercase tracking-wider">Size</th>
                    <th className="py-3 px-4 text-left font-black text-gray-900 uppercase tracking-wider">Chest</th>
                    <th className="py-3 px-4 text-left font-black text-gray-900 uppercase tracking-wider">Length</th>
                    <th className="py-3 px-4 text-left font-black text-gray-900 uppercase tracking-wider">Shoulder</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChartUnit === "in" ? (
                    <>
                      <tr className="border-b border-gray-100 bg-white"><td className="py-3 px-4 font-bold text-gray-900">S</td><td className="py-3 px-4 text-gray-600 font-medium">38</td><td className="py-3 px-4 text-gray-600 font-medium">27</td><td className="py-3 px-4 text-gray-600 font-medium">16</td></tr>
                      <tr className="border-b border-gray-100 bg-gray-50"><td className="py-3 px-4 font-bold text-gray-900">M</td><td className="py-3 px-4 text-gray-600 font-medium">40</td><td className="py-3 px-4 text-gray-600 font-medium">28</td><td className="py-3 px-4 text-gray-600 font-medium">17</td></tr>
                      <tr className="border-b border-gray-100 bg-white"><td className="py-3 px-4 font-bold text-gray-900">L</td><td className="py-3 px-4 text-gray-600 font-medium">42</td><td className="py-3 px-4 text-gray-600 font-medium">29</td><td className="py-3 px-4 text-gray-600 font-medium">18</td></tr>
                      <tr className="bg-gray-50"><td className="py-3 px-4 font-bold text-gray-900">XL</td><td className="py-3 px-4 text-gray-600 font-medium">44</td><td className="py-3 px-4 text-gray-600 font-medium">30</td><td className="py-3 px-4 text-gray-600 font-medium">19</td></tr>
                    </>
                  ) : (
                    <>
                      <tr className="border-b border-gray-100 bg-white"><td className="py-3 px-4 font-bold text-gray-900">S</td><td className="py-3 px-4 text-gray-600 font-medium">96.5</td><td className="py-3 px-4 text-gray-600 font-medium">68.5</td><td className="py-3 px-4 text-gray-600 font-medium">40.5</td></tr>
                      <tr className="border-b border-gray-100 bg-gray-50"><td className="py-3 px-4 font-bold text-gray-900">M</td><td className="py-3 px-4 text-gray-600 font-medium">101.5</td><td className="py-3 px-4 text-gray-600 font-medium">71</td><td className="py-3 px-4 text-gray-600 font-medium">43</td></tr>
                      <tr className="border-b border-gray-100 bg-white"><td className="py-3 px-4 font-bold text-gray-900">L</td><td className="py-3 px-4 text-gray-600 font-medium">106.5</td><td className="py-3 px-4 text-gray-600 font-medium">73.5</td><td className="py-3 px-4 text-gray-600 font-medium">45.5</td></tr>
                      <tr className="bg-gray-50"><td className="py-3 px-4 font-bold text-gray-900">XL</td><td className="py-3 px-4 text-gray-600 font-medium">111.5</td><td className="py-3 px-4 text-gray-600 font-medium">76</td><td className="py-3 px-4 text-gray-600 font-medium">48</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <button 
              onClick={() => setIsSizeChartOpen(false)}
              className="w-full py-4 bg-gray-900 text-white font-black text-sm uppercase tracking-widest rounded shadow-md hover:bg-black transition-colors"
            >
              Close
            </button>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 12px); }
      `}} />
    </div>
  );
}
