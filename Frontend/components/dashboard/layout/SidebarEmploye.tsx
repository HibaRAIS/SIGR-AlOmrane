'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingCart, FileText, ClipboardList, AlertTriangle, History, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard/employe', icon: LayoutDashboard },
  { name: 'Catalogue', href: '/dashboard/employe/catalogue', icon: Package },
  { name: 'Mon Panier', href: '/dashboard/employe/panier', icon: ShoppingCart },
  { name: 'Mes Demandes', href: '/dashboard/employe/demandes', icon: FileText },
  { name: 'Suivi des Demandes', href: '/dashboard/employe/suivi', icon: ClipboardList },
  { name: 'Matériel en Prêt', href: '/dashboard/employe/prets', icon: AlertTriangle },
  { name: 'Historique', href: '/dashboard/employe/historique', icon: History },
  { name: 'Mon Profil', href: '/dashboard/employe/profil', icon: User },
  { name: 'Mes Notifications', href: '/dashboard/employe/notifications', icon: Bell },

];

export default function SidebarEmploye() {
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
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#1D6F42] text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">AL OMRANE</h1>
          <p className="text-sm text-white/70">SIGR - Agadir</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'bg-white text-[#1D6F42]'
                  : 'hover:bg-white/10'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
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
      <LogoutConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}