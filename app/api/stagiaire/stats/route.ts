import { NextResponse } from "next/server"
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
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est stagiaire
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "stagiaire") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les informations du stagiaire
    const { data: stagiaireInfo } = await supabase.from("stagiaires").select("id").eq("user_id", user.id).single()

    if (!stagiaireInfo) {
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    console.log("📊 Récupération des statistiques pour le stagiaire:", stagiaireInfo.id)

    // Récupérer les statistiques
    const [demandesResult, documentsResult, evaluationsResult] = await Promise.all([
      supabase.from("demandes").select("id, statut", { count: "exact" }).eq("stagiaire_id", stagiaireInfo.id),
      supabase.from("documents").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("evaluations").select("id, note_globale", { count: "exact" }).eq("stagiaire_id", stagiaireInfo.id),
    ])

    const stats = {
      demandes_total: demandesResult.count || 0,
      demandes_en_attente: demandesResult.data?.filter((d) => d.statut === "en_attente").length || 0,
      demandes_approuvees: demandesResult.data?.filter((d) => d.statut === "approuvee").length || 0,
      demandes_rejetees: demandesResult.data?.filter((d) => d.statut === "rejetee").length || 0,
      documents_total: documentsResult.count || 0,
      evaluations_total: evaluationsResult.count || 0,
      note_moyenne:
        evaluationsResult.data?.length > 0
          ? evaluationsResult.data.reduce((sum, evaluation) => sum + (evaluation.note_globale || 0), 0) /
            evaluationsResult.data.length
          : 0,
    }

    console.log("✅ Statistiques stagiaire récupérées:", stats)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("💥 Erreur API stats stagiaire:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
