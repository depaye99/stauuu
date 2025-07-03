import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

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

    // Vérifier que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID demande invalide" }, { status: 400 })
    }

    // Récupérer la demande avec les informations du stagiaire
    const { data: demande, error } = await supabase
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
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Erreur Supabase:", error)
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
      }
      throw error
    }

    // Récupérer les documents associés séparément
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select(`
        id,
        nom,
        type,
        type_fichier,
        taille,
        chemin_fichier,
        created_at
      `)
      .eq("demande_id", params.id)

    if (documentsError) {
      console.error("Erreur documents:", documentsError)
    }

    // Ajouter les documents à la demande
    const demandeWithDocuments = {
      ...demande,
      documents: documents || []
    }

    return NextResponse.json({ success: true, data: demandeWithDocuments })
  } catch (error) {
    console.error("Erreur lors de la récupération de la demande:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

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

    // Vérifier que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID demande invalide" }, { status: 400 })
    }

    const body = await request.json()
    const { statut, commentaire_rh } = body

    // Validation
    if (!statut || !["approuvee", "rejetee"].includes(statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }

    // Mettre à jour la demande
    const { data: demande, error } = await supabase
      .from("demandes")
      .update({
        statut,
        commentaire_rh,
        date_traitement: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          entreprise,
          poste,
          user:users!user_id(name, email)
        )
      `)
      .single()

    if (error) {
      console.error("Erreur mise à jour:", error)
      throw error
    }

    // Créer une notification pour le stagiaire
    if (demande.stagiaire_id) {
      await supabase.from("notifications").insert({
        user_id: demande.stagiaire_id,
        type: "demande_traitee",
        titre: `Demande ${statut === "approuvee" ? "approuvée" : "rejetée"}`,
        message: `Votre demande "${demande.type}" a été ${statut === "approuvee" ? "approuvée" : "rejetée"} par les RH.`,
        metadata: { demande_id: demande.id },
      })
    }

    return NextResponse.json({
      success: true,
      data: demande,
      message: `Demande ${statut === "approuvee" ? "approuvée" : "rejetée"} avec succès`,
    })
  } catch (error) {
    console.error("Erreur lors du traitement de la demande:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}