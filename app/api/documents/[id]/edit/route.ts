import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
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
    const updateData = await request.json()

    // Vérifier que le document existe et appartient à l'utilisateur
    const { data: document, error: checkError } = await supabase
      .from('documents')
      .select('user_id')
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
        { error: 'Non autorisé à modifier ce document' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('documents')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erreur update document:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Erreur edit document:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
