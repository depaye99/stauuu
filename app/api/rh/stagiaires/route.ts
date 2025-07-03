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

    // Récupérer tous les stagiaires avec leurs informations utilisateur
    const { data: stagiaires, error } = await supabase
      .from('stagiaires')
      .select(`
        *,
        users!inner(
          id,
          name,
          email,
          phone,
          address,
          is_active,
          role
        ),
        tuteur:users!stagiaires_tuteur_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('users.role', 'stagiaire')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: stagiaires })
  } catch (error) {
    console.error("Erreur lors de la récupération des stagiaires:", error)
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
