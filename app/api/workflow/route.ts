import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { demandeId, action, userId, comments } = await request.json()

    // Récupérer la demande
    const { data: demande, error: demandeError } = await supabase
      .from("demandes")
      .select("*, stagiaire:stagiaires(*)")
      .eq("id", demandeId)
      .single()

    if (demandeError || !demande) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
    }

    // Déterminer le nouveau statut selon l'action
    let newStatus = demande.statut
    switch (action) {
      case "approve":
        newStatus = "approuve"
        break
      case "reject":
        newStatus = "rejete"
        break
      case "request_changes":
        newStatus = "modifications_demandees"
        break
    }

    // Mettre à jour la demande
    const { error: updateError } = await supabase
      .from("demandes")
      .update({
        statut: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", demandeId)

    if (updateError) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    // Créer une notification
    await supabase.from("notifications").insert({
      user_id: demande.stagiaire.user_id,
      titre: `Demande ${newStatus}`,
      message: `Votre demande "${demande.titre}" a été ${newStatus}`,
      type: action === "approve" ? "success" : action === "reject" ? "error" : "warning",
      lue: false,
    })

    // Envoyer email de notification (à implémenter)
    // await sendNotificationEmail(demande.stagiaire.email, newStatus, demande.titre)

    return NextResponse.json({
      success: true,
      message: "Workflow mis à jour avec succès",
      newStatus,
    })
  } catch (error) {
    console.error("Erreur workflow:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
