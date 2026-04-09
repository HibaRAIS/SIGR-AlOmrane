"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Laptop,
  Key,
  MessageSquare,
} from "lucide-react"

const userProfile = {
  firstName: "Mohamed",
  lastName: "Karimi",
  email: "m.karimi@alomrane.ma",
  phone: "+212 6 12 34 56 78",
  department: "Service Administratif",
  position: "Agent Administratif",
  site: "Agadir",
  employeeId: "EMP-2024-0156",
  joinDate: "15 Janvier 2020",
  manager: "Ahmed Benali",
  accessLevel: "Employé",
}

const supportCategories = [
  { value: "password", label: "Réinitialisation mot de passe", icon: Key },
  { value: "access", label: "Problème d'accès", icon: Shield },
  { value: "hardware", label: "Problème matériel", icon: Laptop },
  { value: "software", label: "Problème logiciel", icon: AlertCircle },
  { value: "other", label: "Autre demande", icon: HelpCircle },
]

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    phone: userProfile.phone,
    email: userProfile.email,
  })
  const [supportDialogOpen, setSupportDialogOpen] = useState(false)
  const [supportSubmitted, setSupportSubmitted] = useState(false)
  const [supportForm, setSupportForm] = useState({
    category: "",
    subject: "",
    description: "",
    priority: "normal",
  })

  const handleSave = () => {
    setIsEditing(false)
  }

  const handleSupportSubmit = () => {
    setSupportSubmitted(true)
    setTimeout(() => {
      setSupportDialogOpen(false)
      setSupportSubmitted(false)
      setSupportForm({ category: "", subject: "", description: "", priority: "normal" })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mon Profil</h1>
        <p className="text-muted-foreground mt-1">
          Consultez et gérez vos informations personnelles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 border-4 border-primary/20 mb-4">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {userProfile.firstName[0]}{userProfile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{userProfile.firstName} {userProfile.lastName}</h2>
              <p className="text-muted-foreground">{userProfile.position}</p>
              <Badge className="mt-2 bg-primary/10 text-primary border-0">
                {userProfile.department}
              </Badge>

              <div className="w-full mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{userProfile.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Site {userProfile.site}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Informations Personnelles</CardTitle>
              <CardDescription>Vos données enregistrées dans le système</CardDescription>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={userProfile.firstName}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={userProfile.lastName}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  value={isEditing ? formData.email : userProfile.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={isEditing ? formData.phone : userProfile.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Informations Professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Matricule</p>
                    <p className="font-medium">{userProfile.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="font-medium">{userProfile.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Site</p>
                    <p className="font-medium">{userProfile.site}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date d&apos;embauche</p>
                    <p className="font-medium">{userProfile.joinDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Hiérarchie & Accès</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-[#E31837]/10">
                    <User className="w-5 h-5 text-[#E31837]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Responsable</p>
                    <p className="font-medium">{userProfile.manager}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-[#E31837]/10">
                    <Shield className="w-5 h-5 text-[#E31837]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Niveau d&apos;accès</p>
                    <p className="font-medium">{userProfile.accessLevel}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Sécurité du Compte</CardTitle>
          <CardDescription>Paramètres de connexion et support technique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-xl gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Mot de passe</p>
                <p className="text-sm text-muted-foreground">
                  Géré par le service informatique via LDAP/Active Directory
                </p>
              </div>
            </div>
            <Badge variant="secondary">Géré par IT</Badge>
          </div>

          {/* Last Login */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-xl gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Dernière connexion</p>
                <p className="text-sm text-muted-foreground">
                  11 Mars 2026 à 08:45 - Agadir
                </p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
          </div>

          {/* Support IT Section */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#E31837]" />
              Contacter le Support IT
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supportCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.value}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:border-[#E31837] hover:text-[#E31837]"
                    onClick={() => {
                      setSupportForm({ ...supportForm, category: category.value })
                      setSupportDialogOpen(true)
                    }}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs text-center">{category.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Dialog */}
      <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
        <DialogContent className="max-w-lg">
          {supportSubmitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Demande envoyée !</h3>
              <p className="text-muted-foreground">
                Votre ticket a été créé. Le support IT vous contactera sous 24h ouvrées.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#E31837]" />
                  Contacter le Support IT
                </DialogTitle>
                <DialogDescription>
                  Décrivez votre problème et notre équipe vous répondra rapidement
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Type de demande</Label>
                  <Select 
                    value={supportForm.category} 
                    onValueChange={(value) => setSupportForm({ ...supportForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select 
                    value={supportForm.priority} 
                    onValueChange={(value) => setSupportForm({ ...supportForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse - Peut attendre</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Haute - Urgent</SelectItem>
                      <SelectItem value="critical">Critique - Bloquant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input
                    id="subject"
                    placeholder="Décrivez brièvement votre problème"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description détaillée</Label>
                  <Textarea
                    id="description"
                    placeholder="Fournissez tous les détails nécessaires pour nous aider à résoudre votre problème..."
                    value={supportForm.description}
                    onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Informations automatiquement jointes :</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Matricule: {userProfile.employeeId} | Service: {userProfile.department} | Site: {userProfile.site}
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSupportDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  className="bg-[#E31837] hover:bg-[#E31837]/90"
                  onClick={handleSupportSubmit}
                  disabled={!supportForm.category || !supportForm.subject}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer la demande
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
