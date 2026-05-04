'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';
import { NotificationsPopover } from './notifications-popover'; // ← à importer

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirmLogout = async () => {
    setDialogOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b px-6 py-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Bonjour, {user?.nom || 'Utilisateur'}</h2>
          <p className="text-sm text-gray-500">Bienvenue sur SIGR</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationsPopover /> {/* ← remplace le Button avec Bell */}
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>
      <LogoutConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}