import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const metadataStr = formData.get("metadata") as string
    
    let metadata = { nom: "", type: "autre", description: "" }
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr)
      } catch (e) {
        console.error("Erreur parsing metadata:", e)
      }
    }

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10MB)" }, { status: 400 })
    }

    // Types de fichiers autorisés
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Type de fichier non autorisé. Formats acceptés : PDF, DOC, DOCX, JPG, PNG" 
      }, { status: 400 })
    }

    // Générer un nom de fichier sécurisé
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `documents/${user.id}/${fileName}`

    try {
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error("Erreur upload storage:", uploadError)
        return NextResponse.json({ 
          error: "Erreur lors de l'upload: " + uploadError.message 
        }, { status: 500 })
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath)

      // Sauvegarder en base
      const { data: document, error: dbError } = await supabase
        .from("documents")
        .insert({
          nom: metadata.nom || file.name,
          type: metadata.type || "autre",
          description: metadata.description || "",
          chemin_fichier: filePath,
          url: publicUrl,
          taille: file.size,
          type_fichier: file.type,
          user_id: user.id,
          statut: "approuve",
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.error("Erreur sauvegarde document:", dbError)
        // Supprimer le fichier uploadé en cas d'erreur
        await supabase.storage.from("documents").remove([filePath])
        return NextResponse.json({ 
          error: "Erreur lors de la sauvegarde: " + dbError.message 
        }, { status: 500 })
      }

      console.log("✅ Document uploadé avec succès:", document.id)

      return NextResponse.json({ 
        success: true, 
        data: { url: publicUrl }, // Pour compatibilité front
        document: {
          id: document.id,
          url: publicUrl,
          nom: document.nom,
          type: document.type,
          taille: document.taille
        },
        message: "Document uploadé avec succès"
      })

    } catch (storageError) {
      console.error("Erreur storage:", storageError)
      return NextResponse.json({ 
        error: "Erreur lors de l'upload vers le stockage" 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("Erreur upload document:", error)
    return NextResponse.json({ 
      error: "Erreur interne: " + error.message 
    }, { status: 500 })
  }
}
