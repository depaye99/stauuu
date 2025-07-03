import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API Statistics - Début de la requête")

    const supabase = await createClient()

    // Récupérer les statistiques générales (pas besoin d'auth pour les stats publiques)
    try {
      const [stagiaireCount, demandeCount, documentCount, evaluationCount] = await Promise.all([
        supabase.from("stagiaires").select("id", { count: "exact", head: true }),
        supabase.from("demandes").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("evaluations").select("id", { count: "exact", head: true }),
      ])

      const stats = {
        stagiaires_total: stagiaireCount.count || 0,
        demandes_total: demandeCount.count || 0,
        documents_total: documentCount.count || 0,
        evaluations_total: evaluationCount.count || 0,
      }

      console.log("✅ Statistiques récupérées:", stats)

      return NextResponse.json({
        success: true,
        data: stats,
      })
    } catch (dbError: any) {
      console.error("❌ Erreur base de données:", dbError)

      // Retourner des statistiques par défaut en cas d'erreur
      return NextResponse.json({
        success: true,
        data: {
          stagiaires_total: 0,
          demandes_total: 0,
          documents_total: 0,
          evaluations_total: 0,
        },
      })
    }
  } catch (error: any) {
    console.error("💥 Erreur API Statistics:", error)

    // Retourner des statistiques par défaut en cas d'erreur
    return NextResponse.json({
      success: true,
      data: {
        stagiaires_total: 0,
        demandes_total: 0,
        documents_total: 0,
        evaluations_total: 0,
      },
    })
  }
}
