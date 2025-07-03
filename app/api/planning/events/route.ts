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
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    let query = supabase
      .from('planning')
      .select(`
        *,
        stagiaire:stagiaires!inner(
          id,
          users!inner(name, email)
        ),
        tuteur:users!planning_tuteur_id_fkey(name, email)
      `)
      .order('date_debut', { ascending: true })

    if (stagiaireId) {
      query = query.eq('stagiaire_id', stagiaireId)
    }

    if (start) {
      query = query.gte('date_debut', start)
    }

    if (end) {
      query = query.lte('date_fin', end)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur récupération planning:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du planning' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erreur planning events:', error)
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

    const eventData = await request.json()

    const { data, error } = await supabase
      .from('planning')
      .insert({
        ...eventData,
        tuteur_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Erreur création événement:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'événement' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })

  } catch (error) {
    console.error('Erreur création événement:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
