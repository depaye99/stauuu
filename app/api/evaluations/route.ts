import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const stagiaireId = searchParams.get('stagiaire_id')
    const tuteurId = searchParams.get('tuteur_id')

    let query = supabase
      .from('evaluations')
      .select(`
        *,
        stagiaire:stagiaires!inner(
          id,
          user_id,
          users!inner(name, email)
        ),
        evaluateur:users!evaluations_evaluateur_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })

    if (stagiaireId) {
      query = query.eq('stagiaire_id', stagiaireId)
    }

    if (tuteurId) {
      query = query.eq('tuteur_id', tuteurId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur get evaluations:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des évaluations' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erreur evaluations:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const evaluationData = await request.json()

    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        ...evaluationData,
        evaluateur_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Erreur create evaluation:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'évaluation' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })

  } catch (error) {
    console.error('Erreur create evaluation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
