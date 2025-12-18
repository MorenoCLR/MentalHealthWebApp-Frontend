"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { logout } from "@/app/settings/actions"
import { 
  Home, BookOpen, Smile, Target, FileText, Leaf, 
  Activity, BarChart3, Settings, Menu, X, LogOut,
  ChevronLeft, ChevronRight
} from "lucide-react"

type NavItem = {
  name: string
  path: string
  icon: React.ElementType
}

const mainNavItems: NavItem[] = [
  { name: "Journal", path: "/journal", icon: BookOpen },
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "Settings", path: "/settings", icon: Settings },
]

const secondaryNavItems: NavItem[] = [
  { name: "Mood Check", path: "/mood", icon: Smile },
  { name: "Relaxation", path: "/relaxation", icon: Leaf },
  { name: "Physical Health", path: "/physical-health", icon: Activity },
  { name: "Articles", path: "/articles", icon: FileText },
  { name: "Goals", path: "/goals", icon: Target },
  { name: "Visualization", path: "/visualization", icon: BarChart3 },
]

type NavbarProps = {
  className?: string
}

export default function Navbar({ className = "" }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return
    await logout()
    router.replace("/login")
  }

  const renderNavItems = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.path || pathname?.startsWith(item.path + "/")
        
        return (
          <button
            key={item.path}
            onClick={() => {
              router.push(item.path)
              setShowMobileMenu(false)
            }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
              isActive
                ? "bg-white/20 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            } ${!isExpanded && "md:justify-center"}`}
            title={!isExpanded ? item.name : undefined}
          >
            <Icon size={20} className="flex-shrink-0" />
            {/* Show text only on mobile or if expanded on desktop */}
            <span className={`font-medium text-sm whitespace-nowrap ${!isExpanded ? "md:hidden" : ""}`}>
              {item.name}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-[#6E8450] transition-all duration-300 z-50 hidden md:flex flex-col ${
          isExpanded ? "w-64" : "w-20"
        } ${className}`}
      >
        {/* Header */}
        <div className={`p-4 flex items-center border-b border-white/10 ${isExpanded ? "justify-between" : "justify-center"}`}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xl">🙂</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Mental Health</p>
                  <p className="text-white/70 text-xs">Wellness App</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {renderNavItems(mainNavItems)}
          
          <div className="my-2 border-t border-white/10" />
          
          {renderNavItems(secondaryNavItems)}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-white/70 hover:bg-white/10 hover:text-white transition-all ${!isExpanded && "justify-center"}`}
            title={!isExpanded ? "Logout" : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isExpanded && (
              <span className="font-medium text-sm">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="fixed top-4 left-4 z-50 md:hidden rounded-full bg-[#6E8450] p-3 text-white shadow-lg"
      >
        {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-[#6E8450] transition-transform duration-300 z-50 md:hidden flex flex-col ${
          showMobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl">🙂</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Mental Health</p>
            <p className="text-white/70 text-xs">Wellness App</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {/* Reuse the helper but force expanded look for mobile (text always visible) */}
          <div className="space-y-1">
            {[...mainNavItems, ...secondaryNavItems].map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path || pathname?.startsWith(item.path + "/")
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path)
                    setShowMobileMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="font-medium text-sm">{item.name}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}
