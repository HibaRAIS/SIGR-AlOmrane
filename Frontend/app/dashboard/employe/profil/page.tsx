"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { employeService, ProfilResponse } from "@/services/employe.service";
import { ticketService } from "@/services/ticket.service";

const supportCategories = [
  { value: "password", label: "Réinitialisation mot de passe", icon: Key },
  { value: "access", label: "Problème d'accès", icon: Shield },
  { value: "hardware", label: "Problème matériel", icon: Laptop },
  { value: "software", label: "Problème logiciel", icon: AlertCircle },
  { value: "other", label: "Autre demande", icon: HelpCircle },
];

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfilResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportForm, setSupportForm] = useState({
    category: "",
    subject: "",
    description: "",
    priority: "normal",
  });

  // Chargement du profil
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await employeService.getProfil();
      setProfile(data);
      setPhone(data.telephone || "");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Sauvegarde du téléphone
  const handleSave = async () => {
    if (!profile) return;
    try {
      await employeService.updateTelephone(phone);
      toast.success("Téléphone mis à jour avec succès");
      setProfile({ ...profile, telephone: phone });
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  // Support ticket submission
  const handleSupportSubmit = async () => {
  if (!supportForm.category || !supportForm.subject) {
    toast.error("Veuillez remplir la catégorie et le sujet");
    return;
  }

  // Mapping priorité frontend → backend
  const priorityMapping: Record<string, string> = {
    low: "BASSE",
    normal: "NORMALE",
    high: "HAUTE",
    critical: "CRITIQUE",
  };

  try {
    await ticketService.creerTicket({
      categorie: supportForm.category,
      sujet: supportForm.subject,
      description: supportForm.description,
      priorite: priorityMapping[supportForm.priority] || "NORMALE",
    });
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportDialogOpen(false);
      setSupportSubmitted(false);
      setSupportForm({
        category: "",
        subject: "",
        description: "",
        priority: "normal",
      });
      toast.success("Demande envoyée au support IT");
    }, 2000);
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Erreur lors de l'envoi");
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#E31837]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
        <p>Impossible de charger le profil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mon Profil</h1>
        <p className="text-muted-foreground mt-1">Consultez et gérez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 border-4 border-primary/20 mb-4">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile.prenom[0]}{profile.nom[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{profile.prenom} {profile.nom}</h2>
              <p className="text-muted-foreground">{profile.service}</p>
              <Badge className="mt-2 bg-primary/10 text-primary border-0">
                {profile.service}
              </Badge>

              <div className="w-full mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.telephone || "Non renseigné"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.site || "Non défini"}</span>
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
                <Input id="firstName" value={profile.prenom} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" value={profile.nom} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input id="email" value={profile.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                  placeholder="ex:  +212612345678  ou  0612345678"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Informations Professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10"><User className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Matricule</p><p className="font-medium">{profile.matricule}</p></div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10"><Building2 className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Service</p><p className="font-medium">{profile.service}</p></div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10"><MapPin className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Site</p><p className="font-medium">{profile.site || "Non défini"}</p></div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10"><Calendar className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Badge</p><p className="font-medium">{profile.badge || "Non attribué"}</p></div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Hiérarchie & Accès</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-[#E31837]/10"><User className="w-5 h-5 text-[#E31837]" /></div>
                  <div><p className="text-xs text-muted-foreground">Responsable</p><p className="font-medium">{profile.responsable}</p></div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-[#E31837]/10"><Shield className="w-5 h-5 text-[#E31837]" /></div>
                  <div><p className="text-xs text-muted-foreground">Niveau d&apos;accès</p><p className="font-medium">{profile.niveauAcces}</p></div>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-xl gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Key className="w-5 h-5 text-primary" /></div>
              <div><p className="font-medium">Mot de passe</p><p className="text-sm text-muted-foreground">Géré par le service informatique via LDAP/Active Directory</p></div>
            </div>
            <Badge variant="secondary">Géré par IT</Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-xl gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Calendar className="w-5 h-5 text-primary" /></div>
              <div><p className="font-medium">Dernière connexion</p><p className="text-sm text-muted-foreground">{profile.derniereConnexion}</p></div>
            </div>
            <Badge className="bg-primary/10 text-primary border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Sécurisé</Badge>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#E31837]" />Contacter le Support IT</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supportCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.value}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 border-gray-200 bg-white text-gray-700 hover:border-[#E31837] hover:bg-[#E31837]/5 hover:text-[#E31837]"
                    onClick={() => {
                      setSupportForm({ ...supportForm, category: category.value });
                      setSupportDialogOpen(true);
                    }}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs text-center">{category.label}</span>
                  </Button>
                );
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
              <p className="text-muted-foreground">Votre ticket a été créé. Le support IT vous contactera sous 24h ouvrées.</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#E31837]" />Contacter le Support IT</DialogTitle>
                <DialogDescription>Décrivez votre problème et notre équipe vous répondra rapidement</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Type de demande</Label>
                  <Select value={supportForm.category} onValueChange={(value) => setSupportForm({ ...supportForm, category: value })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez une catégorie" /></SelectTrigger>
                    <SelectContent>
                      {supportCategories.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={supportForm.priority} onValueChange={(value) => setSupportForm({ ...supportForm, priority: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Input id="subject" placeholder="Décrivez brièvement votre problème" value={supportForm.subject} onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description détaillée</Label>
                  <Textarea id="description" placeholder="Fournissez tous les détails nécessaires..." value={supportForm.description} onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })} rows={4} />
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground"><strong>Informations automatiquement jointes :</strong></p>
                  <p className="text-xs text-muted-foreground mt-1">Matricule: {profile.matricule} | Service: {profile.service} | Site: {profile.site || "Non défini"}</p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSupportDialogOpen(false)}>Annuler</Button>
                <Button className="bg-[#E31837] hover:bg-[#E31837]/90" onClick={handleSupportSubmit} disabled={!supportForm.category || !supportForm.subject}>
                  <Send className="w-4 h-4 mr-2" />Envoyer la demande
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}