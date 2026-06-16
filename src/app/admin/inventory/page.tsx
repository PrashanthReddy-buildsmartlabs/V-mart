"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Plus, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const MOCK_PRODUCTS = [
  {
    id: "p1",
    name: "Men Slim Fit Cotton Casual Shirt",
    brand: "HIGHLANDER",
    price: 649,
    originalPrice: 1999,
    discount: 67,
    rating: 4.2,
    reviews: 1450,
    description: "Our signature heavyweight cotton tee. Boxy fit, dropped shoulders, and a tight ribbed collar. Perfect for everyday wear.",
    category: "Shirts",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Navy", "Olive"]
  },
  {
    id: "p2",
    name: "Regular Fit Essential T-Shirt",
    brand: "Roadster",
    price: 399,
    originalPrice: 999,
    discount: 60,
    rating: 4.5,
    reviews: 3200,
    description: "Breathable, premium linen overshirt. Features a clean buttonless placket and oversized patch pockets.",
    category: "T-Shirts",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800"
    ],
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Stone"]
  },
  {
    id: "p3",
    name: "Structured Denim Jacket",
    brand: "Levi's",
    price: 3149,
    originalPrice: 4499,
    discount: 30,
    rating: 4.7,
    reviews: 840,
    description: "Raw selvedge denim jacket with a cropped, modern silhouette. Silver hardware and tonal stitching.",
    category: "Jackets",
    images: [
      "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800"
    ],
    sizes: ["S", "M", "L"],
    colors: ["Raw Indigo", "Washed Black"]
  },
  {
    id: "p4",
    name: "Relaxed Fit Chinos",
    brand: "U.S. Polo Assn.",
    price: 1399,
    originalPrice: 2799,
    discount: 50,
    rating: 4.3,
    reviews: 512,
    description: "Everyday trousers with a slight taper and elasticated side tabs for the perfect fit.",
    category: "Trousers",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800"
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Khaki", "Charcoal"]
  }
];

export default function InventoryDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "products"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts: any[] = [];
      snapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() });
      });
      setProducts(fetchedProducts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast.error("Failed to load inventory");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMigrate = async () => {
    if (!confirm("This will migrate all mock products to Firestore. Proceed?")) return;
    setIsMigrating(true);
    toast.loading("Migrating catalog...");
    
    try {
      // Fetch existing to prevent overwriting
      const existingSnap = await getDocs(collection(db, "products"));
      const existingIds = new Set(existingSnap.docs.map(d => d.id));
      
      let count = 0;
      for (const prod of MOCK_PRODUCTS) {
        if (!existingIds.has(prod.id)) {
          await setDoc(doc(db, "products", prod.id), {
            name: prod.name,
            price: prod.price,
            mrp: prod.price * 1.5, // Just mock an MRP
            brand: prod.brand || "V-MART",
            category: prod.category || "General",
            images: prod.images,
            sizes: prod.sizes,
            colors: prod.colors || ["White", "Black"],
            stock: { S: 5, M: 5, L: 5, XL: 5, XXL: 5 }, // initial stock
            description: "Premium quality product."
          });
          count++;
        }
      }
      toast.dismiss();
      toast.success(`Successfully migrated ${count} new products!`);
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Migration failed");
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center font-bold text-gray-500 uppercase tracking-widest text-sm">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Inventory Management</h2>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            Migrate
          </button>
          
          <Link 
            href="/admin/inventory/new"
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-widest transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search catalog..." className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 font-medium" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="p-4 whitespace-nowrap">Product</th>
                <th className="p-4 whitespace-nowrap">Category / Brand</th>
                <th className="p-4 whitespace-nowrap">Price</th>
                <th className="p-4 whitespace-nowrap text-right">Total Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const totalStock = product.stock ? Object.values(product.stock).reduce((a: any, b: any) => a + b, 0) : 0;
                
                return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 flex items-center gap-4">
                    <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img src={product.images?.[0] || "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?auto=format&fit=crop&q=80&w=200"} alt="product" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{product.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">ID: {product.id.substring(0, 8)}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-bold text-gray-900">{product.category}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{product.brand}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">₹{product.price}</p>
                    {product.mrp && <p className="text-[10px] text-gray-400 font-bold line-through mt-1">₹{product.mrp}</p>}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-xs font-black uppercase tracking-widest
                      ${(totalStock as number) > 10 ? 'bg-green-50 text-green-700 border border-green-200' : 
                        (totalStock as number) > 0 ? 'bg-orange-50 text-orange-700 border border-orange-200' : 
                        'bg-red-50 text-red-700 border border-red-200'}`}
                    >
                      {(totalStock as number) > 0 ? `${totalStock} in stock` : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              )})}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-sm font-black text-gray-400 uppercase tracking-widest">
                    No products found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
