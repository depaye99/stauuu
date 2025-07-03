import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les permissions admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer l'utilisateur
    const { data: userData, error } = await supabase.from("users").select("*").eq("id", params.id).single()

    if (error) {
      console.error("❌ Erreur récupération utilisateur:", error)
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: userData })
  } catch (error) {
    console.error("💥 Erreur API utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les permissions admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, role, department, position, is_active } = body

    console.log("📝 Mise à jour utilisateur:", { id: params.id, ...body })

    // Mettre à jour l'utilisateur
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        name,
        email,
        phone,
        role,
        department,
        position,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur mise à jour:", error)
      throw error
    }

    console.log("✅ Utilisateur mis à jour:", updatedUser)

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Utilisateur mis à jour avec succès",
    })
  } catch (error) {
    console.error("💥 Erreur mise à jour utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les permissions admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Désactiver l'utilisateur au lieu de le supprimer
    const { data: deactivatedUser, error } = await supabase
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur désactivation:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: deactivatedUser,
      message: "Utilisateur désactivé avec succès",
    })
  } catch (error) {
    console.error("💥 Erreur désactivation utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
