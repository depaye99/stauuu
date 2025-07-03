import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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

    const { id } = params
    const { commentaire } = await request.json()

    // Vérifier que la demande existe et est assignée au tuteur
    const { data: demande, error: checkError } = await supabase
      .from('demandes')
      .select('*, stagiaires!inner(tuteur_id)')
      .eq('id', id)
      .single()

    if (checkError || !demande) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      )
    }

    if (demande.stagiaires.tuteur_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à traiter cette demande' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('demandes')
      .update({
        statut: 'approuvee',
        commentaire_tuteur: commentaire,
        date_traitement: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erreur approve demande:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'approbation' },
        { status: 500 }
      )
    }

    // Créer une notification pour le stagiaire
    await supabase
      .from('notifications')
      .insert({
        user_id: demande.user_id,
        type: 'demande_approuvee',
        titre: 'Demande approuvée',
        message: `Votre demande "${demande.titre}" a été approuvée`,
        data: { demande_id: id }
      })

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Erreur approve demande:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
