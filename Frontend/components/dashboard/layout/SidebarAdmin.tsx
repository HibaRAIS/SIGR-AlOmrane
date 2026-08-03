'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  FileText,
  BarChart3,
  Settings,
  Activity,
  LogOut,
  MessageSquare,
  UserCog,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Utilisateurs & IAM', href: '/dashboard/admin/users', icon: Users },
    {
    name: "Gestion Employés",
    href: "/dashboard/admin/employees",
    icon: UserCog,
  },
  { name: 'Rôles & permissions', href: '/dashboard/admin/roles', icon: Shield },
  { name: 'Structures', href: '/dashboard/admin/organization', icon: Building2 },
  { name: 'Support IT', href: '/dashboard/admin/support', icon: MessageSquare },

];

interface SidebarAdminProps {
  className?: string;
}

export default function SidebarAdmin({ className }: SidebarAdminProps) {
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
            <p className="text-sm text-white/70">SIGR - Administrateur SI</p>
          </div>
        </div>

        {/* Navigation avec scrollbar invisible */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
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

      {/* Styles pour masquer la scrollbar */}
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