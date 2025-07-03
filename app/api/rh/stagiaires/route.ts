import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error("❌ Auth error RH stagiaires:", authError)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    console.log("✅ RH Stagiaires session:", session.user.email)

    // Vérifier que l'utilisateur est RH ou admin
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!userProfile || !['rh', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    console.log("✅ RH access confirmed")

    // Récupérer tous les stagiaires avec leurs informations
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        id,
        entreprise,
        poste,
        statut,
        date_debut,
        date_fin,
        users!user_id(
          id,
          name,
          email,
          phone
        ),
        tuteur:users!tuteur_id(
          id,
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération stagiaires:", error)
      return NextResponse.json({ 
        success: false,
        error: "Erreur lors de la récupération des stagiaires",
        data: []
      }, { status: 500 })
    }

    console.log("✅ Stagiaires récupérés:", stagiaires?.length || 0)

    return NextResponse.json({
      success: true,
      data: stagiaires || []
    })

  } catch (error: any) {
    console.error("💥 Erreur RH stagiaires:", error)
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 })
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
    const { user_id, tuteur_id, entreprise, poste, date_debut, date_fin, notes } = body

    // Validation
    if (!user_id) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 })
    }

    // Créer le stagiaire
    const { data: stagiaire, error } = await supabase
      .from("stagiaires")
      .insert([
        {
          user_id,
          tuteur_id,
          entreprise,
          poste,
          date_debut,
          date_fin,
          statut: "actif",
          notes,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: stagiaire,
      message: "Stagiaire créé avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la création du stagiaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}