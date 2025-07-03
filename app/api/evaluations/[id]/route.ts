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
      .from('evaluations')
      .select(`
        *,
        stagiaire:stagiaires!inner(
          user_id,
          users!inner(name, email)
        ),
        tuteur:users!evaluations_tuteur_id_fkey(name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur get evaluation:', error)
      return NextResponse.json(
        { error: 'Évaluation non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erreur get evaluation:', error)
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

    // Vérifier que l'évaluation appartient au tuteur
    const { data: evaluation, error: checkError } = await supabase
      .from('evaluations')
      .select('tuteur_id')
      .eq('id', id)
      .single()

    if (checkError || !evaluation) {
      return NextResponse.json(
        { error: 'Évaluation non trouvée' },
        { status: 404 }
      )
    }

    if (evaluation.tuteur_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier cette évaluation' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('evaluations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erreur update evaluation:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Erreur update evaluation:', error)
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

    // Vérifier que l'évaluation appartient au tuteur
    const { data: evaluation, error: checkError } = await supabase
      .from('evaluations')
      .select('tuteur_id')
      .eq('id', id)
      .single()

    if (checkError || !evaluation) {
      return NextResponse.json(
        { error: 'Évaluation non trouvée' },
        { status: 404 }
      )
    }

    if (evaluation.tuteur_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer cette évaluation' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur delete evaluation:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Évaluation supprimée avec succès'
    })

  } catch (error) {
    console.error('Erreur delete evaluation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
