'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { notificationService } from '@/services/notification.service';
import { Notification } from '@/types/notification';
import { useAuth } from '@/context/AuthContext';

const notificationConfig = {
  SUCCESS: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
  WARNING: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  INFO: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
  ERROR: { icon: XCircle, color: 'text-[#E31837]', bg: 'bg-[#E31837]/10' },
};

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

export function NotificationsPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const getNotificationsLink = () => {
    if (!user) return '/dashboard/notifications';
    switch (user.role) {
      case 'EMPLOYE': return '/dashboard/employe/notifications';
      case 'CHEF_SERVICE': return '/dashboard/chef/notifications';
      case 'RESPONSABLE_LOGISTIQUE': return '/dashboard/responsable/notifications';
      case 'ADMIN_SI': return '/dashboard/admin/notifications';
      default: return '/dashboard/notifications';
    }
  };

  // Rechargement périodique (toutes les 10 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [latest, count] = await Promise.all([
        notificationService.getLatestUnread(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(latest);
      setUnreadCount(count);
    } catch (error) {
      console.error('Erreur chargement notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);



  // Recharger à chaque ouverture du popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadData();
    }
  };

  const handleMarkAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    setUnreadCount(prev => prev - 1);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#E31837] rounded-full text-[10px] text-white font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} nouvelles
            </Badge>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Aucune notification</div>
          ) : (
            notifications.map((notif) => {
              const config = notificationConfig[notif.type as keyof typeof notificationConfig];
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notif.lu && "bg-primary/5"
                  )}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-medium", !notif.lu ? "text-foreground" : "text-muted-foreground")}>
                        {notif.titre}
                      </p>
                      {!notif.lu && <span className="w-2 h-2 bg-[#E31837] rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{formatRelativeTime(notif.dateCreation)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full text-primary" asChild>
            <Link href={getNotificationsLink()}>Voir toutes les notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}