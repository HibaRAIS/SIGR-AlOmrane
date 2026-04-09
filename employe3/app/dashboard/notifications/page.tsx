"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Package,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  details?: string
  time: string
  date: string
  read: boolean
  link?: string
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Demande approuvée",
    message: "Votre demande DEM-2026-0145 a été approuvée par Ahmed Benali",
    details: "Votre demande de fournitures de bureau comprenant 5 articles a été validée. Le magasinier procédera à la préparation de votre commande dans les 24 à 48 heures ouvrées.",
    time: "Il y a 2 heures",
    date: "11 Mars 2026",
    read: false,
    link: "/dashboard/suivi",
  },
  {
    id: "2",
    type: "warning",
    title: "Échéance proche",
    message: "L'ordinateur portable HP doit être retourné dans 4 jours",
    details: "Le matériel en prêt (Réf: HP-LAP-2024-015) arrive à échéance le 15 Mars 2026. Veuillez prévoir le retour dans les délais pour éviter toute pénalité.",
    time: "Il y a 5 heures",
    date: "11 Mars 2026",
    read: false,
    link: "/dashboard/prets",
  },
  {
    id: "3",
    type: "info",
    title: "Demande en traitement",
    message: "Votre demande DEM-2026-0142 est en cours de préparation",
    details: "Le magasinier a commencé la préparation de votre commande. Vous serez notifié dès que celle-ci sera prête pour récupération.",
    time: "Hier à 14:30",
    date: "10 Mars 2026",
    read: true,
    link: "/dashboard/suivi",
  },
  {
    id: "4",
    type: "error",
    title: "Demande refusée",
    message: "Votre demande DEM-2026-0138 a été refusée",
    details: "Motif du refus : Budget dépassé pour ce mois. Veuillez resoumettre le mois prochain ou contacter votre responsable pour une exception.",
    time: "Il y a 3 jours",
    date: "8 Mars 2026",
    read: true,
    link: "/dashboard/suivi",
  },
  {
    id: "5",
    type: "success",
    title: "Matériel prêt",
    message: "Votre commande DEM-2026-0130 est prête pour récupération",
    details: "Votre commande est disponible au magasin central. Présentez-vous avec votre badge employé pour la récupération.",
    time: "Il y a 5 jours",
    date: "6 Mars 2026",
    read: true,
    link: "/dashboard/suivi",
  },
  {
    id: "6",
    type: "info",
    title: "Rappel de retour",
    message: "Le vidéoprojecteur doit être retourné le 20 Mars",
    details: "N'oubliez pas de retourner le vidéoprojecteur Epson (Réf: EPS-PRJ-2024-003) avant la date limite.",
    time: "Il y a 1 semaine",
    date: "4 Mars 2026",
    read: true,
    link: "/dashboard/prets",
  },
]

const notificationConfig = {
  success: { icon: CheckCircle2, color: "text-[#1D6F42]", bg: "bg-[#1D6F42]/10", label: "Succès" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", label: "Attention" },
  info: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50", label: "Information" },
  error: { icon: XCircle, color: "text-[#E31837]", bg: "bg-[#E31837]/10", label: "Refus" },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [readFilter, setReadFilter] = useState("all")
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || n.type === typeFilter
    const matchesRead = readFilter === "all" || 
      (readFilter === "unread" && !n.read) || 
      (readFilter === "read" && n.read)
    return matchesSearch && matchesType && matchesRead
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = () => {
    if (notificationToDelete) {
      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete))
      setDeleteDialogOpen(false)
      setNotificationToDelete(null)
    }
  }

  const openDetails = (notification: Notification) => {
    setSelectedNotification(notification)
    setDetailsOpen(true)
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Gérez toutes vos notifications et alertes
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Tout marquer comme lu ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1D6F42]/10">
                <Bell className="w-5 h-5 text-[#1D6F42]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
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
                <p className="text-2xl font-bold">{notifications.filter(n => n.type === "success").length}</p>
                <p className="text-xs text-muted-foreground">Approuvées</p>
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
                <p className="text-2xl font-bold">{notifications.filter(n => n.type === "warning").length}</p>
                <p className="text-xs text-muted-foreground">Alertes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48 h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="warning">Alertes</SelectItem>
                <SelectItem value="info">Informations</SelectItem>
                <SelectItem value="error">Refus</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-full lg:w-48 h-11">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const config = notificationConfig[notification.type]
          const Icon = config.icon
          return (
            <Card 
              key={notification.id} 
              className={`border-0 shadow-sm transition-all hover:shadow-md cursor-pointer ${!notification.read ? 'ring-1 ring-[#1D6F42]/20 bg-[#1D6F42]/5' : ''}`}
              onClick={() => openDetails(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${config.bg} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-[#E31837] rounded-full flex-shrink-0" />
                      )}
                      <Badge variant="outline" className={`text-xs ml-auto ${config.color} border-current/30`}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {notification.date}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDetails(notification)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#E31837] hover:text-[#E31837] hover:bg-[#E31837]/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setNotificationToDelete(notification.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredNotifications.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucune notification</h3>
              <p className="text-muted-foreground text-sm">
                Vous n&apos;avez aucune notification correspondant à vos critères
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${notificationConfig[selectedNotification.type].bg}`}>
                    {(() => {
                      const Icon = notificationConfig[selectedNotification.type].icon
                      return <Icon className={`w-5 h-5 ${notificationConfig[selectedNotification.type].color}`} />
                    })()}
                  </div>
                  <div>
                    <DialogTitle>{selectedNotification.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      {selectedNotification.date} - {selectedNotification.time}
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
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Fermer
                </Button>
                {selectedNotification.link && (
                  <Button asChild className="bg-[#1D6F42] hover:bg-[#1D6F42]/90">
                    <Link href={selectedNotification.link}>
                      Voir les détails
                    </Link>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#E31837]">
              <Trash2 className="w-5 h-5" />
              Supprimer la notification
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              className="bg-[#E31837] hover:bg-[#E31837]/90"
              onClick={deleteNotification}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
