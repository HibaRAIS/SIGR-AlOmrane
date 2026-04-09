"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Laptop,
  Projector,
  Smartphone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  MapPin,
  FileText,
} from "lucide-react"

interface LoanItem {
  id: string
  name: string
  type: string
  reference: string
  serialNumber: string
  loanDate: string
  dueDate: string
  dueDateObj: Date
  daysLeft: number
  status: "ok" | "warning" | "overdue"
  icon: typeof Laptop
  location: string
  responsible: string
  notes: string
}

const loanItems: LoanItem[] = [
  {
    id: "PRET-001",
    name: "Ordinateur portable HP",
    type: "Matériel informatique",
    reference: "HP-LAP-2024-015",
    serialNumber: "HP5CD1234567",
    loanDate: "1 Février 2026",
    dueDate: "15 Mars 2026",
    dueDateObj: new Date(2026, 2, 15),
    daysLeft: 4,
    status: "warning",
    icon: Laptop,
    location: "Magasin Central - Agadir",
    responsible: "Ahmed Benali",
    notes: "Prêt pour mission terrain. Retour prévu après formation.",
  },
  {
    id: "PRET-002",
    name: "Vidéoprojecteur Epson",
    type: "Équipement audiovisuel",
    reference: "EPS-PRJ-2024-003",
    serialNumber: "EPSON987654321",
    loanDate: "5 Mars 2026",
    dueDate: "20 Mars 2026",
    dueDateObj: new Date(2026, 2, 20),
    daysLeft: 9,
    status: "ok",
    icon: Projector,
    location: "Magasin Central - Agadir",
    responsible: "Ahmed Benali",
    notes: "Réservé pour présentation client le 18 Mars.",
  },
]

const loanHistory = [
  {
    id: "PRET-H001",
    name: "Téléphone de service",
    type: "Téléphonie",
    loanDate: "1 Janvier 2026",
    returnDate: "28 Février 2026",
    status: "returned",
    icon: Smartphone,
  },
  {
    id: "PRET-H002",
    name: "Ordinateur portable Dell",
    type: "Matériel informatique",
    loanDate: "15 Novembre 2025",
    returnDate: "15 Janvier 2026",
    status: "returned",
    icon: Laptop,
  },
]

const statusConfig = {
  ok: { label: "Dans les délais", color: "text-[#1D6F42]", bg: "bg-[#1D6F42]/10", border: "border-[#1D6F42]/20" },
  warning: { label: "Échéance proche", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  overdue: { label: "En retard", color: "text-[#E31837]", bg: "bg-[#E31837]/10", border: "border-[#E31837]/20" },
  returned: { label: "Retourné", color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
}

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

export default function PretsPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 11)) // March 11, 2026
  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const totalLoans = loanItems.length
  const warningLoans = loanItems.filter((item) => item.status === "warning").length
  const overdueLoans = loanItems.filter((item) => item.status === "overdue").length

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getDueDatesForDay = (day: number) => {
    return loanItems.filter(item => {
      const itemDate = item.dueDateObj
      return itemDate.getDate() === day && 
             itemDate.getMonth() === currentDate.getMonth() && 
             itemDate.getFullYear() === currentDate.getFullYear()
    })
  }

  const isToday = (day: number) => {
    const today = new Date(2026, 2, 11) // March 11, 2026
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
  }

  const openLoanDetails = (loan: LoanItem) => {
    setSelectedLoan(loan)
    setDetailsOpen(true)
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dueDates = getDueDatesForDay(day)
      const hasDueDate = dueDates.length > 0
      const hasWarning = dueDates.some(item => item.status === "warning")
      const hasOverdue = dueDates.some(item => item.status === "overdue")
      const hasOk = dueDates.some(item => item.status === "ok")
      
      let bgClass = ""
      let textClass = ""
      let dotClass = ""
      
      if (isToday(day)) {
        bgClass = "bg-[#1D6F42]"
        textClass = "text-white"
      } else if (hasDueDate) {
        if (hasOverdue) {
          bgClass = "bg-[#E31837]/10"
          textClass = "text-[#E31837]"
          dotClass = "bg-[#E31837]"
        } else if (hasWarning) {
          bgClass = "bg-amber-50"
          textClass = "text-amber-700"
          dotClass = "bg-amber-500"
        } else if (hasOk) {
          bgClass = "bg-[#1D6F42]/10"
          textClass = "text-[#1D6F42]"
          dotClass = "bg-[#1D6F42]"
        }
      }
      
      days.push(
        <button
          key={day}
          className={`
            h-10 w-full rounded-lg text-sm font-medium transition-all relative
            ${bgClass} ${textClass}
            ${!hasDueDate && !isToday(day) ? 'hover:bg-muted text-foreground' : ''}
          `}
        >
          {day}
          {hasDueDate && !isToday(day) && (
            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dotClass}`} />
          )}
        </button>
      )
    }

    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1D6F42]">Matériel en Prêt</h1>
        <p className="text-muted-foreground mt-1">
          Consultez et gérez le matériel qui vous a été confié
        </p>
      </div>

      {/* Alert Banner */}
      {warningLoans > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Attention - Échéances proches</p>
                <p className="text-sm text-amber-800 mt-1">
                  Vous avez {warningLoans} équipement(s) dont la date de retour approche. 
                  Veuillez les retourner dans les délais impartis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1D6F42]/10">
                <Laptop className="w-5 h-5 text-[#1D6F42]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLoans}</p>
                <p className="text-xs text-muted-foreground">Équipements en prêt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warningLoans}</p>
                <p className="text-xs text-muted-foreground">Échéances proches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E31837]/10">
                <AlertTriangle className="w-5 h-5 text-[#E31837]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueLoans}</p>
                <p className="text-xs text-muted-foreground">En retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-[#1D6F42]">Calendrier des échéances</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Légende :</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#1D6F42]" />
                  <span className="text-xs text-muted-foreground">Aujourd&apos;hui</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Proche</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#E31837]" />
                  <span className="text-xs text-muted-foreground">Retard</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Loans */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-[#1D6F42]">Équipements actuellement en prêt</CardTitle>
            <CardDescription>Cliquez sur un équipement pour voir les détails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loanItems.length > 0 ? (
              loanItems.map((item) => {
                const config = statusConfig[item.status]
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border ${config.border} ${config.bg} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => openLoanDetails(item)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                          <Icon className="w-6 h-6 text-[#1D6F42]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                            <Badge className={`${config.bg} ${config.color} border ${config.border}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.type}</p>
                          <p className="text-xs text-muted-foreground mt-1">Réf: {item.reference}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:ml-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Date de prêt</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.loanDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Date de retour</p>
                            <p className={`font-medium flex items-center gap-1 ${config.color}`}>
                              <Calendar className="w-3 h-3" />
                              {item.dueDate}
                            </p>
                          </div>
                        </div>

                        <div className={`px-4 py-2 rounded-lg text-center ${item.status === "warning" ? "bg-amber-500" : item.status === "overdue" ? "bg-[#E31837]" : "bg-[#1D6F42]"} text-white`}>
                          <p className="text-2xl font-bold">
                            {item.daysLeft}
                          </p>
                          <p className="text-xs">
                            jours restants
                          </p>
                        </div>

                        <Button variant="outline" size="sm" className="lg:hidden" onClick={(e) => { e.stopPropagation(); openLoanDetails(item) }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-[#1D6F42]/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucun équipement en prêt</h3>
                <p className="text-muted-foreground text-sm">
                  Vous n&apos;avez actuellement aucun matériel à retourner
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loan History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg text-[#1D6F42]">Historique des prêts</CardTitle>
            <CardDescription>Matériel précédemment emprunté et retourné</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-[#1D6F42]" asChild>
            <a href="/dashboard/historique">
              Voir tout
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loanHistory.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
              >
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Retourné le</p>
                  <p className="text-sm font-medium">{item.returnDate}</p>
                </div>
                <Badge variant="secondary" className="bg-[#1D6F42]/10 text-[#1D6F42]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Retourné
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Loan Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedLoan && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[#1D6F42]">
                  <selectedLoan.icon className="w-5 h-5" />
                  {selectedLoan.name}
                </DialogTitle>
                <DialogDescription>
                  Référence: {selectedLoan.reference}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConfig[selectedLoan.status].bg} ${statusConfig[selectedLoan.status].color} border ${statusConfig[selectedLoan.status].border}`}>
                    {statusConfig[selectedLoan.status].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{selectedLoan.daysLeft} jours restants</span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium">{selectedLoan.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">N° de série</p>
                    <p className="text-sm font-medium font-mono">{selectedLoan.serialNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Date de prêt</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#1D6F42]" />
                      {selectedLoan.loanDate}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Date de retour</p>
                    <p className={`text-sm font-medium flex items-center gap-1 ${statusConfig[selectedLoan.status].color}`}>
                      <Calendar className="w-3 h-3" />
                      {selectedLoan.dueDate}
                    </p>
                  </div>
                </div>

                {/* Location & Responsible */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#1D6F42]" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lieu de retour</p>
                      <p className="text-sm font-medium">{selectedLoan.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <User className="w-5 h-5 text-[#1D6F42]" />
                    <div>
                      <p className="text-xs text-muted-foreground">Responsable magasin</p>
                      <p className="text-sm font-medium">{selectedLoan.responsible}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedLoan.notes && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-3 p-3 bg-[#1D6F42]/5 rounded-lg border border-[#1D6F42]/20">
                      <FileText className="w-5 h-5 text-[#1D6F42] mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Notes</p>
                        <p className="text-sm mt-1">{selectedLoan.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
