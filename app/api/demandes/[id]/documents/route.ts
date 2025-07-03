import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params

    // Vérifier que la demande existe et que l'utilisateur a accès
    const { data: demande, error: demandeError } = await supabase
      .from('demandes')
      .select(`
        *,
        stagiaire:stagiaires(
          user_id,
          users(name, email, role)
        )
      `)
      .eq('id', id)
      .single()

    if (demandeError || !demande) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 })
    }

    // Vérifier les permissions
    const userProfile = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const canAccess = 
      userProfile.data?.role === 'admin' ||
      userProfile.data?.role === 'rh' ||
      demande.stagiaire?.user_id === user.id

    if (!canAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer les documents liés à cette demande
    const { data: documentsLies, error: documentsError } = await supabase
      .from('demande_documents')
      .select(`
        *,
        document:documents(
          id,
          nom,
          type,
          taille,
          url,
          type_fichier,
          created_at
        )
      `)
      .eq('demande_id', id)

    if (documentsError) {
      console.error('Erreur récupération documents:', documentsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des documents' }, { status: 500 })
    }

    // Formater la réponse
    const documents = documentsLies?.map(dl => ({
      ...dl.document,
      type_document_demande: dl.type_document,
      obligatoire: dl.obligatoire
    })) || []

    return NextResponse.json({
      demande_id: id,
      documents,
      total: documents.length
    })

  } catch (error) {
    console.error('Erreur API documents demande:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params
    const { documents, ...rest } = await request.json()
    const documents_requis = Array.isArray(documents) ? documents : []

    // Vérification explicite des champs attendus
    const insertions = documents_requis.map(doc => {
      if (!doc.type) {
        throw new Error("Chaque document doit avoir un champ 'type'")
      }
      // document_id peut être null si non fourni
      return {
        id: crypto.randomUUID(),
        demande_id: id,
        document_id: doc.document_id ?? null,
        type_document: doc.type,
        obligatoire: doc.obligatoire ?? false,
        created_at: new Date().toISOString()
      }
    })

    // Vérifier que la demande appartient à l'utilisateur
    const { data: demande, error: demandeError } = await supabase
      .from('demandes')
      .select(`
        *,
        stagiaire:stagiaires(user_id)
      `)
      .eq('id', id)
      .single()

    if (demandeError || !demande) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 })
    }

    if (demande.stagiaire?.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Insertion des liaisons document-demande
    const { data: liens, error: liensError } = await supabase
      .from('demande_documents')
      .insert(insertions)
      .select()

    if (liensError) {
      console.error('Erreur création liens:', liensError)
      return NextResponse.json({ error: 'Erreur lors de la liaison des documents' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Documents liés avec succès',
      liens
    })

  } catch (error) {
    console.error('Erreur API liaison documents:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}