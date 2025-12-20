"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, LucideGithub, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [network, setNetwork] = useState("devnet");

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pods", label: "Pods" },
    { href: "/network", label: "Network" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-8">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
              <span className="text-xl font-bold text-[#E5E7EB]">X</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#E5E7EB]">
              Xandeum Analytics
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-5 py-2 text-base font-medium transition-colors duration-150",
                  pathname === link.href
                    ? "text-[#E5E7EB]"
                    : "text-[#9CA3AF] hover:text-[#E5E7EB]"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5E7EB]" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" />
            <Input
              type="search"
              placeholder="search by Pubkey, Ip address..."
              className="h-11 w-72 border-white/10 bg-white/5 pl-10 text-base text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-white/20 focus:bg-white/10"
            />
          </div>

          {/* GitHub Link */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-24 w-12 text-[#9CA3AF] hover:bg-white/5 hover:text-[#E5E7EB]"
          >
            <a
              href="https://github.com/sahilkhude117/analytics.xandeum.network.git"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <LucideGithub size={36} href="https://github.com/sahilkhude117/analytics.xandeum.network.git"/>
            </a>
          </Button>

          {/* Network Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="h-11 gap-2 bg-[#1E40AF] px-5 text-base font-medium text-white hover:bg-[#1E3A8A]"
              >
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {network === "devnet" ? "Devnet" : "Mainnet"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#0A0A0A] min-w-[200px]">
              <DropdownMenuLabel className="text-[#9CA3AF] text-sm font-medium">
                Choose cluster
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onClick={() => setNetwork("devnet")}
                className="cursor-pointer text-[#E5E7EB] text-base py-3 focus:bg-white/10 focus:text-[#E5E7EB]"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Devnet
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                className="cursor-not-allowed text-[#6B7280] text-base py-3 focus:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4B5563]" />
                  <span>Mainnet</span>
                  <Badge
                    variant="outline"
                    className="ml-auto border-[#4B5563] text-[10px] text-[#6B7280]"
                  >
                    Q2 2025
                  </Badge>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
