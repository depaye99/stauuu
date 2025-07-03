
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est RH ou admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!user || !["rh", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { data: templates, error } = await supabase
      .from("document_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération templates:", error)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: templates || [] })
  } catch (error) {
    console.error("💥 Erreur GET templates:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est RH ou admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!user || !["rh", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { nom, type, description, contenu, variables } = await request.json()

    if (!nom || !type || !contenu) {
      return NextResponse.json({ 
        error: "Nom, type et contenu sont requis" 
      }, { status: 400 })
    }

    const { data: template, error } = await supabase
      .from("document_templates")
      .insert({
        nom,
        type,
        description: description || "",
        contenu,
        variables: variables || [],
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur création template:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: template,
      message: "Modèle créé avec succès"
    })
  } catch (error) {
    console.error("💥 Erreur POST template:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
