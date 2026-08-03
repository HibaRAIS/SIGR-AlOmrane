"use client"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Bot,
  User,
  Settings,
  Sparkles,
  MessageSquare,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Zap,
  Brain,
  Shield,
  History,
  X,
  ChevronRight,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  messages: Message[]
}

const suggestedQuestions = [
  "Comment créer un nouvel utilisateur?",
  "Quels sont les rôles disponibles?",
  "Comment exporter les données des employés?",
  "Expliquer la structure organisationnelle",
  "Comment configurer les notifications?",
  "Quelles sont les meilleures pratiques de sécurité?",
]

const conversations: Conversation[] = [
  {
    id: "1",
    title: "Gestion des permissions",
    lastMessage: "Pour attribuer un nouveau rôle...",
    timestamp: "Il y a 2 heures",
    messages: [
      { id: "1-1", role: "user", content: "Comment attribuer un nouveau rôle à un utilisateur?", timestamp: "14:30" },
      { id: "1-2", role: "assistant", content: "Pour attribuer un nouveau rôle à un utilisateur, suivez ces étapes:\n\n1. Allez dans **Gestion Utilisateurs**\n2. Sélectionnez l'utilisateur concerné\n3. Cliquez sur **Modifier**\n4. Dans le champ 'Rôle', sélectionnez le nouveau rôle\n5. Validez les modifications\n\nVous pouvez également utiliser la page **Rôles & Permissions** pour faire une attribution rapide.", timestamp: "14:31" },
    ]
  },
  {
    id: "2",
    title: "Export de données",
    lastMessage: "L'export peut être effectué...",
    timestamp: "Hier",
    messages: []
  },
  {
    id: "3",
    title: "Configuration SMTP",
    lastMessage: "Les paramètres SMTP se trouvent...",
    timestamp: "Il y a 3 jours",
    messages: []
  },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Bonjour! Je suis l'assistant IA du système SIGR d'Al Omrane. Je suis là pour vous aider avec:\n\n- **Gestion des utilisateurs** et des accès\n- **Configuration** du système\n- **Rapports** et analyses\n- **Questions techniques**\n\nComment puis-je vous aider aujourd'hui?",
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateResponse(input),
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateResponse = (query: string): string => {
    const lowercaseQuery = query.toLowerCase()
    
    if (lowercaseQuery.includes("utilisateur") || lowercaseQuery.includes("créer")) {
      return "Pour créer un nouvel utilisateur:\n\n1. Accédez à **Gestion des Utilisateurs** dans le menu\n2. Cliquez sur le bouton **Ajouter**\n3. Remplissez le formulaire avec les informations requises:\n   - Nom et prénom\n   - Email professionnel\n   - Rôle attribué\n   - Département\n4. Activez l'option **Envoyer une invitation** si vous souhaitez que l'utilisateur reçoive un email\n5. Cliquez sur **Créer Utilisateur**\n\nL'utilisateur recevra ses identifiants par email."
    }
    
    if (lowercaseQuery.includes("rôle") || lowercaseQuery.includes("permission")) {
      return "Le système SIGR dispose de 4 rôles prédéfinis:\n\n**1. Admin**\n- Accès complet à toutes les fonctionnalités\n- Gestion des utilisateurs et permissions\n- Configuration du système\n\n**2. Chef de Service**\n- Gestion de son équipe\n- Validation des demandes\n- Accès aux rapports\n\n**3. Employé**\n- Accès de base\n- Consultation des informations\n\n**4. Responsable Logistique**\n- Gestion des ressources\n- Suivi logistique\n\nVous pouvez modifier les permissions de chaque rôle dans **Rôles & Permissions**."
    }
    
    if (lowercaseQuery.includes("export") || lowercaseQuery.includes("données")) {
      return "Pour exporter des données:\n\n1. Accédez à la section concernée (Utilisateurs, Employés, etc.)\n2. Utilisez les filtres pour sélectionner les données souhaitées\n3. Cliquez sur le bouton **Exporter**\n4. Choisissez le format:\n   - **Excel (.xlsx)** - pour les analyses\n   - **CSV** - pour l'importation\n   - **PDF** - pour les rapports\n\n⚠️ Note: L'export de données sensibles nécessite une permission spéciale."
    }
    
    if (lowercaseQuery.includes("structure") || lowercaseQuery.includes("organisation")) {
      return "La structure organisationnelle d'Al Omrane comprend:\n\n**Niveaux hiérarchiques:**\n1. **Directions** - Niveau stratégique\n2. **Départements** - Unités fonctionnelles\n3. **Divisions** - Sous-unités spécialisées\n4. **UGP** - Unités de Gestion de Projets\n5. **Agences** - Représentations régionales\n\nPour modifier la structure, accédez à **Structure Organisation** dans le menu et utilisez les options d'ajout/modification."
    }
    
    return "Je comprends votre question. Voici quelques ressources qui pourraient vous aider:\n\n1. Consultez la **documentation** dans les paramètres\n2. Vérifiez les **tutoriels** disponibles\n3. Contactez le **support technique** si nécessaire\n\nPuis-je vous aider avec autre chose?"
  }

  const handleSuggestionClick = (question: string) => {
    setInput(question)
  }

  const clearConversation = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Conversation effacée. Comment puis-je vous aider?",
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }])
  }

  return (
    <div className="min-h-screen flex flex-col">

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - History */}
        <div className={cn(
          "w-72 border-r border-border bg-card flex-shrink-0 flex flex-col transition-all duration-300",
          showHistory ? "translate-x-0" : "-translate-x-full lg:translate-x-0 absolute lg:relative z-10 h-full"
        )}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Historique</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <MessageSquare className="h-4 w-4" />
              Nouvelle conversation
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{conv.timestamp}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <History className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Assistant SIGR</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    En ligne
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearConversation}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Effacer la conversation"
              >
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Paramètres"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}>
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[75%] rounded-xl p-4",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  <div 
                    className={cn(
                      "text-sm whitespace-pre-wrap",
                      message.role === "user" ? "text-primary-foreground" : "text-foreground"
                    )}
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br>')
                    }}
                  />
                  <div className={cn(
                    "flex items-center gap-3 mt-2 pt-2 border-t",
                    message.role === "user" 
                      ? "border-primary-foreground/20"
                      : "border-border"
                  )}>
                    <span className={cn(
                      "text-xs",
                      message.role === "user" 
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}>
                      {message.timestamp}
                    </span>
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1 ml-auto">
                        <button className="p-1 rounded hover:bg-background/50 transition-colors">
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-1 rounded hover:bg-background/50 transition-colors">
                          <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-1 rounded hover:bg-background/50 transition-colors">
                          <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-sm text-muted-foreground mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Posez votre question..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              L&apos;assistant peut faire des erreurs. Vérifiez les informations importantes.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 rounded-xl bg-card border border-border shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Paramètres de l&apos;Assistant</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Modèle IA</label>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>GPT-4o (Recommandé)</option>
                  <option>GPT-4o Mini (Plus rapide)</option>
                  <option>Claude 3.5 Sonnet</option>
                </select>
              </div>

              {/* Response Style */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Style de réponse</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Concis", "Équilibré", "Détaillé"].map((style) => (
                    <button
                      key={style}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        style === "Équilibré"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">Fonctionnalités</label>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Mémoire de contexte</p>
                      <p className="text-xs text-muted-foreground">Se souvenir des conversations précédentes</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-chart-4" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Suggestions intelligentes</p>
                      <p className="text-xs text-muted-foreground">Proposer des questions pertinentes</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-chart-3" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Mode confidentiel</p>
                      <p className="text-xs text-muted-foreground">Ne pas enregistrer les conversations</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
