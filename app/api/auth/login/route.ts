import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password } = body

    console.log("🔐 Tentative de connexion pour:", email)

    // Validation des champs requis
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    // Tentative de connexion
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("❌ Erreur auth signin:", authError)

      // Messages d'erreur personnalisés
      if (authError.message.includes("Invalid login credentials")) {
        return NextResponse.json(
          {
            error: `Identifiants invalides pour ${email}. Vérifiez votre email et mot de passe.`,
          },
          { status: 401 },
        )
      }

      if (authError.message.includes("Email not confirmed")) {
        return NextResponse.json(
          {
            error: "Email non confirmé. Vérifiez votre boîte mail.",
          },
          { status: 401 },
        )
      }

      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json({ error: "Erreur de connexion - pas de session créée" }, { status: 401 })
    }

    console.log("✅ Utilisateur connecté avec succès:", authData.user.email)

    // Récupérer le profil utilisateur
    let profile = null
    let userRole = "stagiaire"

    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (!fetchError && existingProfile) {
        profile = existingProfile
        userRole = existingProfile.role
        console.log("👤 Profil trouvé:", profile.email, "rôle:", profile.role)
      } else {
        console.log("⚠️ Profil non trouvé, utilisation des métadonnées")
        userRole = authData.user.user_metadata?.role || "stagiaire"

        profile = {
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
          role: userRole,
          is_active: true,
        }
      }
    } catch (error) {
      console.warn("⚠️ Erreur récupération profil:", error)
      userRole = authData.user.user_metadata?.role || "stagiaire"

      profile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
        role: userRole,
        is_active: true,
      }
    }

    // Déterminer l'URL de redirection
    let redirectPath = "/stagiaire"
    switch (userRole) {
      case "admin":
        redirectPath = "/admin"
        break
      case "rh":
        redirectPath = "/rh"
        break
      case "tuteur":
        redirectPath = "/tuteur"
        break
      default:
        redirectPath = "/stagiaire"
    }

    console.log("🎯 Redirection vers:", redirectPath)

    // Créer une réponse avec les cookies de session
    const response = NextResponse.json({
      success: true,
      user: profile,
      session: authData.session,
      message: "Connexion réussie",
      redirectTo: redirectPath,
    })

    return response
  } catch (error) {
    console.error("❌ Erreur login:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la connexion" }, { status: 500 })
  }
}
