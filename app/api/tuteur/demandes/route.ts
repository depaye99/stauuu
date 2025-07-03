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

    // Vérifier le rôle tuteur
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "tuteur") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les demandes assignées à ce tuteur
    const { data: demandes, error: demandesError } = await supabase
      .from("demandes")
      .select(`
        id,
        type,
        titre,
        description,
        statut,
        date_demande,
        date_reponse,
        commentaire_reponse,
        documents_requis,
        created_at,
        updated_at,
        stagiaire_id,
        stagiaires!inner (
          id,
          user_id,
          users!inner (
            id,
            name,
            email
          )
        )
      `)
      .eq("tuteur_id", user.id)
      .order("created_at", { ascending: false })

    if (demandesError) {
      console.error("❌ Erreur récupération demandes tuteur:", demandesError)
      return NextResponse.json({
        success: true,
        data: [],
        message: "Aucune demande trouvée"
      })
    }

    return NextResponse.json({
      success: true,
      data: demandes || [],
    })
  } catch (error) {
    console.error("💥 Erreur API demandes tuteur:", error)
    return NextResponse.json({
      success: true,
      data: [],
      message: "Erreur serveur interne"
    })
  }
}
