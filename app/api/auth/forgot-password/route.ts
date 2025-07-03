import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
      console.error('Erreur reset password:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email de récupération' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Email de récupération envoyé avec succès'
    })

  } catch (error) {
    console.error('Erreur forgot password:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
