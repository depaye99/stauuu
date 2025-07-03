import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .order("created_at", { ascending: false })

    if (usersError) throw usersError

    // Récupérer tous les stagiaires
    const { data: stagiaires, error: stagiairesError } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!stagiaires_user_id_fkey(id, name, email, role),
        tuteur:users!stagiaires_tuteur_id_fkey(id, name, email)
      `)

    if (stagiairesError) throw stagiairesError

    // Analyser les données
    const totalUsers = users?.length || 0
    const stagiaireUsers = users?.filter(u => u.role === "stagiaire").length || 0
    const tuteurUsers = users?.filter(u => u.role === "tuteur").length || 0
    const adminUsers = users?.filter(u => u.role === "admin").length || 0
    const rhUsers = users?.filter(u => u.role === "rh").length || 0

    const stagiaireEntries = stagiaires?.length || 0
    const stagiairesWithTuteur = stagiaires?.filter(s => s.tuteur_id).length || 0

    // Identifier les utilisateurs stagiaires sans entrée dans stagiaires
    const stagiaireUserIds = users?.filter(u => u.role === "stagiaire").map(u => u.id) || []
    const stagiaireTableUserIds = stagiaires?.map(s => s.user_id) || []
    const missingInStagiaires = stagiaireUserIds.filter(id => !stagiaireTableUserIds.includes(id))

    const analysis = {
      users: {
        total: totalUsers,
        stagiaires: stagiaireUsers,
        tuteurs: tuteurUsers,
        admins: adminUsers,
        rh: rhUsers
      },
      stagiaires: {
        entries: stagiaireEntries,
        withTuteur: stagiairesWithTuteur,
        withoutTuteur: stagiaireEntries - stagiairesWithTuteur
      },
      issues: {
        missingInStagiairesTable: missingInStagiaires.length,
        missingUserIds: missingInStagiaires
      },
      data: {
        users: users || [],
        stagiaires: stagiaires || []
      }
    }

    return NextResponse.json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error("Erreur debug stagiaires sync:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
