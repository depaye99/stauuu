import { BaseService } from "./base-service"
import type { Stagiaire, StagiaireWithUser, ApiResponse } from "@/lib/supabase/database.types"

export class StagiairesService extends BaseService<Stagiaire> {
  constructor() {
    super("stagiaires")
  }

  async findWithUser(id: string): Promise<ApiResponse<StagiaireWithUser>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*, users!user_id(*), tuteur:users!tuteur_id(*)")
        .eq("id", id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as StagiaireWithUser,
        error: null,
      }
    } catch (error) {
      console.error("Error in findWithUser:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async findByTuteur(tuteurId: string): Promise<ApiResponse<StagiaireWithUser[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*, users!user_id(*)")
        .eq("tuteur_id", tuteurId)

      if (error) throw error

      return {
        success: true,
        data: data as StagiaireWithUser[],
        error: null,
      }
    } catch (error) {
      console.error("Error in findByTuteur:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse<StagiaireWithUser>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*, users!user_id(*), tuteur:users!tuteur_id(*)")
        .eq("user_id", userId)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as StagiaireWithUser,
        error: null,
      }
    } catch (error) {
      console.error("Error in findByUserId:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export const stagiaireService = new StagiairesService()
