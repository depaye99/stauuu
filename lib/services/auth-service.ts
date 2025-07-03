import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/supabase/database.types"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
  phone?: string
  address?: string
  department?: string
  position?: string
  avatar_url?: string
  is_active?: boolean
  email_confirmed?: boolean
}

class AuthService {
  private supabase = createClient()

  async signIn(
    email: string,
    password: string,
  ): Promise<{
    user: AuthUser | null
    error: Error | null
  }> {
    try {
      // supprime d'abord toute précédente session ouverte 
      await this.supabase.auth.signOut()

      // Sign in with fresh credentials
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("Supabase auth error:", authError)

        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Identifiants invalides. Vérifiez votre email et mot de passe.")
        }

        if (authError.message.includes("Email not confirmed")) {
          throw new Error("Email non confirmé. Vérifiez votre boîte mail.")
        }

        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Aucun utilisateur retourné")
      }

      // Get user profile with retry mechanism
      let profile = await this.getUserProfileWithRetry(authData.user.id)

      if (!profile) {
        console.log("Profil utilisateur non trouvé, création...")
        profile = await this.createUserProfileSafe(authData.user)
      }

      // Update last login
      try {
        await this.updateLastLogin(authData.user.id)
      } catch (error) {
        console.warn("Échec mise à jour dernière connexion:", error)
      }

      return { user: profile, error: null }
    } catch (error) {
      console.error("Erreur de connexion:", error)
      return {
        user: null,
        error: error instanceof Error ? error : new Error("Erreur d'authentification inconnue"),
      }
    }
  }

  async signUp(
    email: string,
    password: string,
    userData: {
      name: string
      role: UserRole
      phone?: string
      address?: string
      department?: string
      position?: string
    },
  ): Promise<{
    user: AuthUser | null
    error: Error | null
  }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
            address: userData.address,
            department: userData.department,
            position: userData.position,
          },
        },
      })

      if (error) {
        console.error("Erreur inscription Supabase:", error)
        throw error
      }

      if (!data.user) {
        throw new Error("Aucun utilisateur retourné lors de l'inscription")
      }

      const profile = await this.createUserProfileSafe(data.user, userData)

      return { user: profile, error: null }
    } catch (error) {
      console.error("Erreur d'inscription:", error)
      return {
        user: null,
        error: error instanceof Error ? error : new Error("Erreur d'inscription inconnue"),
      }
    }
  }

  private async createUserProfileSafe(authUser: any, userData?: any): Promise<AuthUser> {
    try {
      console.log("Création profil sécurisée pour:", authUser.email)

      const existingProfile = await this.getUserProfile(authUser.id)
      if (existingProfile) {
        console.log("Profil existant trouvé:", existingProfile)
        return existingProfile
      }

      const userRole = ((userData?.role || authUser.user_metadata?.role) as UserRole) || "stagiaire"

      const basicProfile = {
        id: authUser.id,
        email: authUser.email!,
        name: userData?.name || authUser.user_metadata?.name || authUser.email!.split("@")[0],
        role: userRole,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: createdProfile, error: insertError } = await this.supabase
        .from("users")
        .insert([basicProfile])
        .select()
        .single()

      if (insertError) {
        console.error("Échec création profil de base:", insertError)
        return {
          id: authUser.id,
          email: authUser.email!,
          name: basicProfile.name,
          role: basicProfile.role,
          email_confirmed: !!authUser.email_confirmed_at,
        }
      }

      // Si c'est un stagiaire, créer l'entrée dans la table stagiaires
      if (userRole === "stagiaire") {
        try {
          await this.createStagiaireEntry(authUser.id)
        } catch (error) {
          console.warn("Échec création entrée stagiaire:", error)
        }
      }

      // Mettre à jour avec les champs additionnels
      if (userData?.phone || userData?.address || userData?.department || userData?.position) {
        try {
          const updateData: any = {}
          if (userData.phone) updateData.phone = userData.phone
          if (userData.address) updateData.address = userData.address
          if (userData.department) updateData.department = userData.department
          if (userData.position) updateData.position = userData.position

          await this.supabase.from("users").update(updateData).eq("id", authUser.id)
        } catch (updateError) {
          console.warn("Échec mise à jour champs additionnels:", updateError)
        }
      }

      return {
        id: createdProfile.id,
        email: createdProfile.email,
        role: createdProfile.role,
        name: createdProfile.name,
        phone: createdProfile.phone,
        address: createdProfile.address,
        department: createdProfile.department,
        position: createdProfile.position,
        avatar_url: createdProfile.avatar_url,
        is_active: createdProfile.is_active,
        email_confirmed: !!authUser.email_confirmed_at,
      }
    } catch (error) {
      console.error("Exception création profil:", error)
      return {
        id: authUser.id,
        email: authUser.email!,
        role: ((userData?.role || authUser.user_metadata?.role) as UserRole) || "stagiaire",
        name: userData?.name || authUser.user_metadata?.name || authUser.email!.split("@")[0],
        phone: userData?.phone || authUser.user_metadata?.phone,
        email_confirmed: !!authUser.email_confirmed_at,
      }
    }
  }

  private async createStagiaireEntry(userId: string): Promise<void> {
    try {
      // Assigner automatiquement un tuteur
      const { data: tuteurs } = await this.supabase
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

      await this.supabase.from("stagiaires").insert([
        {
          user_id: userId,
          entreprise: "Bridge Technologies Solutions",
          poste: "Stagiaire",
          tuteur_id: tuteurId,
          statut: "actif",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Erreur création entrée stagiaire:", error)
      throw error
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error

      // Clear local storage and session storage
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }

      return { error: null }
    } catch (error) {
      console.error("Erreur de déconnexion:", error)
      return {
        error: error instanceof Error ? error : new Error("Erreur inconnue"),
      }
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession()

      if (sessionError || !session) {
        return null
      }

      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()

      if (error || !user) return null

      const profile = await this.getUserProfile(user.id)

      if (!profile) {
        return {
          id: user.id,
          email: user.email!,
          role: (user.user_metadata?.role as UserRole) || "stagiaire",
          name: user.user_metadata?.name || user.email!.split("@")[0],
          phone: user.user_metadata?.phone,
          email_confirmed: !!user.email_confirmed_at,
        }
      }

      return profile
    } catch (error) {
      console.error("Erreur récupération utilisateur actuel:", error)
      return null
    }
  }

  private async getUserProfileWithRetry(userId: string, maxRetries = 3): Promise<AuthUser | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const profile = await this.getUserProfile(userId)
        if (profile) return profile

        // Wait before retry
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
        }
      } catch (error) {
        console.warn(`Tentative ${i + 1} échouée:`, error)
        if (i === maxRetries - 1) throw error
      }
    }
    return null
  }

  async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const { data: profile, error } = await this.supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        if (error.code === "42P01") {
          console.warn("Table users n'existe pas encore")
          return null
        }
        throw error
      }

      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        department: profile.department,
        position: profile.position,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active,
        email_confirmed: true,
      }
    } catch (error) {
      console.error("Erreur récupération profil utilisateur:", error)
      return null
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    } catch (error) {
      console.warn("Échec mise à jour dernière connexion:", error)
    }
  }
}

export const authService = new AuthService()
