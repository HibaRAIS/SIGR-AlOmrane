// components/dashboard/layout/SidebarResponsable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  Boxes,
  FileText,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Layers,
  Users,
  Landmark,
  LogOut,
  MapPin,
  FileCheck,
  Bell,
  ScrollText,
  Sparkles,
  User,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';

const menuCategories = [
  { label: 'Dashboard', items: [
    { name: 'Tableau de bord', href: '/dashboard/responsable', icon: LayoutDashboard }
  ] },
  { label: 'Catalogue & Stock', items: [
    { name: 'Catalogue', href: '/dashboard/responsable/catalogue', icon: Package },
    { name: 'Catégories', href: '/dashboard/responsable/categories', icon: Layers },
    { name: 'Alertes stock', href: '/dashboard/responsable/alertes', icon: AlertTriangle },
  ]},
  { label: 'Sorties', items: [
    { name: 'Sorties & Livraisons', href: '/dashboard/responsable/sorties', icon: Boxes },
  ]},
  { label: 'Approvisionnement', items: [
    { name: 'Référentiel Fournisseurs', href: '/dashboard/responsable/fournisseurs', icon: Users },
    { name: 'Réceptions', href: '/dashboard/responsable/receptions', icon: ClipboardList },
    { name: 'Gestion TVA', href: '/dashboard/responsable/tva', icon: DollarSign },
    { name: 'Achats (MP/BC)', href: '/dashboard/responsable/achats', icon: ShoppingCart },
  ]},
  { label: 'Analyse', items: [
    { name: 'Journal des mouvements', href: '/dashboard/responsable/journal', icon: ScrollText },
    { name: 'Statistiques & Bilan', href: '/dashboard/responsable/statistiques', icon: BarChart3 },
  ]},
  { label: 'Système', items: [
    { name: 'Assistant AI', href: '/dashboard/responsable/assistant', icon: Sparkles },
    { name: 'Notifications', href: '/dashboard/responsable/notifications', icon: Bell },
    { name: 'Profil', href: '/dashboard/employe/profil', icon: User },
  ] },
];

export default function SidebarResponsable({ className }: { className?: string }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirmLogout = async () => {
    setDialogOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 bg-[#1D6F42] text-white flex flex-col", className)}>
        {/* En-tête avec logo */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="relative h-10 w-10 bg-white rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src="/images/alomrane-logo.png"
              alt="Al Omrane Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">AL OMRANE</h1>
            <p className="text-sm text-white/70">SIGR - Responsable logistique</p>
          </div>
        </div>

        {/* Navigation avec scrollbar invisible */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {menuCategories.map((cat, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-4">{cat.label}</h3>
              <div className="space-y-1">
                {cat.items.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors',
                      pathname === item.href ? 'bg-white text-[#1D6F42]' : 'hover:bg-white/10'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Styles globaux pour masquer la scrollbar */}
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Opera */
        }
      `}</style>

      <LogoutConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}