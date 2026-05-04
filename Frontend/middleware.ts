import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques (accessibles sans authentification)
const publicRoutes = ['/login'];

// Routes protégées par rôle (optionnel)
// Si vous voulez une redirection fine selon le rôle, vous pouvez décoder le JWT.
// Ici nous nous contentons de vérifier la présence du token.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Autoriser les routes publiques
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Vérifier la présence du token dans les cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Rediriger vers la page de connexion
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Optionnel : décoder le JWT pour vérifier l'expiration ou rediriger selon le rôle
  // (vous pouvez ajouter cette logique plus tard)

  // Autoriser l'accès
  return NextResponse.next();
}

// Configuration : le middleware s'applique à toutes les routes sauf les ressources statiques
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
};