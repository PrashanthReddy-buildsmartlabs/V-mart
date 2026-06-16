"use client";

import { useState } from "react";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Topwear",
    price: "",
    mrp: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [stock, setStock] = useState({
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0
  });

  const handleStockChange = (size: string, value: string) => {
    const num = parseInt(value) || 0;
    setStock(prev => ({ ...prev, [size]: num }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Please select a product image");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Image to Cloudinary
      toast.loading("Uploading image...", { id: "upload" });
      
      const uploadData = new FormData();
      uploadData.append('file', imageFile);
      uploadData.append('upload_preset', 'vmart_unsigned');

      const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dd8ohehau/image/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const uploadResult = await uploadRes.json();
      const secureUrl = uploadResult.secure_url;
      
      toast.dismiss("upload");

      // 2. Save Product to Firestore
      const newProduct = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        price: parseFloat(formData.price),
        mrp: formData.mrp ? parseFloat(formData.mrp) : parseFloat(formData.price),
        description: formData.description,
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Default"],
        images: [secureUrl],
        stock: stock
      };

      await addDoc(collection(db, "products"), newProduct);
      
      toast.success("Product created successfully!");
      router.push("/admin/inventory");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product.");
      toast.dismiss("upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/inventory" className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-white shadow-sm border border-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-900" />
        </Link>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Add New Product</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Product Title</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 font-medium" 
                placeholder="e.g. Oversized Heavyweight T-Shirt" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Brand Name</label>
              <input 
                type="text" 
                required
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 font-medium" 
                placeholder="e.g. V-MART Studio" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 font-medium bg-white"
              >
                <option>Topwear</option>
                <option>Bottomwear</option>
                <option>Outerwear</option>
                <option>Accessories</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Selling Price (₹)</label>
              <input 
                type="number" 
                required
                min="0"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 font-medium" 
                placeholder="e.g. 1499" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-900 uppercase tracking-widest">MRP (₹)</label>
              <input 
                type="number" 
                min="0"
                value={formData.mrp}
                onChange={e => setFormData({...formData, mrp: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 font-medium" 
                placeholder="e.g. 2999" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Primary Image</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 font-medium file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-black file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200" 
                />
              </div>
              {previewUrl && (
                <div className="w-16 h-16 rounded overflow-hidden border border-gray-200 shrink-0 bg-gray-50">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 font-medium" 
              placeholder="Product details..." 
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <label className="text-xs font-black text-gray-900 uppercase tracking-widest block">Inventory Allocator</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                <div key={size} className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 text-center">{size}</div>
                  <input 
                    type="number" 
                    min="0"
                    value={stock[size as keyof typeof stock]}
                    onChange={(e) => handleStockChange(size, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-gray-900 font-black" 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="bg-black hover:bg-gray-900 text-white px-8 py-3 rounded font-black text-xs uppercase tracking-widest transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
