import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier les permissions admin
    const { data: adminProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Créer la table system_settings si elle n'existe pas
    const { error: createTableError } = await supabase.rpc('create_system_settings_table')
    
    if (createTableError) {
      console.log("Table system_settings existe déjà ou erreur:", createTableError.message)
    }

    // Récupérer les paramètres ou créer des valeurs par défaut
    let { data: settings, error } = await supabase
      .from("system_settings")
      .select("*")

    if (error || !settings || settings.length === 0) {
      // Créer des paramètres par défaut
      const defaultSettings = [
        { key: "company_name", value: "Bridge Technologies Solutions", description: "Nom de l'entreprise" },
        { key: "app_name", value: "Stage Manager", description: "Nom de l'application" },
        { key: "default_stage_duration", value: "3", description: "Durée par défaut du stage en mois" },
        { key: "notification_email", value: "admin@bridge-tech.com", description: "Email de notification" }
      ]

      const { data: newSettings, error: insertError } = await supabase
        .from("system_settings")
        .insert(defaultSettings)
        .select()

      if (insertError) {
        console.error("Erreur création paramètres:", insertError)
        return NextResponse.json({ 
          success: true, 
          data: defaultSettings.map((s, i) => ({ id: i + 1, ...s, created_at: new Date().toISOString() }))
        })
      }

      settings = newSettings
    }

    return NextResponse.json({ success: true, data: settings })

  } catch (error: any) {
    console.error("Erreur API settings:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier les permissions admin
    const { data: adminProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const settings = await request.json()

    // Mettre à jour les paramètres
    for (const setting of settings) {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error("Erreur update setting:", error)
      }
    }

    return NextResponse.json({ success: true, message: "Paramètres mis à jour" })

  } catch (error: any) {
    console.error("Erreur POST settings:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
