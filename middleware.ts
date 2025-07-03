import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Routes publiques
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/forgot-password"]
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth")
  const isDevRoute = request.nextUrl.pathname.startsWith("/dev")

  // Permettre l'accès aux routes publiques et API auth
  if (isPublicRoute || isApiAuth) {
    return supabaseResponse
  }

  // Rediriger vers login si pas d'utilisateur
  if (!user && !isDevRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Vérifier les permissions par rôle
  if (user) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const userRole = userProfile?.role || 'stagiaire'
    const pathname = request.nextUrl.pathname

    // Vérifier l'accès aux routes admin
    if (pathname.startsWith("/admin") && userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'rh' ? "/rh" : userRole === 'tuteur' ? "/tuteur" : "/stagiaire"
      return NextResponse.redirect(url)
    }

    // Vérifier l'accès aux routes RH
    if (pathname.startsWith("/rh") && !['admin', 'rh'].includes(userRole)) {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'tuteur' ? "/tuteur" : "/stagiaire"
      return NextResponse.redirect(url)
    }

    // Vérifier l'accès aux routes tuteur
    if (pathname.startsWith("/tuteur") && !['admin', 'rh', 'tuteur'].includes(userRole)) {
      const url = request.nextUrl.clone()
      url.pathname = "/stagiaire"
      return NextResponse.redirect(url)
    }

    // Ajouter des headers de sécurité
    supabaseResponse.headers.set('X-Frame-Options', 'DENY')
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
    supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|images/).*)",
  ],
}