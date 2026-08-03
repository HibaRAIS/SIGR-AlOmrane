"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  MessageSquare,
  Trash2,
  Copy,
  History,
  X,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

// ------------------------------------------------------------------
// Constantes
// ------------------------------------------------------------------
const SUGGESTED_QUESTIONS = [
  "Combien de produits sont en rupture de stock ?",
  "Quel est le dernier mouvement enregistré ?",
  "Le journal intègre ?",
  "Combien de demandes en attente ?",
  "Quel est le nombre de fournisseurs ?",
  "Explique-moi ce qu'est le PMP",
];

// Historique factice (sera remplacé par une vraie persistance plus tard)
const FAKE_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    title: "Stock et ruptures",
    lastMessage: "Il y a actuellement 3 produit(s) en rupture.",
    timestamp: "Il y a 2 heures",
    messages: [],
  },
  {
    id: "2",
    title: "Suivi des mouvements",
    lastMessage: "Dernier mouvement : MVT-20260629-0012",
    timestamp: "Hier",
    messages: [],
  },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour ! Je suis l'assistant logistique connecté à votre base de données. Je peux vous renseigner sur les stocks, les mouvements, les demandes, les tickets et l'intégrité du journal. Essayez une question !",
      timestamp: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── Envoi d'un message vers le backend ────────────────────────────────
  const handleSend = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await apiClient.post("/chat", { message: content });
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Désolé, je n'arrive pas à répondre pour le moment. Veuillez réessayer.",
          timestamp: new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const clearConversation = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Conversation effacée. Comment puis-je vous aider ?",
        timestamp: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-green-50/30">
      {/* Sidebar - History */}
      <div
        className={cn(
          "w-72 border-r border-border bg-card flex-shrink-0 flex flex-col transition-transform duration-300",
          showHistory
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 absolute lg:relative z-10 h-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-[#1D6F42]/10 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-[#1D6F42]" />
              Historique
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={clearConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#1D6F42] text-white hover:bg-[#155530] transition-colors shadow-sm"
          >
            <MessageSquare className="h-4 w-4" />
            Nouvelle discussion
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {FAKE_CONVERSATIONS.map((conv) => (
            <div
              key={conv.id}
              className="w-full text-left p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conv.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                  {conv.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-muted/30 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#1D6F42]" />
          Assistant connecté
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <History className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1D6F42] to-[#2e8b57] flex items-center justify-center shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Assistant Logistique
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1D6F42] animate-pulse" />
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
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                  message.role === "user"
                    ? "bg-gradient-to-br from-[#1D6F42] to-[#2e8b57] text-white"
                    : "bg-primary/10 text-primary"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm",
                  message.role === "user"
                    ? "bg-gradient-to-br from-[#1D6F42] to-[#155530] text-white"
                    : "bg-card border border-border"
                )}
              >
                <div
                  className={cn(
                    "text-sm whitespace-pre-wrap leading-relaxed",
                    message.role === "user" ? "text-white" : "text-foreground"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br>"),
                  }}
                />
                <div
                  className={cn(
                    "flex items-center gap-3 mt-2 pt-2 border-t",
                    message.role === "user"
                      ? "border-white/20"
                      : "border-border"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs",
                      message.role === "user"
                        ? "text-white/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp}
                  </span>
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        className="p-1 rounded-lg hover:bg-background/50 transition-colors"
                        onClick={() =>
                          navigator.clipboard.writeText(message.content)
                        }
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-5 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#1D6F42]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-6 pb-3">
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#1D6F42]" />
              Suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="px-3 py-1.5 rounded-full text-sm border border-border bg-card hover:bg-[#1D6F42]/5 hover:border-[#1D6F42]/30 text-foreground transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Posez votre question…"
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1D6F42]/30 focus:border-[#1D6F42] resize-none shadow-sm"
                style={{ minHeight: "48px", maxHeight: "120px" }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-gradient-to-r from-[#1D6F42] to-[#2e8b57] text-white hover:from-[#155530] hover:to-[#226b44] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Assistant connecté à votre base de données et à Gemini.
          </p>
        </div>
      </div>
    </div>
  );
}