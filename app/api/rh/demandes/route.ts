import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const statut = searchParams.get("statut")
    const type = searchParams.get("type")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Vérifier l'authentification
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

    // Construire la requête
    let query = supabase
      .from("demandes")
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          entreprise,
          poste,
          user:users!user_id(name, email)
        )
      `)
      .order("date_demande", { ascending: false })
      .range(offset, offset + limit - 1)

    // Appliquer les filtres
    if (statut && statut !== "all") {
      query = query.eq("statut", statut)
    }

    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    const { data: demandes, error, count } = await query

    if (error) {
      console.error("Erreur Supabase:", error)
      throw error
    }

    // Récupérer les statistiques
    const { data: stats } = await supabase
      .from("demandes")
      .select("statut", { count: "exact" })

    const statistiques = {
      total: count || 0,
      en_attente: stats?.filter(d => d.statut === "en_attente").length || 0,
      approuvees: stats?.filter(d => d.statut === "approuvee").length || 0,
      rejetees: stats?.filter(d => d.statut === "rejetee").length || 0,
    }

    return NextResponse.json({
      success: true,
      data: demandes || [],
      statistiques,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { stagiaire_id, type, titre, description } = body
    // Validation
    if (!stagiaire_id || !type || !titre) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Créer la demande
    const { data: demande, error } = await supabase
      .from("demandes")
      .insert([
        {
          stagiaire_id,
          type,
          titre,
          description,
          statut: "en_attente",
          date_demande: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: demande,
      message: "Demande créée avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la création de la demande:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}