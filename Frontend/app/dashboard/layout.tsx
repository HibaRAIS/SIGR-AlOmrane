'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/layout/Header';
import SidebarEmploye from '@/components/dashboard/layout/SidebarEmploye';
import SidebarChef from '@/components/dashboard/layout/SidebarChef';
import SidebarResponsable from '@/components/dashboard/layout/SidebarResponsable';
import SidebarAdmin from '@/components/dashboard/layout/SidebarAdmin';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIDEBAR_WIDTH = 288;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Position du bouton (initialisée à null, puis définie côté client)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Charger la position sauvegardée et initialiser la position par défaut côté client
  useEffect(() => {
    const defaultPosition = { x: 24, y: window.innerHeight - 80 };
    const saved = localStorage.getItem('toggleButtonPosition');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
          setPosition(pos);
          return;
        }
      } catch (e) {}
    }
    setPosition(defaultPosition);
  }, []);

  // Sauvegarder la position quand elle change
  useEffect(() => {
    if (position) {
      localStorage.setItem('toggleButtonPosition', JSON.stringify(position));
    }
  }, [position]);

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!position) return;
    // Permet le drag seulement si on clique sur la div, pas sur le bouton
    if ((e.target as HTMLElement).closest('button')) {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!position) return;
      let newX = dragRef.current.initialX + (e.clientX - dragRef.current.startX);
      let newY = dragRef.current.initialY + (e.clientY - dragRef.current.startY);
      const buttonSize = 40;
      newX = Math.min(window.innerWidth - buttonSize - 10, Math.max(10, newX));
      newY = Math.min(window.innerHeight - buttonSize - 10, Math.max(10, newY));
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  const role = user?.role;
  const SidebarComponent = () => {
    switch (role) {
      case 'CHEF_SERVICE': return <SidebarChef />;
      case 'RESPONSABLE_LOGISTIQUE': return <SidebarResponsable />;
      case 'ADMIN_SI': return <SidebarAdmin />;
      default: return <SidebarEmploye />;
    }
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Ne pas afficher le bouton tant que la position n'est pas définie (évite le CLS)
  if (!position) {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        <div className={cn("fixed top-0 left-0 bottom-0 z-40 transition-transform", sidebarOpen ? "translate-x-0" : "-translate-x-full")} style={{ width: SIDEBAR_WIDTH }}>
          <SidebarComponent />
        </div>
        <div className="transition-all" style={{ marginLeft: sidebarOpen ? SIDEBAR_WIDTH : 0 }}>
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className={cn("fixed top-0 left-0 bottom-0 z-40 transition-transform", sidebarOpen ? "translate-x-0" : "-translate-x-full")} style={{ width: SIDEBAR_WIDTH }}>
        <SidebarComponent />
      </div>
      <div className="transition-all" style={{ marginLeft: sidebarOpen ? SIDEBAR_WIDTH : 0 }}>
        <Header />
        <main className="p-6">{children}</main>
      </div>
      <div className="fixed z-50 cursor-grab active:cursor-grabbing select-none" style={{ left: position.x, top: position.y }} onMouseDown={handleMouseDown}>
        <Button variant="outline" size="icon" onClick={toggleSidebar} className="rounded-full bg-white shadow-lg border border-gray-200 h-10 w-10 pointer-events-auto">
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}