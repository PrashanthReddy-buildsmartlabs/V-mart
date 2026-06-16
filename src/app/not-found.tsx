"use client";

import Link from "next/link";
import { PackageX } from "lucide-react";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const isAdminError = pathname?.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-4 pb-32">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
          <PackageX className="w-12 h-12 text-gray-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-serif tracking-wide uppercase">Not Found</h2>
          <p className="text-base text-gray-500 max-w-[280px] mx-auto">
            We couldn't find the page or product you were looking for.
          </p>
        </div>
        <Link 
          href={isAdminError ? '/admin' : '/'} 
          className="mt-8 bg-black text-white px-8 py-3.5 rounded-md font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors inline-block w-full max-w-[250px]"
        >
          {isAdminError ? "Back to Dashboard" : "Back to Home"}
        </Link>
      </div>
    </div>
  );
}
