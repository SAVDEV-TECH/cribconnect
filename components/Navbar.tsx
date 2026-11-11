"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Smartphone, UserCheck } from "lucide-react";
import {
  getSavedMobileUser,
  syncOrRestoreSession,
  clearMobileSession,
} from "@/lib/client-auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const cached = getSavedMobileUser();
    if (cached) {
      setCurrentUser(cached);
    }
    syncOrRestoreSession()
      .then((user) => {
        setCurrentUser(user || null);
      })
      .catch(() => {});

    const handleAuthChange = (e: any) => {
      setCurrentUser(e?.detail?.user ?? getSavedMobileUser());
    };
    window.addEventListener("cribconnect:auth-changed", handleAuthChange);
    return () => window.removeEventListener("cribconnect:auth-changed", handleAuthChange);
  }, [pathname]);

  const handleLogout = async () => {
    clearMobileSession();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
    router.refresh();
  };

  const navLinks = [
    { name: "Browse", href: "/listings" },
    { name: "Post a Request", href: "/requests" },
    { name: "Agents", href: "/agents" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              CribConnect <span className="text-emerald-600 font-normal text-xs">· UNIPORT</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive(link.href)
                    ? "text-emerald-700 bg-emerald-50 font-medium"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Founder Admin
                </Link>
                <Link
                  href="/agent/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/agent/profile"
                  className="flex items-center gap-2 px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-gray-800 max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("cribconnect:open-install"))}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Install CribConnect Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Get App</span>
            </button>

            <Link
              href="/list-property"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              List Property
            </Link>
          </div>

          {/* Mobile Right Actions */}
          <div className="flex md:hidden items-center gap-1.5">
            {currentUser ? (
              <Link
                href="/agent/profile"
                className="px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-semibold flex items-center gap-1 max-w-[115px]"
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Profile</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-bold"
              >
                Sign In
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("cribconnect:open-install"))}
              className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>App</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(link.href)
                  ? "text-emerald-700 bg-emerald-50 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            {currentUser ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50"
                >
                  Founder Admin Portal
                </Link>
                <Link
                  href="/agent/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <Link
                  href="/agent/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/list-property"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium text-center"
            >
              List a Property
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
