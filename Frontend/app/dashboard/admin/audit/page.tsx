"use client";

import { useState, useMemo } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  Server,
  Database,
  Shield,
  RefreshCw,
  X,
  FileText,
  Hash,
  Bug,
  FileCheck,
  Filter,
  Calendar,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  target: string;
  details: string;
  ipAddress: string;
  status: "success" | "warning" | "error" | "info";
  hash: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "debug";
  service: string;
  message: string;
  details?: string;
  stackTrace?: string;
}

interface CustomsNomenclature {
  id: string;
  code: string;
  description: string;
  category: string;
  tariff: string;
  lastUpdated: string;
  status: "active" | "inactive";
}

// Données mockées (inchangées)
const auditLogs: AuditLog[] = [
  { id: "1", timestamp: "08/05/2026 14:32:15", user: "Mohammed Alami", action: "Connexion", module: "Authentification", target: "Système", details: "Connexion réussie via LDAP/2FA", ipAddress: "192.168.1.100", status: "success", hash: "a7f5e6d8c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6" },
  { id: "2", timestamp: "08/05/2026 14:28:42", user: "Fatima Benali", action: "Modification", module: "Utilisateurs", target: "Ahmed Tazi", details: "Changement de rôle: Employé -> Chef de Service", ipAddress: "192.168.1.105", status: "warning", hash: "b8g6f7e9d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7" },
  { id: "3", timestamp: "08/05/2026 14:15:08", user: "Sara Idrissi", action: "Création", module: "Employés", target: "Khadija El Amrani", details: "Nouvel employé créé avec matricule AO-2024-006", ipAddress: "192.168.1.110", status: "success", hash: "c9h7g8f0e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8" },
  { id: "4", timestamp: "08/05/2026 13:58:33", user: "Système", action: "Backup", module: "Système", target: "Base de données", details: "Sauvegarde automatique complétée - 2.4GB", ipAddress: "-", status: "info", hash: "d0i8h9g1f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9" },
  { id: "5", timestamp: "08/05/2026 13:45:21", user: "Omar Benjelloun", action: "Suppression", module: "Documents", target: "DOC-2024-156", details: "Document archivé supprimé définitivement", ipAddress: "192.168.1.108", status: "warning", hash: "e1j9i0h2g7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0" },
  { id: "6", timestamp: "08/05/2026 13:30:55", user: "Ahmed Tazi", action: "Connexion échouée", module: "Authentification", target: "Système", details: "Mot de passe LDAP incorrect (3ème tentative)", ipAddress: "192.168.1.115", status: "error", hash: "f2k0j1i3h8g7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1" },
  { id: "7", timestamp: "08/05/2026 13:12:44", user: "Nadia Chraibi", action: "Export", module: "Rapports", target: "Rapport mensuel Mai 2026", details: "Export PDF généré - 156 pages", ipAddress: "192.168.1.120", status: "success", hash: "g3l1k2j4i9h8g7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2" },
  { id: "8", timestamp: "08/05/2026 12:55:18", user: "Youssef Mansouri", action: "Modification", module: "Organisation", target: "UGP Casablanca", details: "Mise à jour des informations de contact", ipAddress: "192.168.1.125", status: "success", hash: "h4m2l3k5j0i9h8g7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3" },
];

const systemLogs: SystemLog[] = [
  { id: "1", timestamp: "08/05/2026 14:35:00", level: "info", service: "Auth Service", message: "Session utilisateur créée", details: "UserID: 1, SessionDuration: 8h" },
  { id: "2", timestamp: "08/05/2026 14:34:58", level: "debug", service: "API Gateway", message: "Request processed", details: "POST /api/auth/login - 200 OK - 45ms" },
  { id: "3", timestamp: "08/05/2026 14:30:00", level: "info", service: "Scheduler", message: "Tâche planifiée exécutée", details: "Job: daily_backup - Status: completed" },
  { id: "4", timestamp: "08/05/2026 14:25:15", level: "warning", service: "Database", message: "Connexion pool reaching limit", details: "Current: 85/100 connections" },
  { id: "5", timestamp: "08/05/2026 14:20:00", level: "error", service: "Email Service", message: "Échec d'envoi d'email", details: "SMTP timeout - Retry scheduled", stackTrace: "Error: SMTP connection timeout\n    at SMTPClient.connect (smtp.js:142)\n    at EmailService.send (email.js:89)\n    at async NotificationService.notify (notification.js:45)" },
  { id: "6", timestamp: "08/05/2026 14:15:30", level: "info", service: "Cache", message: "Cache invalidated", details: "Key: user_permissions_* - Reason: role_update" },
  { id: "7", timestamp: "08/05/2026 14:10:00", level: "info", service: "API Gateway", message: "Health check passed", details: "All services operational" },
  { id: "8", timestamp: "08/05/2026 14:05:22", level: "warning", service: "Storage", message: "Disk usage alert", details: "Usage: 78% - Threshold: 80%" },
  { id: "9", timestamp: "08/05/2026 13:55:10", level: "error", service: "LDAP Connector", message: "Connection refused", details: "Unable to connect to dc.alomrane.ma:389", stackTrace: "Error: ECONNREFUSED 192.168.1.10:389\n    at LDAPClient.bind (ldap.js:67)\n    at AuthService.authenticate (auth.js:123)" },
];

const customsNomenclatures: CustomsNomenclature[] = [
  { id: "1", code: "8471.30.00", description: "Machines automatiques de traitement de l'information, portables", category: "Équipements informatiques", tariff: "2.5%", lastUpdated: "01/01/2026", status: "active" },
  { id: "2", code: "8517.62.00", description: "Appareils pour la réception, la conversion et la transmission", category: "Télécommunications", tariff: "0%", lastUpdated: "01/01/2026", status: "active" },
  { id: "3", code: "8528.72.00", description: "Appareils récepteurs de télévision, en couleurs", category: "Électronique grand public", tariff: "17.5%", lastUpdated: "15/03/2026", status: "active" },
  { id: "4", code: "9403.20.00", description: "Meubles en métal (mobilier de bureau)", category: "Mobilier", tariff: "25%", lastUpdated: "01/01/2026", status: "active" },
  { id: "5", code: "4820.10.00", description: "Registres, livres comptables, carnets de notes", category: "Fournitures de bureau", tariff: "10%", lastUpdated: "01/01/2026", status: "active" },
  { id: "6", code: "8443.32.00", description: "Imprimantes, machines à copier et télécopieurs", category: "Équipements de bureau", tariff: "2.5%", lastUpdated: "01/01/2026", status: "inactive" },
];

const statusConfig = {
  success: { label: "Succès", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  warning: { label: "Attention", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
  error: { label: "Erreur", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  info: { label: "Info", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Info },
};

const levelConfig = {
  info: { color: "bg-blue-100 text-blue-700 border-blue-200" },
  warning: { color: "bg-amber-100 text-amber-700 border-amber-200" },
  error: { color: "bg-red-100 text-red-700 border-red-200" },
  debug: { color: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "system" | "errors" | "nomenclatures">("audit");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [showLogDetail, setShowLogDetail] = useState<AuditLog | SystemLog | null>(null);
  const [showHashModal, setShowHashModal] = useState(false);
  const [hashTarget, setHashTarget] = useState<AuditLog | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<"pending" | "valid" | "invalid">("pending");

  // Filtres
  const filteredAudit = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === "all" || log.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [searchQuery, selectedStatus]);

  const filteredSystem = useMemo(() => {
    return systemLogs.filter((log) => {
      const matchSearch =
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.service.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = selectedLevel === "all" || log.level === selectedLevel;
      return matchSearch && matchLevel;
    });
  }, [searchQuery, selectedLevel]);

  const errorLogs = useMemo(() => systemLogs.filter((l) => l.level === "error"), []);

  // Statistiques
  const stats = useMemo(
    () => ({
      totalActions: auditLogs.length,
      successCount: auditLogs.filter((l) => l.status === "success").length,
      warningCount: auditLogs.filter((l) => l.status === "warning").length,
      errorCount:
        auditLogs.filter((l) => l.status === "error").length +
        systemLogs.filter((l) => l.level === "error").length,
    }),
    []
  );

  // Actions
  const handleVerifyHash = () => {
    if (!hashTarget) return;
    setIsVerifying(true);
    setVerifyResult("pending");
    setTimeout(() => {
      const valid = Math.random() > 0.1;
      setVerifyResult(valid ? "valid" : "invalid");
      setIsVerifying(false);
      toast[valid ? "success" : "error"](
        valid ? "Hash vérifié, intégrité confirmée." : "Hash invalide !"
      );
    }, 1500);
  };

  const handleVerifyAll = () => {
    toast.info("Vérification de tous les hashs en cours...");
    setTimeout(() => toast.success("Tous les hashs SHA-256 sont valides."), 3000);
  };

  const handleExport = () => toast.success("Export CSV téléchargé.");
  const handleAnalyzeErrors = () => {
    toast.info("Analyse en cours...");
    setTimeout(() => toast.success(`${errorLogs.length} erreurs identifiées.`), 2000);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedLevel("all");
  };

  return (
    <SidebarProvider>
      <SidebarInset>
        <main className="flex-1 p-4 lg:p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
          {/* En-tête */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Audit & Logs Système</h1>
            <p className="text-slate-500">Traçabilité, journaux d'événements et nomenclatures</p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Actions (24h)"
              value={stats.totalActions}
              icon={<Activity className="text-blue-500" />}
            />
            <StatsCard
              title="Succès"
              value={stats.successCount}
              icon={<CheckCircle className="text-emerald-500" />}
            />
            <StatsCard
              title="Alertes"
              value={stats.warningCount}
              icon={<AlertTriangle className="text-amber-500" />}
            />
            <StatsCard
              title="Erreurs"
              value={stats.errorCount}
              icon={<XCircle className="text-red-500" />}
            />
          </div>

          {/* Onglets */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "audit", label: "Audit Trail Global", icon: Shield },
              { key: "system", label: "Logs Système", icon: Server },
              { key: "errors", label: "Journaux d'erreurs", icon: Bug, badge: errorLogs.length },
              { key: "nomenclatures", label: "Nomenclatures Douanières", icon: Package },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "outline"}
                className="gap-2 rounded-xl"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.badge ? (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                    {tab.badge}
                  </Badge>
                ) : null}
              </Button>
            ))}
          </div>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 bg-white rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {activeTab === "audit" && (
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40 rounded-xl">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Attention</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            )}
            {activeTab === "system" && (
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40 rounded-xl">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Effacer
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contenu principal */}
          {activeTab === "audit" && (
            <Card className="shadow-sm border-0 bg-white/90 backdrop-blur overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Audit Trail</CardTitle>
                <CardDescription>{filteredAudit.length} entrées</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Horodatage</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Cible</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudit.map((log) => {
                      const { icon: Icon, color } = statusConfig[log.status];
                      return (
                        <TableRow key={log.id} className="hover:bg-blue-50/30">
                          <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                          <TableCell className="font-medium">{log.user}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.module}</TableCell>
                          <TableCell>{log.target}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", color)}>
                              <Icon className="h-3 w-3" /> {statusConfig[log.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowLogDetail(log)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setHashTarget(log); setShowHashModal(true); setVerifyResult("pending"); }}>
                                <Hash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === "system" && (
            <Card className="shadow-sm border-0 bg-white/90 backdrop-blur overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Logs Système</CardTitle>
                <CardDescription>{filteredSystem.length} entrées</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Horodatage</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSystem.map((log) => (
                      <TableRow key={log.id} className="hover:bg-blue-50/30">
                        <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={levelConfig[log.level].color + " uppercase font-mono"}>
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.service}</TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowLogDetail(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === "errors" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-4">
                <Bug className="h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium">Analyse des erreurs</p>
                  <p className="text-sm text-slate-500">{errorLogs.length} erreur(s) détectée(s)</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleAnalyzeErrors}>
                  Analyser
                </Button>
              </div>
              {errorLogs.map((log) => (
                <Card key={log.id} className="shadow-sm border-0 bg-white/90">
                  <CardHeader className="flex flex-row items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-1" />
                    <div>
                      <CardTitle className="text-base">{log.service}</CardTitle>
                      <CardDescription className="font-mono text-xs">{log.timestamp}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{log.message}</p>
                    {log.details && <p className="text-sm text-slate-500">{log.details}</p>}
                    {log.stackTrace && (
                      <pre className="p-3 rounded-lg bg-slate-50 text-xs font-mono text-red-600 overflow-x-auto">
                        {log.stackTrace}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "nomenclatures" && (
            <Card className="shadow-sm border-0 bg-white/90 backdrop-blur overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Nomenclatures Douanières</CardTitle>
                  <CardDescription>Codes SH et tarifs</CardDescription>
                </div>
                <Button size="sm" onClick={() => toast.success("Synchronisation lancée")}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Synchroniser
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Code SH</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Mise à jour</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customsNomenclatures.map((n) => (
                      <TableRow key={n.id} className="hover:bg-blue-50/30">
                        <TableCell className="font-mono font-medium">{n.code}</TableCell>
                        <TableCell>{n.description}</TableCell>
                        <TableCell>{n.category}</TableCell>
                        <TableCell>{n.tariff}</TableCell>
                        <TableCell>{n.lastUpdated}</TableCell>
                        <TableCell>
                          <Badge variant={n.status === "active" ? "default" : "secondary"}>
                            {n.status === "active" ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Dialogue Détail Log */}
          <Dialog open={!!showLogDetail} onOpenChange={() => setShowLogDetail(null)}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détail du log</DialogTitle>
                <DialogDescription>
                  {showLogDetail ? ("user" in showLogDetail ? "Audit Trail" : "Log Système") : ""}
                </DialogDescription>
              </DialogHeader>
              {showLogDetail && (
                <div className="grid grid-cols-2 gap-4 py-4">
                  {"user" in showLogDetail ? (
                    <>
                      <div><Label>Utilisateur</Label><p>{showLogDetail.user}</p></div>
                      <div><Label>Horodatage</Label><p className="font-mono">{showLogDetail.timestamp}</p></div>
                      <div><Label>Action</Label><p>{showLogDetail.action}</p></div>
                      <div><Label>Module</Label><p>{showLogDetail.module}</p></div>
                      <div><Label>Cible</Label><p>{showLogDetail.target}</p></div>
                      <div><Label>IP</Label><p className="font-mono">{showLogDetail.ipAddress}</p></div>
                      <div className="col-span-2"><Label>Détails</Label><p>{showLogDetail.details}</p></div>
                      <div className="col-span-2 break-all"><Label>Hash SHA-256</Label><p className="font-mono text-xs text-blue-600">{showLogDetail.hash}</p></div>
                    </>
                  ) : (
                    <>
                      <div><Label>Service</Label><p>{showLogDetail.service}</p></div>
                      <div><Label>Horodatage</Label><p className="font-mono">{showLogDetail.timestamp}</p></div>
                      <div className="col-span-2"><Label>Message</Label><p>{showLogDetail.message}</p></div>
                      {showLogDetail.details && <div className="col-span-2"><Label>Détails</Label><p>{showLogDetail.details}</p></div>}
                      {showLogDetail.stackTrace && (
                        <div className="col-span-2"><Label>Stack Trace</Label><pre className="text-xs font-mono text-red-600 bg-red-50 p-2 rounded overflow-x-auto">{showLogDetail.stackTrace}</pre></div>
                      )}
                    </>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLogDetail(null)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialogue Vérification Hash */}
          <Dialog open={showHashModal} onOpenChange={setShowHashModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Vérification SHA-256</DialogTitle>
                <DialogDescription>
                  {hashTarget ? `Log #${hashTarget.id} - ${hashTarget.action}` : ""}
                </DialogDescription>
              </DialogHeader>
              {hashTarget && (
                <div className="space-y-4 py-4">
                  <div className="p-3 rounded bg-slate-50 break-all text-xs font-mono">{hashTarget.hash}</div>
                  {verifyResult !== "pending" && (
                    <div className={verifyResult === "valid" ? "p-3 rounded bg-emerald-50 text-emerald-700 flex items-center gap-2" : "p-3 rounded bg-red-50 text-red-700 flex items-center gap-2"}>
                      {verifyResult === "valid" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      {verifyResult === "valid" ? "Intégrité confirmée" : "Hash invalide"}
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowHashModal(false)}>Annuler</Button>
                <Button onClick={handleVerifyHash} disabled={isVerifying}>
                  {isVerifying ? "Vérification..." : "Vérifier"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Composant carte statistique
function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
      </CardContent>
    </Card>
  );
}