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

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erreur profil:', profileError)
      return NextResponse.json(
        { error: 'Profil utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      is_active: profile.is_active,
      phone: profile.phone,
      address: profile.address,
      department: profile.department,
      position: profile.position
    })

  } catch (error) {
    console.error('Erreur auth user:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
