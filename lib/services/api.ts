import { createClient } from "@/lib/supabase/client"
import type {
  User,
  Stagiaire,
  Demande,
  Document,
  Evaluation,
  ApiResponse,
  PaginatedResponse,
} from "@/lib/supabase/database.types"

const supabase = createClient()

// Types pour les exports
export type { User, Stagiaire, Demande, Document, Evaluation }

// API générique
class ApiService {
  protected supabase = createClient()

  protected async handleResponse<T>(promise: Promise<{ data: T | null; error: any }>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await promise

      if (error) {
        console.error("API Error:", error)
        return {
          success: false,
          error: error.message || "Une erreur est survenue",
          data: undefined,
        }
      }

      return {
        success: true,
        data: data as T,
        error: undefined,
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      return {
        success: false,
        error: "Une erreur inattendue est survenue",
        data: undefined,
      }
    }
  }

  protected async handlePaginatedResponse<T>(
    promise: Promise<{ data: T[] | null; error: any; count?: number }>,
  ): Promise<PaginatedResponse<T>> {
    try {
      const { data, error, count } = await promise

      if (error) {
        console.error("API Error:", error)
        return {
          success: false,
          error: error.message || "Une erreur est survenue",
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        }
      }

      return {
        success: true,
        data: data as T[],
        error: undefined,
        pagination: {
          total: count || 0,
          page: 1,
          limit: 10,
          totalPages: Math.ceil((count || 0) / 10),
        },
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      return {
        success: false,
        error: "Une erreur inattendue est survenue",
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      }
    }
  }
}

export const apiService = new ApiService()
