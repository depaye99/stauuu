
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: z.enum(["admin", "rh", "tuteur", "stagiaire"]),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  is_active: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Vérifier que l'utilisateur actuel est admin
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès non autorisé" },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)
    
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", validatedData.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Créer l'utilisateur auth avec les privilèges admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        name: validatedData.name,
        role: validatedData.role,
        created_by_admin: true
      }
    })

    if (authError) {
      console.error("Erreur création auth admin:", authError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du compte: " + authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du compte" },
        { status: 500 }
      )
    }

    // Créer le profil utilisateur
    const { data: newUser, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        phone: validatedData.phone,
        department: validatedData.department,
        position: validatedData.position,
        address: validatedData.address,
        is_active: validatedData.is_active,
        email_confirmed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error("Erreur création profil:", profileError)
      
      // Essayer de supprimer l'utilisateur auth créé
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        console.error("Erreur suppression utilisateur auth:", deleteError)
      }
      
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du profil: " + profileError.message },
        { status: 500 }
      )
    }

    // Si c'est un stagiaire, créer l'entrée dans la table stagiaires
    if (validatedData.role === "stagiaire") {
      try {
        // Assigner automatiquement un tuteur
        const { data: tuteurs } = await supabase
          .from("users")
          .select(`
            id, name,
            stagiaires_count:stagiaires(count)
          `)
          .eq("role", "tuteur")
          .eq("is_active", true)

        let tuteurId = null
        if (tuteurs && tuteurs.length > 0) {
          const tuteurAvecMoinsDeStages = tuteurs.reduce((prev, current) => {
            const prevCount = prev.stagiaires_count?.[0]?.count || 0
            const currentCount = current.stagiaires_count?.[0]?.count || 0
            return currentCount < prevCount ? current : prev
          })
          tuteurId = tuteurAvecMoinsDeStages.id
        }

        await supabase.from("stagiaires").insert({
          user_id: authData.user.id,
          entreprise: "Bridge Technologies Solutions",
          poste: "Stagiaire",
          tuteur_id: tuteurId,
          statut: "actif",
          date_debut: new Date().toISOString().split('T')[0],
          date_fin: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 mois plus tard
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } catch (stagiaireError) {
        console.warn("Erreur création stagiaire:", stagiaireError)
      }
    }

    // Créer une notification de bienvenue
    try {
      await supabase
        .from("notifications")
        .insert({
          user_id: authData.user.id,
          titre: "Compte créé par l'administrateur",
          message: `Bienvenue ${validatedData.name} ! Votre compte a été créé par l'administrateur.`,
          type: "info"
        })
    } catch (notifError) {
      console.warn("Erreur création notification:", notifError)
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: {
        user: newUser
      }
    })

  } catch (error) {
    console.error("Erreur création utilisateur admin:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Vérifier que l'utilisateur actuel est admin
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: users
    })

  } catch (error) {
    console.error("Erreur récupération utilisateurs:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
