import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil utilisateur non trouvé" },
        { status: 404 }
      )
    }

    if (profile.role !== "tuteur") {
      return NextResponse.json(
        { error: "Accès non autorisé - rôle tuteur requis" },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!stagiaires_user_id_fkey(id, name, email, phone, is_active)
      `)
      .eq("tuteur_id", user.id)

    if (error) {
      console.error("❌ Erreur récupération stagiaires tuteur:", error)
      return NextResponse.json({
        success: true,
        data: [],
        message: "Aucun stagiaire trouvé"
      })
    }

    return NextResponse.json({
      success: true,
      data: stagiaires || [],
    })
  } catch (error) {
    console.error("💥 Erreur API stagiaires tuteur:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur serveur interne",
      data: []
    }, { status: 500 })
  }
}