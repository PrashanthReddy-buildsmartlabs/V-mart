import { Search } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="px-4 py-4 space-y-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="w-1/3 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Search Bar Skeleton */}
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-gray-100 rounded animate-pulse" />
          <div className="w-12 h-12 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Categories Skeleton */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-20 h-8 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
