"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  Eye,
  AlertTriangle,
  MailCheck,
} from "lucide-react";
import Link from "next/link";
import { notificationService } from "@/services/notification.service";
import { Notification } from "@/types/notification";
import { useAuth } from "@/context/AuthContext";

const notificationConfig = {
  SUCCESS: { icon: CheckCircle2, color: "text-[#1D6F42]", bg: "bg-[#1D6F42]/10", label: "Succès" },
  WARNING: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", label: "Attention" },
  INFO: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50", label: "Information" },
  ERROR: { icon: XCircle, color: "text-[#E31837]", bg: "bg-[#E31837]/10", label: "Refus" },
};

type DateFilter = "all" | "today" | "week" | "month" | "custom";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
}

function isDateInRange(
  dateStr: string,
  filter: DateFilter,
  customStart?: Date,
  customEnd?: Date
): boolean {
  if (filter === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  switch (filter) {
    case "today":
      return date >= today;
    case "week":
      return date >= startOfWeek;
    case "month":
      return date >= startOfMonth;
    case "custom":
      if (!customStart || !customEnd) return true;
      return date >= customStart && date <= customEnd;
    default:
      return true;
  }
}

export default function NotificationsPageContent() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const page = await notificationService.getAll(currentPage, pageSize);
      setNotifications(page.content);
      setTotalElements(page.totalElements);
    } catch (error) {
      console.error("Erreur chargement notifications", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    const matchesRead =
      readFilter === "all" ||
      (readFilter === "unread" && !n.lu) ||
      (readFilter === "read" && n.lu);
    const matchesDate = isDateInRange(
      n.dateCreation,
      dateFilter,
      customStartDate,
      customEndDate
    );
    return matchesSearch && matchesType && matchesRead && matchesDate;
  });

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const markAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  const deleteNotification = async () => {
    if (notificationToDelete) {
      await notificationService.delete(notificationToDelete);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationToDelete));
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const openDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailsOpen(true);
    if (!notification.lu) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Gérez toutes vos notifications et alertes</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Tout marquer comme lu ({unreadCount})
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1D6F42]/10">
                <Bell className="w-5 h-5 text-[#1D6F42]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalElements}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E31837]/10">
                <Clock className="w-5 h-5 text-[#E31837]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Non lues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1D6F42]/10">
                <CheckCircle2 className="w-5 h-5 text-[#1D6F42]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.filter((n) => n.type === "SUCCESS").length}</p>
                <p className="text-xs text-muted-foreground">Succès</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.filter((n) => n.type === "WARNING").length}</p>
                <p className="text-xs text-muted-foreground">Alertes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-44 h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="SUCCESS">Succès</SelectItem>
                <SelectItem value="WARNING">Alertes</SelectItem>
                <SelectItem value="INFO">Informations</SelectItem>
                <SelectItem value="ERROR">Refus</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-full lg:w-44 h-11">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(val) => setDateFilter(val as DateFilter)}>
              <SelectTrigger className="w-full lg:w-44 h-11">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute la période</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="custom">Personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dateFilter === "custom" && (
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Date de début</label>
                <Input type="date" onChange={(e) => setCustomStartDate(e.target.value ? new Date(e.target.value) : undefined)} className="h-10" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Date de fin</label>
                <Input type="date" onChange={(e) => setCustomEndDate(e.target.value ? new Date(e.target.value) : undefined)} className="h-10" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <div className="space-y-3">
        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">Chargement...</CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucune notification</h3>
              <p className="text-muted-foreground text-sm">Aucune notification correspondante</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notif) => {
            const config = notificationConfig[notif.type];
            const Icon = config.icon;
            return (
              <Card
                key={notif.id}
                className={`border-0 shadow-sm transition-all hover:shadow-md ${!notif.lu ? "ring-1 ring-[#1D6F42]/20 bg-[#1D6F42]/5" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${config.bg} flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openDetails(notif)}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-sm ${!notif.lu ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.titre}
                        </h3>
                        {!notif.lu && <span className="w-2 h-2 bg-[#E31837] rounded-full flex-shrink-0" />}
                        <Badge variant="outline" className={`text-xs ml-auto ${config.color} border-current/30`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(notif.dateCreation).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(notif.dateCreation)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notif.lu && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[#1D6F42] hover:text-[#1D6F42] hover:bg-[#1D6F42]/10"
                          onClick={() => markAsRead(notif.id)}
                          title="Marquer comme lu"
                        >
                          <MailCheck className="w-4 h-4 mr-1" />
                          <span className="text-xs">Lire</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openDetails(notif)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#E31837] hover:text-[#E31837] hover:bg-[#E31837]/10"
                        onClick={() => {
                          setNotificationToDelete(notif.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialogue détail (sans lien) */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${notificationConfig[selectedNotification.type].bg}`}>
                    {(() => {
                      const Icon = notificationConfig[selectedNotification.type].icon;
                      return <Icon className={`w-5 h-5 ${notificationConfig[selectedNotification.type].color}`} />;
                    })()}
                  </div>
                  <div>
                    <DialogTitle>{selectedNotification.titre}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedNotification.dateCreation).toLocaleDateString("fr-FR")}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm">{selectedNotification.message}</p>
                {selectedNotification.details && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{selectedNotification.details}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Fermer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue suppression (inchangé) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#E31837]">
              <Trash2 className="w-5 h-5" /> Supprimer la notification
            </DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" className="bg-[#E31837] hover:bg-[#E31837]/90" onClick={deleteNotification}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}