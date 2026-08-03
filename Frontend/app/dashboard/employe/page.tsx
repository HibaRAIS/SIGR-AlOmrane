'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { demandeService } from '@/services/demande.service';
import { DemandeResponse } from "@/types/demande";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  FileText,
  ClipboardList,
  AlertTriangle,
  History,
  ArrowRight,
  TrendingUp,
  Clock,
  Boxes,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function EmployeDashboardPage() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    demandeService.getMesDemandes()
      .then(setDemandes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    enAttente: demandes.filter(d => d.statut === 'EN_VALIDATION').length,
    approuvees: demandes.filter(d => d.statut === 'VALIDEE').length,
    refusees: demandes.filter(d => d.statut === 'REFUSEE').length,
  };

  // Données mockées pour les stats du style (à remplacer par des données réelles si disponible)
  const statsCards = [
    {
      title: "Demandes en cours",
      value: stats.enAttente.toString(),
      description: "En attente de validation",
      icon: Clock,
      accent: "#d97706",
      bg: "#fffbeb",
      border: "#fcd34d",
    },
    {
      title: "Demandes approuvées",
      value: stats.approuvees.toString(),
      description: "Ce mois-ci",
      icon: CheckCircle2,
      accent: "#166534",
      bg: "#f0fdf4",
      border: "#86efac",
    },
    {
      title: "Matériel en prêt",
      value: "2", // À connecter à une API plus tard
      description: "À retourner",
      icon: Boxes,
      accent: "#b91c1c",
      bg: "#fff1f2",
      border: "#fca5a5",
    },
    {
      title: "Total consommation",
      value: "47", // À connecter à une API plus tard
      description: "Articles cette année",
      icon: TrendingUp,
      accent: "#1a5c2a",
      bg: "#f0fdf4",
      border: "#6ee7b7",
    },
  ];

  const quickActions = [
    {
      title: "Consulter le Catalogue",
      description: "Parcourir les articles disponibles",
      href: "/dashboard/employe/catalogue",
      icon: Package,
    },
    {
      title: "Mon Panier",
      description: "Gérer mes articles sélectionnés",
      href: "/dashboard/employe/panier",
      icon: ShoppingCart,
    },
    {
      title: "Nouvelle Demande",
      description: "Soumettre une demande de matériel",
      href: "/dashboard/employe/demandes/nouvelle",
      icon: FileText,
    },
    {
      title: "Suivi des Demandes",
      description: "Voir l'état de mes demandes",
      href: "/dashboard/employe/suivi",
      icon: ClipboardList,
    },
  ];

  // Demandes récentes (les 3 premières)
  const recentRequests = demandes.slice(0, 3).map(d => ({
    id: d.numeroDemande,
    title: d.motif || `Demande ${d.numeroDemande}`,
    date: new Date(d.dateDemande).toLocaleDateString('fr-FR'),
    status: d.statut,
    statusLabel: d.statut === 'EN_VALIDATION' ? 'En attente' : d.statut === 'VALIDEE' ? 'Approuvée' : 'Refusée',
  }));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#1a5c2a]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1a5c2a]/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                Espace Collaborateur
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bonjour, <span className="text-[#1a5c2a]">{user?.nom || 'Employé'}</span>
            </h1>
            <p className="text-slate-500 text-sm max-w-md leading-relaxed">
              Bienvenue sur votre interface <span className="font-medium text-slate-800">SIGR</span>. 
              Toutes vos demandes de matériel sont centralisées ici.
            </p>
          </div>
          <Button 
            asChild 
            className="bg-[#1a5c2a] text-white hover:bg-[#144620] px-6 py-6 rounded-xl font-semibold shadow-md transition-all active:scale-95"
          >
            <Link href="/dashboard/employe/catalogue" className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Nouvelle commande
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl p-5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ border: `1.5px solid ${s.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon size={20} style={{ color: s.accent }} />
              </div>
            </div>
            <p className="text-3xl font-black mb-0.5" style={{ color: "#111827", letterSpacing: "-0.03em" }}>
              {s.value}
            </p>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "#374151" }}>{s.title}</p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>{s.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Actions Rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="group p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <action.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{action.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Demandes Récentes</CardTitle>
              <CardDescription>Vos dernières demandes de matériel</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/employe/suivi" className="text-primary">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-center text-gray-500">Chargement...</p>
            ) : recentRequests.length === 0 ? (
              <p className="text-center text-gray-500">Aucune demande</p>
            ) : (
              recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      request.status === "VALIDEE" ? "bg-primary/10" :
                      request.status === "EN_VALIDATION" ? "bg-amber-100" : "bg-red-100"
                    }`}>
                      {request.status === "VALIDEE" ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : request.status === "EN_VALIDATION" ? (
                        <Clock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{request.title}</p>
                      <p className="text-xs text-muted-foreground">{request.id} - {request.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    request.status === "VALIDEE" ? "bg-primary/10 text-primary" :
                    request.status === "EN_VALIDATION" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {request.statusLabel}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="border-0 shadow-sm border-l-4 border-l-amber-500 bg-amber-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Alerte de consignation</h3>
              <p className="text-sm text-amber-800 mt-1">
                Vous avez 2 équipements en prêt dont les dates de retour approchent. Veuillez les retourner avant le 15 Mars 2026.
              </p>
              <Button variant="outline" size="sm" className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100" asChild>
                <Link href="/dashboard/employe/prets">
                  Voir mes prêts
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}