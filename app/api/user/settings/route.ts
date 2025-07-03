import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les paramètres utilisateur
    const { data: userSettings, error } = await supabase
      .from("user_settings")
      .select("settings")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: userSettings?.settings || {},
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    let settings
    try {
      settings = await request.json()
    } catch (jsonError) {
      console.error("Erreur parsing JSON:", jsonError)
      return NextResponse.json(
        { error: "Le corps de la requête n'est pas un JSON valide." },
        { status: 400 }
      )
    }

    // Mettre à jour ou créer les paramètres utilisateur
    const { error: upsertError } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, settings }, { onConflict: "user_id" })

    if (upsertError) {
      console.error("Erreur Supabase upsert:", upsertError)
      return NextResponse.json(
        {
          error: "Erreur lors de la sauvegarde en base.",
          details: upsertError.message || upsertError,
          code: upsertError.code || undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Paramètres mis à jour avec succès",
    })
  } catch (error: any) {
    console.error(
      "Erreur inattendue lors de la mise à jour des paramètres utilisateur:",
      error
    )
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error?.message || error,
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}
