import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID stagiaire invalide" }, { status: 400 })
    }

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

    // Récupérer le stagiaire avec relations
    const { data: stagiaire, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!user_id(id, name, email, phone),
        tuteur:users!tuteur_id(id, name, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Stagiaire non trouvé" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data: stagiaire })
  } catch (error) {
    console.error("Erreur lors de la récupération du stagiaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { entreprise, poste, date_debut, date_fin, tuteur_id, statut, notes } = body

    // Validation des champs requis
    if (!entreprise || !poste || !date_debut || !date_fin) {
      return NextResponse.json(
        {
          error: "Les champs entreprise, poste, date de début et date de fin sont obligatoires",
        },
        { status: 400 },
      )
    }

    // Mettre à jour le stagiaire
    const updateData: any = {
      entreprise,
      poste,
      date_debut,
      date_fin,
      statut,
      notes,
      updated_at: new Date().toISOString(),
    }

    if (tuteur_id) {
      updateData.tuteur_id = tuteur_id
    } else {
      updateData.tuteur_id = null
    }

    const { data: stagiaire, error } = await supabase
      .from("stagiaires")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        user:users!user_id(id, name, email, phone),
        tuteur:users!tuteur_id(id, name, email)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: stagiaire,
      message: "Stagiaire mis à jour avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du stagiaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
