"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/CartContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Send, CheckCircle2, Trash2 } from "lucide-react"
import Link from "next/link"

export default function DemandesPage() {
  const { cart, removeFromCart, clearCart } = useCart()
  const [justification, setJustification] = useState("")
  const [urgency, setUrgency] = useState("normal")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [demandRef, setDemandRef] = useState("")

  const handleSubmit = async () => {
    if (!justification.trim() || justification.length < 20) return
    setIsSubmitting(true)

    const token = localStorage.getItem("token")
    const body = {
      justification: justification,
      urgence: urgency.toUpperCase(),
      lignes: cart.map(item => ({ produitId: item.id, quantite: item.quantity }))
    }

    try {
      const res = await fetch("http://localhost:8081/api/demandes", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const data = await res.json()
        setDemandRef(data.reference)
        clearCart()
        setIsSubmitted(true)
      } else {
        alert("Erreur lors de l'envoi. Vérifiez que votre manager est bien assigné.")
      }
    } catch (e) { console.error(e) } finally { setIsSubmitting(false) }
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full text-center p-8 shadow-2xl rounded-3xl border-0">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Demande Envoyée !</h2>
          <p className="text-gray-500 mb-6 text-sm">Référence : <span className="font-mono font-bold text-black">{demandRef}</span></p>
          <Button className="w-full bg-[#1D6F42]" asChild><Link href="/dashboard">Retour</Link></Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1D6F42]">Nouvelle Demande</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader><CardTitle>Articles sélectionnés</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Package className="text-[#1D6F42]" />
                    <div><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-gray-400">Réf: {item.reference}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-green-100 text-green-700">Qté: {item.quantity}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center py-10 text-gray-400">Panier vide</p>}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader><CardTitle>Justification & Urgence</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label>Pourquoi avez-vous besoin de ce matériel ?</Label>
              <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Minimum 20 caractères..." />
              
              <Label>Niveau d'urgence</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (5-7 jours)</SelectItem>
                  <SelectItem value="urgent">Urgent (2-3 jours)</SelectItem>
                  <SelectItem value="critique">Critique (Immédiat)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg rounded-3xl p-2 bg-[#1D6F42] text-white">
            <CardHeader><CardTitle className="text-white">Récapitulatif</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between"><span>Articles</span><span>{cart.length}</span></div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || cart.length === 0 || justification.length < 20} 
                className="w-full bg-white text-[#1D6F42] hover:bg-gray-100 font-bold py-6 rounded-2xl"
              >
                {isSubmitting ? "Envoi..." : "Soumettre la demande"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}