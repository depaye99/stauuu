import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    const { data, error } = await supabase
      .from('planning')
      .select(`
        *,
        stagiaire:stagiaires!inner(
          user_id,
          users!inner(name, email)
        ),
        tuteur:users!planning_tuteur_id_fkey(name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur get planning:', error)
      return NextResponse.json(
        { error: 'Planning non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erreur get planning:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

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

    // Vérifier que le planning appartient au tuteur
    const { data: planning, error: checkError } = await supabase
      .from('planning')
      .select('tuteur_id')
      .eq('id', id)
      .single()

    if (checkError || !planning) {
      return NextResponse.json(
        { error: 'Planning non trouvé' },
        { status: 404 }
      )
    }

    if (planning.tuteur_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier ce planning' },
        { status: 403 }
      )
    }

    // Valider les dates si elles sont modifiées
    if (updateData.date_debut && updateData.date_fin) {
      if (new Date(updateData.date_debut) >= new Date(updateData.date_fin)) {
        return NextResponse.json(
          { error: 'La date de début doit être antérieure à la date de fin' },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('planning')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erreur update planning:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Erreur update planning:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

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

    // Vérifier que le planning appartient au tuteur
    const { data: planning, error: checkError } = await supabase
      .from('planning')
      .select('tuteur_id')
      .eq('id', id)
      .single()

    if (checkError || !planning) {
      return NextResponse.json(
        { error: 'Planning non trouvé' },
        { status: 404 }
      )
    }

    if (planning.tuteur_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer ce planning' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('planning')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur delete planning:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Planning supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur delete planning:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
