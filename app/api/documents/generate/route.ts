import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { demandeId, templateType } = await request.json()

    // Récupérer les données de la demande
    const { data: demande, error } = await supabase
      .from("demandes")
      .select(`
        *,
        stagiaire:stagiaires(
          *,
          user:users(*)
        )
      `)
      .eq("id", demandeId)
      .single()

    if (error || !demande) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
    }

    // Générer le document selon le type
    let documentContent = ""
    let fileName = ""

    switch (templateType) {
      case "convention":
        documentContent = generateConventionPDF(demande)
        fileName = `convention_${demande.stagiaire.user.first_name}_${demande.stagiaire.user.last_name}.pdf`
        break
      case "attestation":
        documentContent = generateAttestationPDF(demande)
        fileName = `attestation_${demande.stagiaire.user.first_name}_${demande.stagiaire.user.last_name}.pdf`
        break
      default:
        return NextResponse.json({ error: "Type de document non supporté" }, { status: 400 })
    }

    // Sauvegarder le document généré
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: demande.stagiaire.user_id,
        demande_id: demandeId,
        nom: fileName,
        type: templateType,
        taille: documentContent.length,
        chemin: `generated/${fileName}`,
        statut: "genere",
      })
      .select()
      .single()

    if (docError) {
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document,
      downloadUrl: `/api/documents/download/${document.id}`,
    })
  } catch (error) {
    console.error("Erreur génération document:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

function generateConventionPDF(demande: any): string {
  // Logique de génération PDF pour convention
  return `Convention de stage pour ${demande.stagiaire.user.first_name} ${demande.stagiaire.user.last_name}`
}

function generateAttestationPDF(demande: any): string {
  // Logique de génération PDF pour attestation
  return `Attestation de stage pour ${demande.stagiaire.user.first_name} ${demande.stagiaire.user.last_name}`
}
