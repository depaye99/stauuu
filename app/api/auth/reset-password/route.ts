import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { password, token } = await request.json()

    if (!password || !token) {
      return NextResponse.json(
        { error: 'Mot de passe et token requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Erreur update password:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Mot de passe mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur reset password:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
