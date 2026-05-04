'use client';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/layout/Header';
import SidebarEmploye from '@/components/dashboard/layout/SidebarEmploye';
import SidebarChef from '@/components/dashboard/layout/SidebarChef';
import SidebarResponsable from '@/components/dashboard/layout/SidebarResponsable';
import SidebarAdmin from '@/components/dashboard/layout/SidebarAdmin';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  const role = user?.role;

  const SidebarComponent = () => {
    switch (role) {
      case 'CHEF_SERVICE':
        return <SidebarChef />;
      case 'RESPONSABLE_LOGISTIQUE':
        return <SidebarResponsable />;
      case 'ADMIN_SI':
        return <SidebarAdmin />;
      default:
        return <SidebarEmploye />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarComponent />
      <div className="lg:pl-72">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}