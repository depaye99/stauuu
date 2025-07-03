import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API Notifications - Début de la requête")

    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.log("❌ Pas de session utilisateur:", sessionError?.message)
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    console.log("✅ Session trouvée pour:", session.user.email)

    // Récupérer les notifications de l'utilisateur
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("❌ Erreur récupération notifications:", error)
      return NextResponse.json(
        { success: false, error: `Erreur lors de la récupération des notifications: ${error.message}` },
        { status: 500 },
      )
    }

    console.log("✅ Notifications récupérées:", notifications?.length || 0)

    return NextResponse.json({
      success: true,
      data: notifications || [],
    })
  } catch (error: any) {
    console.error("💥 Erreur API Notifications:", error)
    return NextResponse.json({ success: false, error: `Erreur interne du serveur: ${error.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, titre, message, type = "info" } = body

    // Validation des données
    if (!user_id || !titre || !message) {
      return NextResponse.json(
        { success: false, error: "user_id, titre et message sont obligatoires" },
        { status: 400 },
      )
    }

    // Créer la notification
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        titre,
        message,
        type,
        lu: false,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur création notification:", error)
      return NextResponse.json(
        { success: false, error: `Erreur lors de la création de la notification: ${error.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error: any) {
    console.error("💥 Erreur API Notifications POST:", error)
    return NextResponse.json({ success: false, error: `Erreur interne du serveur: ${error.message}` }, { status: 500 })
  }
}
