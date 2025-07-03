import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    // Récupérer les informations du document
    const { data: document, error } = await supabase.from("documents").select("*").eq("id", params.id).single()

    if (error || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const canAccess =
      document.user_id === session.user.id || // Propriétaire
      document.is_public || // Document public
      (profile && ["admin", "rh", "tuteur"].includes(profile.role)) // Rôles autorisés

    if (!canAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Retourner les métadonnées pour la prévisualisation
    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        nom: document.nom,
        type: document.type,
        type_fichier: document.type_fichier,
        taille: document.taille,
        description: document.description,
        created_at: document.created_at,
        url: document.url,
        downloadUrl: `/api/documents/${document.id}/download`,
        contentUrl: `/api/documents/${document.id}/content`,
        canPreview: ["image/", "application/pdf", "text/"].some(type => 
          document.type_fichier?.startsWith(type)
        )
      },
    })
  } catch (error) {
    console.error("Erreur prévisualisation document:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
