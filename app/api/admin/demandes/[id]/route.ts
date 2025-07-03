import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer la demande avec relations
    const { data: demande, error } = await supabase
      .from("demandes")
      .select(`
        *,
        stagiaires(
          id,
          entreprise,
          poste,
          users!user_id(name, email, phone)
        ),
        tuteur:users!tuteur_id(name, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data: demande })
  } catch (error) {
    console.error("Erreur lors de la récupération de la demande:", error)
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

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { statut, commentaire_reponse } = body

    // Mettre à jour la demande
    const { data: demande, error } = await supabase
      .from("demandes")
      .update({
        statut,
        commentaire_reponse,
        date_reponse: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: demande,
      message: "Demande mise à jour avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la demande:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
