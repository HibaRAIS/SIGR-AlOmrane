"use client"
import { CartProvider } from "@/context/CartContext"
import { RequestsProvider } from "@/context/RequestsContext"
import { useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  ClipboardList,
  AlertTriangle,
  History,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Users,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  ArrowUpCircle,
} from "lucide-react"

const NotificationsPopover = dynamic(
  () => import("@/components/dashboard/notifications-popover").then(m => ({ default: m.NotificationsPopover })),
  { ssr: false }
)

const UserMenu = dynamic(
  () => import("@/components/dashboard/user-menu").then(m => ({ default: m.UserMenu })),
  { ssr: false }
)

interface NavItemType {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
}

const navigationEmploye: NavItemType[] = [
  { name: "Tableau de bord",    href: "/dashboard",            icon: LayoutDashboard },
  { name: "Catalogue",          href: "/dashboard/catalogue",  icon: Package },
  { name: "Mon Panier",         href: "/dashboard/panier",     icon: ShoppingCart },
  { name: "Mes Demandes",       href: "/dashboard/demandes",   icon: FileText },
  { name: "Suivi des Demandes", href: "/dashboard/suivi",      icon: ClipboardList },
  { name: "Matériel en Prêt",   href: "/dashboard/prets",      icon: AlertTriangle },
  { name: "Historique",         href: "/dashboard/historique", icon: History },
  { name: "Mon Profil",         href: "/dashboard/profil",     icon: User },
]

const navigationChef: NavItemType[] = [
  { name: "File de validation",   href: "/dashboard/chef/validation",   icon: ClipboardCheck, badge: 5 },
  { name: "Demandes équipe",      href: "/dashboard/chef/demandes",     icon: Users },
  { name: "Statistiques équipe",  href: "/dashboard/chef/statistiques", icon: BarChart3 },
  { name: "Historique décisions", href: "/dashboard/chef/historique",   icon: History },
  { name: "Escalades N+1",        href: "/dashboard/chef/escalades",    icon: ArrowUpCircle },
]

const AL_OMRANE_GREEN = "#004d2c"
const IS_CHEF_DE_SERVICE = true

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItemType
  isActive: boolean
  onClick: () => void
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-white text-[#004d2c] shadow-sm"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <item.icon
          className={cn("w-4 h-4 shrink-0", isActive ? "text-[#004d2c]" : "text-white/50")}
        />
        <span className="flex-1 truncate">{item.name}</span>
        {item.badge && item.badge > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              background: isActive ? "#004d2c" : "rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            {item.badge}
          </span>
        )}
        {isActive && !item.badge && (
          <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
        )}
      </Link>
    </li>
  )
}

// ─── LAYOUT INTERNE ───────────────────────────────────────────────────────────
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chefSectionOpen, setChefSectionOpen] = useState(true)
  const pathname = usePathname()
  const pendingCount = navigationChef.find(i => i.badge)?.badge ?? 0

  return (
    <div className="min-h-screen bg-background">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col",
          "transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: AL_OMRANE_GREEN }}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg p-1 shrink-0">
              <Image
                src="/images/alomrane-logo.png"
                alt="Al Omrane Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">AL OMRANE</h1>
              <p className="text-sm text-white/60">SIGR - Agadir</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div>
            <p
              className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Mon Espace
            </p>
            <ul className="space-y-0.5">
              {navigationEmploye.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={pathname === item.href}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </ul>
          </div>

          {IS_CHEF_DE_SERVICE && (
            <div>
              <div className="mx-2 mb-3 border-t" style={{ borderColor: "rgba(255,255,255,0.10)" }} />
              <button
                onClick={() => setChefSectionOpen(prev => !prev)}
                className="w-full flex items-center gap-2 px-4 mb-1.5"
              >
                <ShieldCheck className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
                <p
                  className="flex-1 text-left text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  Mon Équipe
                </p>
                {pendingCount > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)" }}
                  >
                    {pendingCount} en attente
                  </span>
                )}
                <ChevronDown
                  className={cn("w-3 h-3 shrink-0 transition-transform duration-200", chefSectionOpen ? "rotate-0" : "-rotate-90")}
                  style={{ color: "rgba(255,255,255,0.30)" }}
                />
              </button>
              {chefSectionOpen && (
                <ul className="space-y-0.5">
                  {navigationChef.map((item) => (
                    <NavItem
                      key={item.name}
                      item={item}
                      isActive={pathname === item.href}
                      onClick={() => setSidebarOpen(false)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </nav>

        <div className="px-3 py-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-[#004d2c] shrink-0 bg-white">
              MK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">Mohamed Karimi</p>
              <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                Service Administratif
              </p>
            </div>
            <Link href="/">
              <button className="p-1 transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>
                <LogOut size={13} />
              </button>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-foreground">Portail Employé</h2>
              <p className="text-xs text-muted-foreground">Bienvenue sur le système SIGR</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <UserMenu isChef={IS_CHEF_DE_SERVICE} />
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <RequestsProvider>
        <DashboardLayoutInner>
          {children}
        </DashboardLayoutInner>
      </RequestsProvider>
    </CartProvider>
  )
}