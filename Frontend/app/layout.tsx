import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'SIGR - Al Omrane Agadir',
  description: 'Système de Gouvernance des Ressources - Portail Collaboratif Unifié',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

