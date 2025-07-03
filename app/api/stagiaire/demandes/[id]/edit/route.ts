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

    // Vérifier que la demande appartient au stagiaire
    const { data: demande, error: checkError } = await supabase
      .from('demandes')
      .select('user_id, statut')
      .eq('id', id)
      .single()

    if (checkError || !demande) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      )
    }

    if (demande.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier cette demande' },
        { status: 403 }
      )
    }

    // Seules les demandes en attente peuvent être modifiées
    if (demande.statut !== 'en_attente') {
      return NextResponse.json(
        { error: 'Cette demande ne peut plus être modifiée' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('demandes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erreur update demande:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Erreur edit demande:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
