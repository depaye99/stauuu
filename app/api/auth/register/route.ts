import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: z.enum(["admin", "rh", "tuteur", "stagiaire"]),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    console.log("🔄 Tentative d'enregistrement public pour:", body.email)

    // Validation des données
    const validatedData = registerSchema.parse(body)

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", validatedData.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Validation des données
    if (!validatedData.name || validatedData.name.length < 2) {
      return NextResponse.json({ error: "Nom requis (minimum 2 caractères)" }, { status: 400 })
    }

    if (!validatedData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validatedData.email)) {
      return NextResponse.json({ error: "Email valide requis" }, { status: 400 })
    }

    if (!validatedData.password || validatedData.password.length < 6) {
      return NextResponse.json({ error: "Mot de passe requis (minimum 6 caractères)" }, { status: 400 })
    }

    // Créer l'utilisateur auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          role: validatedData.role,
          public_registration: true
        }
      }
    })

    if (authError) {
      console.error("Erreur création auth:", authError)

      if (authError.message.includes("User not allowed")) {
        return NextResponse.json(
          { error: "L'enregistrement public est temporairement désactivé. Contactez l'administrateur." },
          { status: 403 }
        )
      }

      if (authError.message.includes("email address not authorized")) {
        return NextResponse.json(
          { error: "Cette adresse email n'est pas autorisée. Contactez l'administrateur." },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: "Erreur lors de la création du compte: " + authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      )
    }

    // Créer le profil utilisateur
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        phone: validatedData.phone,
        department: validatedData.department,
        position: validatedData.position,
        is_active: true
      })

    if (profileError) {
      console.error("Erreur création profil:", profileError)
      return NextResponse.json(
        { error: "Erreur lors de la création du profil" },
        { status: 500 }
      )
    }

    // Si c'est un stagiaire, créer l'entrée dans la table stagiaires
    if (validatedData.role === "stagiaire") {
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

      const { error: stagiaireError } = await supabase
        .from("stagiaires")
        .insert({
          user_id: authData.user.id,
          entreprise: "Bridge Technologies Solutions",
          poste: "Stagiaire",
          tuteur_id: tuteurId,
          statut: "actif",
          date_debut: new Date().toISOString().split('T')[0],
          date_fin: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 6 mois plus tard
        })

      if (stagiaireError) {
        console.error("Erreur création stagiaire:", stagiaireError)
      }
    }

    // Créer une notification de bienvenue
    await supabase
      .from("notifications")
      .insert({
        user_id: authData.user.id,
        titre: "Bienvenue sur la plateforme",
        message: `Bienvenue ${validatedData.name} ! Votre compte a été créé avec succès.`,
        type: "success"
      })

    console.log("✅ Utilisateur créé avec succès:", validatedData.email)

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès",
      user: {
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role
      }
    })

  } catch (error) {
    console.error("Erreur registration:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}