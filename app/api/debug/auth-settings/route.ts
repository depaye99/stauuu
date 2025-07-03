
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Informations sur la configuration Supabase
    const settings = {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      
      // Test de base de la connexion
      connection_test: "pending"
    }

    // Tester la connexion à Supabase
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)
      if (error) {
        settings.connection_test = `error: ${error.message}`
      } else {
        settings.connection_test = "success"
      }
    } catch (connError: any) {
      settings.connection_test = `exception: ${connError.message}`
    }

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error("Erreur debug auth settings:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    )
  }
}
