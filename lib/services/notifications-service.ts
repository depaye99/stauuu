import { createClient } from "@/lib/supabase/client"
import type { Notification, NotificationWithRelations } from "@/lib/supabase/database.types"

export class NotificationsService {
  private supabase = createClient()

  async create(notification: Omit<Notification, "id" | "created_at">) {
    const { data, error } = await this.supabase.from("notifications").insert(notification).select().single()

    if (error) throw error

    // Envoyer email si nécessaire
    if (notification.type === "email" || notification.type === "urgent") {
      await this.sendEmail(notification)
    }

    return data
  }

  async getByUserId(userId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select(`
        *,
        users(name, email)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as NotificationWithRelations[]
  }

  async markAsRead(notificationId: string) {
    const { data, error } = await this.supabase
      .from("notifications")
      .update({ lu: true })
      .eq("id", notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async markAllAsRead(userId: string) {
    const { data, error } = await this.supabase
      .from("notifications")
      .update({ lu: true })
      .eq("user_id", userId)
      .eq("lu", false)

    if (error) throw error
    return data
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("lu", false)

    if (error) throw error
    return count || 0
  }

  private async sendEmail(notification: Omit<Notification, "id" | "created_at">) {
    try {
      // Récupérer les informations de l'utilisateur
      const { data: user } = await this.supabase
        .from("users")
        .select("email, name")
        .eq("id", notification.user_id)
        .single()

      if (!user?.email) return

      // Envoyer l'email via l'API
      const response = await fetch("/api/notifications/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: user.email,
          subject: notification.titre,
          message: notification.message,
          userName: user.name,
        }),
      })

      if (!response.ok) {
        console.error("Erreur lors de l'envoi de l'email")
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error)
    }
  }

  // Notifications prédéfinies
  async notifyDemandeCreated(stagiaireId: string, tuteurId: string, demandeType: string) {
    await this.create({
      user_id: tuteurId,
      titre: "Nouvelle demande à traiter",
      message: `Une nouvelle demande de ${demandeType} a été soumise et nécessite votre validation.`,
      type: "info",
      lu: false,
      date: new Date().toISOString(),
    })
  }

  async notifyDemandeApproved(stagiaireId: string, demandeType: string) {
    await this.create({
      user_id: stagiaireId,
      titre: "Demande approuvée",
      message: `Votre demande de ${demandeType} a été approuvée.`,
      type: "success",
      lu: false,
      date: new Date().toISOString(),
    })
  }

  async notifyDemandeRejected(stagiaireId: string, demandeType: string, reason?: string) {
    await this.create({
      user_id: stagiaireId,
      titre: "Demande rejetée",
      message: `Votre demande de ${demandeType} a été rejetée. ${reason ? `Raison: ${reason}` : ""}`,
      type: "error",
      lu: false,
      date: new Date().toISOString(),
    })
  }

  async notifyEvaluationDue(tuteurId: string, stagiaireId: string) {
    await this.create({
      user_id: tuteurId,
      titre: "Évaluation à effectuer",
      message: "Une évaluation de stagiaire est due et doit être complétée.",
      type: "warning",
      lu: false,
      date: new Date().toISOString(),
    })
  }

  async notifyStageStarting(stagiaireId: string, tuteurId: string) {
    // Notification au stagiaire
    await this.create({
      user_id: stagiaireId,
      titre: "Début de stage",
      message: "Votre stage commence bientôt. Préparez-vous pour votre première journée !",
      type: "info",
      lu: false,
      date: new Date().toISOString(),
    })

    // Notification au tuteur
    await this.create({
      user_id: tuteurId,
      titre: "Nouveau stagiaire",
      message: "Un nouveau stagiaire va commencer sous votre supervision.",
      type: "info",
      lu: false,
      date: new Date().toISOString(),
    })
  }

  async notifyStageEnding(stagiaireId: string, tuteurId: string) {
    // Notification au stagiaire
    await this.create({
      user_id: stagiaireId,
      titre: "Fin de stage approche",
      message: "Votre stage se termine bientôt. N'oubliez pas de compléter votre rapport final.",
      type: "warning",
      lu: false,
      date: new Date().toISOString(),
    })

    // Notification au tuteur
    await this.create({
      user_id: tuteurId,
      titre: "Évaluation finale requise",
      message: "Le stage de votre stagiaire se termine bientôt. Préparez l'évaluation finale.",
      type: "warning",
      lu: false,
      date: new Date().toISOString(),
    })
  }
}

export const notificationsService = new NotificationsService()
