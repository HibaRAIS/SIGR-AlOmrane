"use client"

import { useState } from "react"
import {
  Settings,
  Shield,
  Bell,
  Database,
  Mail,
  Lock,
  Globe,
  Palette,
  Clock,
  Save,
  RefreshCw,
  CheckCircle,
  Server,
  Key,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingSection {
  id: string
  name: string
  icon: React.ElementType
  description: string
}

const sections: SettingSection[] = [
  { id: "general", name: "Général", icon: Settings, description: "Paramètres généraux de l'application" },
  { id: "security", name: "Sécurité", icon: Shield, description: "Politique de sécurité et authentification" },
  { id: "notifications", name: "Notifications", icon: Bell, description: "Configuration des alertes et notifications" },
  { id: "database", name: "Base de données", icon: Database, description: "Sauvegarde et maintenance" },
  { id: "email", name: "Email", icon: Mail, description: "Configuration SMTP et templates" },
  { id: "api", name: "API & Intégrations", icon: Key, description: "Clés API et intégrations externes" },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1500)
  }

  return (
    <div className="min-h-screen">

      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="rounded-xl border border-border bg-card p-2 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{section.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="rounded-xl border border-border bg-card">
              {/* Section Header */}
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  {sections.find(s => s.id === activeSection)?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sections.find(s => s.id === activeSection)?.description}
                </p>
              </div>

              {/* Settings Content */}
              <div className="p-6 space-y-6">
                {activeSection === "general" && (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Nom de l&apos;application
                        </label>
                        <input
                          type="text"
                          defaultValue="SIGR Al Omrane"
                          className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Description
                        </label>
                        <textarea
                          defaultValue="Système d'Information de Gestion des Risques"
                          rows={3}
                          className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Fuseau horaire
                        </label>
                        <select className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                          <option value="Europe/Paris">Europe/Paris (GMT+2)</option>
                          <option value="UTC">UTC (GMT+0)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Langue par défaut
                        </label>
                        <select className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="fr">Français</option>
                          <option value="ar">العربية</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Format de date
                        </label>
                        <select className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "security" && (
                  <>
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">Authentification à deux facteurs (2FA)</h3>
                            <p className="text-sm text-muted-foreground">Exiger la 2FA pour tous les utilisateurs admin</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">Verrouillage de compte</h3>
                            <p className="text-sm text-muted-foreground">Verrouiller après 5 tentatives échouées</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Durée de session (heures)
                        </label>
                        <input
                          type="number"
                          defaultValue="8"
                          min="1"
                          max="24"
                          className="w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Politique de mot de passe
                        </label>
                        <div className="space-y-2 max-w-md">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-border" />
                            <span className="text-sm text-foreground">Minimum 8 caractères</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-border" />
                            <span className="text-sm text-foreground">Au moins une majuscule</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-border" />
                            <span className="text-sm text-foreground">Au moins un chiffre</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-border" />
                            <span className="text-sm text-foreground">Au moins un caractère spécial</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Expiration du mot de passe (jours)
                        </label>
                        <input
                          type="number"
                          defaultValue="90"
                          min="30"
                          max="365"
                          className="w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "notifications" && (
                  <>
                    <div className="space-y-6">
                      <h3 className="text-sm font-medium text-foreground">Notifications par email</h3>
                      
                      <div className="space-y-3">
                        {[
                          { id: "login", label: "Nouvelle connexion", desc: "Notifier lors d'une connexion depuis un nouvel appareil" },
                          { id: "user_created", label: "Création d'utilisateur", desc: "Notifier les admins lors de la création d'un compte" },
                          { id: "permission_change", label: "Changement de permissions", desc: "Notifier lors de modifications de rôles" },
                          { id: "security_alert", label: "Alertes de sécurité", desc: "Notifier en cas de tentatives suspectes" },
                          { id: "backup", label: "Statut des sauvegardes", desc: "Rapport quotidien des sauvegardes" },
                        ].map((notif) => (
                          <div key={notif.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                            <div>
                              <p className="font-medium text-foreground">{notif.label}</p>
                              <p className="text-sm text-muted-foreground">{notif.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "database" && (
                  <>
                    <div className="space-y-6">
                      {/* Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span className="font-medium text-foreground">Connectée</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Base de données principale</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                          <p className="text-sm text-muted-foreground">Dernière sauvegarde</p>
                          <p className="font-medium text-foreground">08/05/2026 14:30</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                          <p className="text-sm text-muted-foreground">Taille de la base</p>
                          <p className="font-medium text-foreground">2.4 GB</p>
                        </div>
                      </div>

                      {/* Backup Settings */}
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Sauvegardes automatiques</h3>
                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="block text-sm text-muted-foreground mb-1.5">Fréquence</label>
                            <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                              <option>Toutes les 6 heures</option>
                              <option>Toutes les 12 heures</option>
                              <option>Quotidienne</option>
                              <option>Hebdomadaire</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-muted-foreground mb-1.5">Rétention (jours)</label>
                            <input
                              type="number"
                              defaultValue="30"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                          <Database className="h-4 w-4" />
                          Sauvegarder maintenant
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors">
                          <RefreshCw className="h-4 w-4" />
                          Restaurer
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "email" && (
                  <>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Serveur SMTP</label>
                          <input
                            type="text"
                            defaultValue="smtp.alomrane.ma"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Port</label>
                          <input
                            type="number"
                            defaultValue="587"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Utilisateur SMTP</label>
                          <input
                            type="text"
                            defaultValue="noreply@alomrane.ma"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Mot de passe SMTP</label>
                          <input
                            type="password"
                            defaultValue="••••••••"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="max-w-2xl">
                        <label className="block text-sm font-medium text-foreground mb-1.5">Email de l&apos;expéditeur</label>
                        <input
                          type="email"
                          defaultValue="noreply@alomrane.ma"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50 border border-border flex items-center justify-between max-w-2xl">
                        <div>
                          <h3 className="font-medium text-foreground">Utiliser TLS/SSL</h3>
                          <p className="text-sm text-muted-foreground">Chiffrer les communications email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>

                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors">
                        <Mail className="h-4 w-4" />
                        Envoyer un email de test
                      </button>
                    </div>
                  </>
                )}

                {activeSection === "api" && (
                  <>
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg bg-chart-4/5 border border-chart-4/20">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-chart-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-foreground">Attention</h3>
                            <p className="text-sm text-muted-foreground">
                              Ne partagez jamais vos clés API. Régénérez-les immédiatement en cas de compromission.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Clés API</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                            <div>
                              <p className="font-medium text-foreground">Clé API Production</p>
                              <p className="text-sm font-mono text-muted-foreground">sk_prod_••••••••••••••••</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors">
                                Copier
                              </button>
                              <button className="px-3 py-1.5 text-sm rounded-lg border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                                Régénérer
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                            <div>
                              <p className="font-medium text-foreground">Clé API Test</p>
                              <p className="text-sm font-mono text-muted-foreground">sk_test_••••••••••••••••</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors">
                                Copier
                              </button>
                              <button className="px-3 py-1.5 text-sm rounded-lg border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                                Régénérer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Intégrations actives</h3>
                        <div className="space-y-3">
                          {[
                            { name: "Active Directory", status: "connected", icon: Shield },
                            { name: "Service Email", status: "connected", icon: Mail },
                            { name: "Stockage Cloud", status: "disconnected", icon: Database },
                          ].map((integration) => (
                            <div key={integration.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div className="flex items-center gap-3">
                                <integration.icon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{integration.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {integration.status === "connected" ? "Connecté" : "Non connecté"}
                                  </p>
                                </div>
                              </div>
                              <div className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                integration.status === "connected" ? "bg-primary" : "bg-muted-foreground"
                              )} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Save Button */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
