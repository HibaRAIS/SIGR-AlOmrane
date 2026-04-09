"use client"

import Link from "next/link"
import { Bell, CheckCircle2, Clock, XCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  time: string
  read: boolean
  link?: string
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Demande approuvée",
    message: "Votre demande DEM-2026-0145 a été approuvée par Ahmed Benali",
    time: "Il y a 2 heures",
    read: false,
    link: "/dashboard/suivi",
  },
  {
    id: "2",
    type: "warning",
    title: "Échéance proche",
    message: "L'ordinateur portable HP doit être retourné dans 4 jours",
    time: "Il y a 5 heures",
    read: false,
    link: "/dashboard/prets",
  },
  {
    id: "3",
    type: "info",
    title: "Demande en traitement",
    message: "Votre demande DEM-2026-0142 est en cours de préparation",
    time: "Hier",
    read: true,
    link: "/dashboard/suivi",
  },
  {
    id: "4",
    type: "error",
    title: "Demande refusée",
    message: "Votre demande DEM-2026-0138 a été refusée",
    time: "Il y a 3 jours",
    read: true,
    link: "/dashboard/suivi",
  },
]

const notificationConfig = {
  success: { icon: CheckCircle2, color: "text-primary",    bg: "bg-primary/10" },
  warning: { icon: Clock,         color: "text-amber-600", bg: "bg-amber-100" },
  info:    { icon: Calendar,      color: "text-blue-600",  bg: "bg-blue-100" },
  error:   { icon: XCircle,       color: "text-[#E31837]", bg: "bg-[#E31837]/10" },
}

export function NotificationsPopover() {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Popover>
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
          <Badge variant="secondary" className="text-xs">
            {unreadCount} nouvelles
          </Badge>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map((notification) => {
            const config = notificationConfig[notification.type]
            const Icon = config.icon
            return (
              <Link
                key={notification.id}
                href={notification.link || "#"}
                className={cn(
                  "flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-medium",
                      !notification.read ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-[#E31837] rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {notification.time}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full text-primary" asChild>
            <Link href="/dashboard/notifications">
              Voir toutes les notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}