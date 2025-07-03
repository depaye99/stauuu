import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    // Récupérer le profil utilisateur
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    let query = supabase
      .from("documents")
      .select(`
        *,
        users!inner(
          id,
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    // Filtrer selon les permissions
    if (userProfile?.role === 'admin' || userProfile?.role === 'rh') {
      // Admin et RH peuvent voir tous les documents
      if (userId) {
        query = query.eq("user_id", userId)
      }
    } else {
      // Utilisateurs normaux ne voient que leurs documents ou les documents publics
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
      if (userId && userId !== user.id) {
        query = query.eq("is_public", true)
      }
    }

    const { data: documents, error } = await query

    if (error) {
      console.error("Erreur lors de la récupération des documents:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des documents" }, { status: 500 })
    }

    return NextResponse.json({ data: documents })

  } catch (error) {
    console.error("Erreur API documents:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const nom = formData.get('nom') as string
    const type = formData.get('type') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('is_public') === 'true'

    if (!file || !nom) {
      return NextResponse.json({ error: "Fichier et nom requis" }, { status: 400 })
    }

    // Validation du fichier
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 50MB)" }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 })
    }

    // Générer un nom unique pour le fichier
    const timestamp = Date.now()
    const fileName = `${user.id}/${timestamp}-${file.name}`

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error("Erreur upload storage:", uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload du fichier" }, { status: 500 })
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // Enregistrer dans la base de données
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        nom,
        type: type || 'autre',
        description,
        chemin_fichier: fileName,
        url: urlData.publicUrl,
        taille: file.size,
        type_fichier: file.type,
        user_id: user.id,
        is_public: isPublic
      })
      .select()
      .single()

    if (dbError) {
      console.error("Erreur insertion DB:", dbError)
      // Nettoyer le fichier uploadé en cas d'erreur
      await supabase.storage.from('documents').remove([fileName])
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: document,
      message: "Document uploadé avec succès" 
    })

  } catch (error) {
    console.error("Erreur API documents POST:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}