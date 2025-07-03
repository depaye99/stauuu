import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notificationsService } from "@/lib/services/notifications-service"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const notification = await notificationsService.markAsRead(params.id)
    return NextResponse.json({ notification })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de la notification" }, { status: 500 })
  }
}
