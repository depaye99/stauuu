
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = params

    // Récupérer le document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const canAccess = 
      document.user_id === user.id ||
      document.is_public ||
      userProfile?.role === 'admin' ||
      userProfile?.role === 'rh'

    if (!canAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Télécharger le fichier depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.chemin_fichier)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 })
    }

    // Retourner le fichier
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': document.type_fichier || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.nom}"`,
      },
    })

  } catch (error) {
    console.error("Erreur téléchargement document:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
