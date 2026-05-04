'use client';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { RequestsProvider } from '@/context/RequestsContext';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <CartProvider>
          <RequestsProvider>
            {children}
            <Toaster position="top-right" richColors />
          </RequestsProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}