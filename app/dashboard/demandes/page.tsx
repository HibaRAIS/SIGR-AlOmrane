"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Package,
  Send,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
} from "lucide-react"

interface RequestItem {
  id: number
  name: string
  reference: string
  quantity: number
}

const urgencyLevels = [
  { id: "normal", name: "Normal", description: "Traitement standard (5-7 jours)" },
  { id: "urgent", name: "Urgent", description: "Traitement prioritaire (2-3 jours)" },
  { id: "critical", name: "Critique", description: "Besoin immédiat (24-48h)" },
]

export default function DemandesPage() {
  const router = useRouter()
  const [items, setItems] = useState<RequestItem[]>([
    { id: 1, name: "Stylo bille bleu", reference: "STY-001", quantity: 5 },
    { id: 2, name: "Ramette papier A4", reference: "PAP-A4-500", quantity: 2 },
  ])
  const [justification, setJustification] = useState("")
  const [urgency, setUrgency] = useState("normal")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmit = async () => {
    if (!justification.trim()) {
      return
    }
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-0 shadow-lg max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Demande Soumise !</h2>
            <p className="text-muted-foreground mb-6">
              Votre demande a été envoyée avec succès. Vous pouvez suivre son état dans la section &quot;Suivi des Demandes&quot;.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Numéro de référence : <span className="font-mono font-bold text-foreground">DEM-2026-0148</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/dashboard/suivi")}>
                Voir mes demandes
              </Button>
              <Button onClick={() => router.push("/dashboard")}>
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Nouvelle Demande de Matériel</h1>
        <p className="text-muted-foreground mt-1">
          Complétez les informations ci-dessous pour soumettre votre demande
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Articles demandés</CardTitle>
                  <CardDescription>Liste des articles de votre demande</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un article</DialogTitle>
                      <DialogDescription>
                        Ajoutez un article manuellement ou depuis le catalogue
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Button className="w-full" onClick={() => router.push("/dashboard/catalogue")}>
                        <Package className="w-4 h-4 mr-2" />
                        Voir le catalogue
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Réf: {item.reference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">Qté: {item.quantity}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun article dans la demande</p>
                  <Button variant="link" onClick={() => router.push("/dashboard/catalogue")}>
                    Parcourir le catalogue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Justification Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Justification du besoin</CardTitle>
              <CardDescription>
                Expliquez pourquoi vous avez besoin de ces articles (obligatoire)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="justification">Motif de la demande *</Label>
                <Textarea
                  id="justification"
                  placeholder="Décrivez le contexte et la raison de votre demande..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 20 caractères. Soyez précis pour accélérer la validation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Niveau d&apos;urgence</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger id="urgency">
                    <SelectValue placeholder="Sélectionner le niveau d'urgence" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <div>
                          <span className="font-medium">{level.name}</span>
                          <span className="text-muted-foreground ml-2">- {level.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Référence projet (optionnel)</Label>
                <Input
                  id="reference"
                  placeholder="Ex: PROJ-2026-001"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Articles</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Urgence</span>
                  <Badge variant={urgency === "critical" ? "destructive" : urgency === "urgent" ? "default" : "secondary"}>
                    {urgencyLevels.find((l) => l.id === urgency)?.name}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-muted-foreground">
                    Votre demande sera envoyée à votre responsable pour validation.
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={items.length === 0 || justification.length < 20 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Soumettre la demande
                  </>
                )}
              </Button>

              {justification.length > 0 && justification.length < 20 && (
                <p className="text-xs text-destructive text-center">
                  La justification doit contenir au moins 20 caractères
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
