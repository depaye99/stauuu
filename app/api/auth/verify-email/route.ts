import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { token, type } = await request.json()

    if (!token || !type) {
      return NextResponse.json(
        { error: 'Token et type requis' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any
    })

    if (error) {
      console.error('Erreur verify email:', error)
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Email vérifié avec succès'
    })

  } catch (error) {
    console.error('Erreur verify email:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
