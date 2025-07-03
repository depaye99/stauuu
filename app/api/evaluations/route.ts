
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      console.error("❌ Erreur auth évaluations:", authError)
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    console.log("✅ Session trouvée pour évaluations:", session.user.email)

    // Vérifier le rôle de l'utilisateur
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    console.log("✅ Rôle utilisateur:", userProfile.role)

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

    // Filtres selon les paramètres
    if (stagiaireId) {
      console.log("🔍 Filtre par stagiaire:", stagiaireId)
      query = query.eq('stagiaire_id', stagiaireId)
    }

    if (tuteurId) {
      console.log("🔍 Filtre par tuteur:", tuteurId)
      query = query.eq('evaluateur_id', tuteurId)
    }

    // Filtres selon le rôle
    if (userProfile.role === 'tuteur') {
      // Les tuteurs ne voient que les évaluations qu'ils ont créées
      query = query.eq('evaluateur_id', session.user.id)
    } else if (userProfile.role === 'stagiaire') {
      // Les stagiaires ne voient que leurs propres évaluations
      const { data: stagiaireProfile } = await supabase
        .from('stagiaires')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
      
      if (stagiaireProfile) {
        query = query.eq('stagiaire_id', stagiaireProfile.id)
      }
    }
    // Les admins et RH voient toutes les évaluations (pas de filtre supplémentaire)

    const { data, error } = await query

    if (error) {
      console.error('❌ Erreur get evaluations:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération des évaluations',
          evaluations: []
        },
        { status: 500 }
      )
    }

    console.log("✅ Évaluations récupérées:", data?.length || 0)

    return NextResponse.json({
      success: true,
      evaluations: data || [],
      total: data?.length || 0
    })

  } catch (error) {
    console.error('💥 Erreur evaluations:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
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
        evaluateur_id: session.user.id,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('❌ Erreur create evaluation:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'évaluation' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })

  } catch (error) {
    console.error('💥 Erreur create evaluation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
