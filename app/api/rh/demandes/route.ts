import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification et les permissions
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: currentUser } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (!currentUser || currentUser.role !== "rh") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer toutes les demandes avec relations
    const { data: demandes, error } = await supabase
      .from("demandes")
      .select(`
        *,
        stagiaires(
          id,
          entreprise,
          users!user_id(name, email)
        ),
        tuteur:users!tuteur_id(name, email)
      `)
      .order("date_demande", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: demandes })
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
