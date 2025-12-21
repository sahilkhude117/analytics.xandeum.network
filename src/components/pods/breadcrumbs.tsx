import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export function Breadcrumbs() {
  return (
    <nav className="mb-6 flex items-center gap-2 text-sm text-[#9CA3AF]">
      <Link
        href="/"
        className="flex items-center gap-1 transition-colors hover:text-[#E5E7EB]"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link
        href="/pods"
        className="transition-colors hover:text-[#E5E7EB]"
      >
        Pods
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-[#E5E7EB]">Pod Details</span>
    </nav>
  );
}
