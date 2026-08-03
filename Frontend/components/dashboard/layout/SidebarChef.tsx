'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  ClipboardList,
  AlertTriangle,
  History,
  User,
  ClipboardCheck,
  Users,
  BarChart3,
  LogOut,
  ChevronDown,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { demandeService } from '@/services/demande.service';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';

const commonNav = [
  { name: 'Tableau de bord', href: '/dashboard/employe', icon: LayoutDashboard },
  { name: 'Catalogue', href: '/dashboard/employe/catalogue', icon: Package },
  { name: 'Mon Panier', href: '/dashboard/employe/panier', icon: ShoppingCart },
  { name: 'Mes Demandes', href: '/dashboard/employe/demandes', icon: FileText },
  { name: 'Suivi des Demandes', href: '/dashboard/employe/suivi', icon: ClipboardList },
  { name: 'Matériel en Prêt', href: '/dashboard/employe/prets', icon: AlertTriangle },
  { name: 'Historique', href: '/dashboard/employe/historique', icon: History },
  { name: 'Mon Profil', href: '/dashboard/employe/profil', icon: User },
];

const chefNav = [
  { name: 'Tableau de bord chef', href: '/dashboard/chef', icon: LayoutDashboard },
  { name: 'File de validation', href: '/dashboard/chef/validation', icon: ClipboardCheck, badge: true },
  { name: 'Demandes équipe', href: '/dashboard/chef/demandes', icon: Users },
  { name: 'Statistiques équipe', href: '/dashboard/chef/statistiques', icon: BarChart3 },
  { name: 'Notifications', href: '/dashboard/chef/notifications', icon: Bell },
];

interface SidebarChefProps {
  className?: string;
}

export default function SidebarChef({ className }: SidebarChefProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPersonalOpen, setIsPersonalOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = await demandeService.getDemandesAValider();
        setPendingCount(data.length);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPending();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const userName = user?.nom || 'Chef de service';

  const handleConfirmLogout = async () => {
    setDialogOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 bg-[#1D6F42] text-white flex flex-col shadow-xl", className)}>
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
            <p className="text-sm text-white/70">SIGR - Chef de service</p>
          </div>
        </div>

        {/* Navigation avec scrollbar invisible */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar">
          {/* Espace Personnel */}
          <div>
            <button
              onClick={() => setIsPersonalOpen(!isPersonalOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
            >
              <span>Espace Personnel</span>
              {isPersonalOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {isPersonalOpen && (
              <div className="mt-1 space-y-1">
                {commonNav.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        isActive
                          ? 'bg-white text-[#1D6F42] shadow-sm'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <item.icon className={cn('w-5 h-5', isActive ? 'text-[#1D6F42]' : 'text-white/50')} />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Validation & Workflow */}
          <div>
            <button
              onClick={() => setIsWorkflowOpen(!isWorkflowOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
            >
              <span>Validation & Workflow</span>
              {isWorkflowOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {isWorkflowOpen && (
              <div className="mt-1 space-y-1">
                {chefNav.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        isActive
                          ? 'bg-white text-[#1D6F42] shadow-sm'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <item.icon className={cn('w-5 h-5', isActive ? 'text-[#1D6F42]' : 'text-white/50')} />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && pendingCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Zone utilisateur */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
              {getInitials(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{userName}</p>
              <p className="text-xs text-white/60 truncate">Chef de service</p>
            </div>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

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