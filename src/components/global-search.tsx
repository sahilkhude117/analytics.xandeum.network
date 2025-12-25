"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { usePodsList } from "@/hooks/use-pods-list";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = usePodsList({
    search: debouncedSearch,
    pageSize: 10,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedSearch && data?.items.length) {
      setIsOpen(true);
    }
  }, [debouncedSearch, data]);

  const handleResultClick = (pubkey: string) => {
    router.push(`/pods/${pubkey}`);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  const showResults = isOpen && debouncedSearch && (isLoading || data?.items.length);

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" />
        <Input
          type="search"
          placeholder="search by pubkey, ip address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (debouncedSearch && data?.items.length) {
              setIsOpen(true);
            }
          }}
          className="h-11 w-72 border-white/10 bg-white/5 pl-10 pr-10 text-base text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-white/20 focus:bg-white/10"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-[#0A0A0A] shadow-xl z-50">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#60A5FA]" />
            </div>
          ) : data?.items.length ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium uppercase text-[#6B7280]">
                Found {data.pagination.total} result{data.pagination.total !== 1 ? 's' : ''}
              </div>
              {data.items.map((pod) => (
                <button
                  key={pod.pubkey}
                  onClick={() => handleResultClick(pod.pubkey!)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors hover:bg-white/5",
                    "border-b border-white/5 last:border-b-0"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-[#E5E7EB] truncate">
                          {pod.pubkey}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs rounded font-medium",
                            pod.status === "ONLINE" && "bg-green-500/10 text-green-500",
                            pod.status === "DEGRADED" && "bg-yellow-500/10 text-yellow-500",
                            pod.status === "OFFLINE" && "bg-red-500/10 text-red-500"
                          )}
                        >
                          {pod.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#9CA3AF]">
                        <span className="font-mono">{pod.ipAddress}</span>
                        {pod.city && pod.country && (
                          <span>
                            {pod.city}, {pod.country}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-[#6B7280]">
                      <div className="font-semibold text-[#60A5FA]">
                        Score: {pod.healthScore}
                      </div>
                      <div className="mt-0.5">{pod.version}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
