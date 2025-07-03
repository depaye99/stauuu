import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("🔍 API Admin Stagiaires - Début de la requête")

    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.log("❌ Pas de session utilisateur:", sessionError?.message)
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    console.log("✅ Session trouvée pour:", session.user.email)

    // Vérifier les permissions admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("❌ Erreur récupération profil:", profileError)
      return NextResponse.json({ success: false, error: "Erreur de vérification des permissions" }, { status: 500 })
    }

    if (!profile || profile.role !== "admin") {
      console.log("❌ Utilisateur non autorisé:", profile?.role)
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    console.log("✅ Utilisateur admin confirmé")

    // Récupérer tous les stagiaires avec relations
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!stagiaires_user_id_fkey(id, name, email, phone, is_active),
        tuteur:users!stagiaires_tuteur_id_fkey(id, name, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération stagiaires:", error)
      return NextResponse.json(
        { success: false, error: `Erreur lors de la récupération des stagiaires: ${error.message}` },
        { status: 500 },
      )
    }

    console.log("✅ Stagiaires récupérés:", stagiaires?.length || 0)

    return NextResponse.json({ success: true, data: stagiaires || [] })
  } catch (error: any) {
    console.error("💥 Erreur API stagiaires:", error)
    return NextResponse.json({ success: false, error: `Erreur interne du serveur: ${error.message}` }, { status: 500 })
  }
}
