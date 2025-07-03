import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/services/auth-service"

export async function POST(request: NextRequest) {
  try {
    const { error } = await authService.signOut()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Déconnexion réussie",
    })
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la déconnexion" }, { status: 500 })
  }
}
