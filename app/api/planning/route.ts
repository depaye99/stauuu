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
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('planning')
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          user:users!stagiaires_user_id_fkey(name, email)
        ),
        tuteur:users!planning_tuteur_id_fkey(name, email)
      `)
      .order('date_debut', { ascending: true })

    if (stagiaireId) {
      query = query.eq('stagiaire_id', stagiaireId)
    }

    if (tuteurId) {
      query = query.eq('tuteur_id', tuteurId)
    }

    if (startDate) {
      query = query.gte('date_debut', startDate)
    }

    if (endDate) {
      query = query.lte('date_fin', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur get planning:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du planning' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erreur planning:', error)
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

    const planningData = await request.json()

    // Valider les données
    if (!planningData.titre || !planningData.date_debut || !planningData.date_fin) {
      return NextResponse.json(
        { error: 'Titre, date de début et date de fin sont requis' },
        { status: 400 }
      )
    }

    if (new Date(planningData.date_debut) >= new Date(planningData.date_fin)) {
      return NextResponse.json(
        { error: 'La date de début doit être antérieure à la date de fin' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('planning')
      .insert({
        titre: planningData.titre,
        description: planningData.description,
        date_debut: planningData.date_debut,
        date_fin: planningData.date_fin,
        type: planningData.type || 'autre',
        lieu: planningData.lieu,
        status: planningData.status || 'planifie',
        stagiaire_id: planningData.stagiaire_id || null,
        tuteur_id: user.id,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          user:users!stagiaires_user_id_fkey(name, email)
        )
      `)

    if (error) {
      console.error('Erreur create planning:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du planning' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })

  } catch (error) {
    console.error('Erreur create planning:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}