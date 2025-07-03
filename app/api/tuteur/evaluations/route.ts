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

    // Vérifier que l'utilisateur est tuteur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'tuteur') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        stagiaire:stagiaires!inner(
          user_id,
          users!inner(name, email)
        )
      `)
      .eq('tuteur_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur get tuteur evaluations:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des évaluations' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erreur tuteur evaluations:', error)
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

    // Vérifier que l'utilisateur est tuteur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'tuteur') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const evaluationData = await request.json()

    // Valider les données
    if (!evaluationData.stagiaire_id || !evaluationData.periode) {
      return NextResponse.json(
        { error: 'ID du stagiaire et période sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que le stagiaire appartient au tuteur
    const { data: stagiaire, error: stagiaireError } = await supabase
      .from('stagiaires')
      .select('id')
      .eq('id', evaluationData.stagiaire_id)
      .eq('tuteur_id', user.id)
      .single()

    if (stagiaireError || !stagiaire) {
      return NextResponse.json(
        { error: 'Stagiaire non trouvé ou non assigné' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        ...evaluationData,
        tuteur_id: user.id,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        stagiaire:stagiaires!inner(
          user_id,
          users!inner(name, email)
        )
      `)

    if (error) {
      console.error('Erreur create tuteur evaluation:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'évaluation' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })

  } catch (error) {
    console.error('Erreur create tuteur evaluation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
