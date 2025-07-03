import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification et les permissions
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: currentUser } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer tous les tuteurs
    const { data: tuteurs, error } = await supabase
      .from("users")
      .select("id, name, email, phone, created_at")
      .eq("role", "tuteur")
      .order("name")

    if (error) throw error

    return NextResponse.json({ success: true, data: tuteurs })
  } catch (error) {
    console.error("Erreur lors de la récupération des tuteurs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
