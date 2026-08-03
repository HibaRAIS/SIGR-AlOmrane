'use client';

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  ShieldCheck,
  Building2,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
} from "lucide-react";

export default function Page() {
  return <Index />;
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <BrandLogo />

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#modules"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Modules
            </a>

            <a
              href="#workflow"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Workflow
            </a>

            <a
              href="#securite"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sécurité
            </a>
          </nav>

          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/login">
              Se connecter
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            background: "var(--gradient-hero)",
          }}
        />

        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_60%)] opacity-[0.08]" />

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            {/* ================= LEFT CONTENT ================= */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Groupe Al Omrane · Transformation digitale
              </div>

              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
                La plateforme ERP de référence du{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "var(--gradient-brand)",
                  }}
                >
                  Groupe Al Omrane
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Pilotez la logistique, les stocks, les workflows
                d&apos;approbation et les reportings institutionnels avec un
                système conçu pour les standards de l&apos;administration
                publique marocaine.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90"
                >
                  <Link href="/login">
                    Accéder à la plateforme
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button size="lg" variant="outline">
                  Demander une démo
                </Button>
              </div>

              {/* ================= STATS ================= */}
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
                {[
                  {
                    k: "120+",
                    v: "Agences connectées",
                  },
                  {
                    k: "99.9%",
                    v: "Disponibilité",
                  },
                  {
                    k: "ISO 27001",
                    v: "Sécurité",
                  },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="font-display text-2xl font-bold text-foreground">
                      {s.k}
                    </div>

                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= RIGHT CARD ================= */}
            <div className="relative">
              <div
                className="absolute -inset-6 -z-10 rounded-[2rem] opacity-30 blur-3xl"
                style={{
                  background: "var(--gradient-brand)",
                }}
              />

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
                {/* TOP BAR */}
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>

                  <span className="text-xs font-medium text-muted-foreground">
                    tableau-de-bord · logistique
                  </span>
                </div>

                {/* CARDS */}
                <div className="grid grid-cols-3 gap-3 p-5">
                  <StatTile
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label="Validés"
                    value="248"
                    tone="success"
                  />

                  <StatTile
                    icon={<Clock className="h-4 w-4" />}
                    label="En attente"
                    value="36"
                    tone="warning"
                  />

                  <StatTile
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label="Critiques"
                    value="4"
                    tone="destructive"
                  />
                </div>

                {/* CHART */}
                <div className="px-5 pb-5">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        Mouvements de stock
                      </span>

                      <span className="text-xs text-muted-foreground">
                        7 derniers jours
                      </span>
                    </div>

                    <div className="flex h-28 items-end gap-1.5">
                      {[40, 65, 48, 80, 55, 92, 70].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${h}%`,
                            background: "var(--gradient-brand)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ACTIVITY */}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Building2 className="h-4 w-4" />
                      </div>

                      <div>
                        <div className="text-sm font-medium text-foreground">
                          Bon de sortie #BS-2048
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Agence Casablanca · il y a 2 min
                        </div>
                      </div>
                    </div>

                    <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                      Validé
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MODULES ================= */}
      <section
        id="modules"
        className="border-t border-border bg-card/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Modules ERP
            </span>

            <h2 className="mt-3 font-display text-4xl font-bold text-foreground">
              Une suite complète pour vos opérations
            </h2>

            <p className="mt-3 text-muted-foreground">
              Conçue pour les exigences d&apos;un établissement public marocain :
              traçabilité, auditabilité et reporting institutionnel.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Building2,
                title: "Logistique & Stocks",
                desc: "Bons d'entrée, bons de sortie, inventaires multi-agences.",
              },
              {
                icon: ShieldCheck,
                title: "Workflows & Approbations",
                desc: "Circuits de validation conformes aux procédures internes.",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reporting",
                desc: "Tableaux de bord institutionnels et rapports annuels.",
              },
              {
                icon: CheckCircle2,
                title: "Gestion des bons",
                desc: "Génération PDF officielle avec en-tête et signatures.",
              },
              {
                icon: Lock,
                title: "Sécurité & RBAC",
                desc: "Contrôle d'accès granulaire par rôle et par agence.",
              },
              {
                icon: AlertTriangle,
                title: "Alertes & Seuils",
                desc: "Notifications temps réel sur ruptures et anomalies.",
              },
            ].map((m) => (
              <div
                key={m.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <m.icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                  {m.title}
                </h3>

                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <BrandLogo size="sm" />

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Groupe Al Omrane · Plateforme ERP
            institutionnelle
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ================= BRAND LOGO ================= */

function BrandLogo({
  size = "md",
}: {
  size?: "sm" | "md";
}) {
  const dimensions =
    size === "sm"
      ? {
          width: 38,
          height: 38,
          text: "text-base",
        }
      : {
          width: 48,
          height: 48,
          text: "text-lg",
        };

  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-white p-1 shadow-sm">
        <Image
          src="/images/alomrane-logo.png"
          alt="Logo Al Omrane"
          width={dimensions.width}
          height={dimensions.height}
          priority
          className="object-contain"
        />
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={`font-display font-bold tracking-tight text-foreground ${dimensions.text}`}
        >
          Al Omrane
        </span>

        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          ERP Institutionnel
        </span>
      </div>
    </Link>
  );
}

/* ================= STAT TILE ================= */

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive";
}) {
  const tones = {
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    destructive: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${tones[tone]}`}
      >
        {icon}
      </div>

      <div className="mt-2 font-display text-2xl font-bold text-foreground">
        {value}
      </div>

      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}