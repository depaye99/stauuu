import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params

    // Vérifier que le document existe et appartient à l'utilisateur
    const { data: document, error: checkError } = await supabase
      .from('documents')
      .select('user_id, file_path')
      .eq('id', id)
      .single()

    if (checkError || !document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer ce document' },
        { status: 403 }
      )
    }

    // Supprimer le fichier du storage
    if (document.file_path) {
      await supabase.storage
        .from('documents')
        .remove([document.file_path])
    }

    // Supprimer l'enregistrement de la base de données
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur delete document:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Document supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur delete document:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
