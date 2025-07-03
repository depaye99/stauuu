import { createClient } from "@/lib/supabase/client"
import type { ApiResponse, PaginatedResponse, FilterOptions, SortOptions } from "@/lib/supabase/database.types"

export interface FindOptions {
  page?: number
  limit?: number
  filters?: FilterOptions
  sort?: SortOptions
  include?: string[]
}

export abstract class BaseService<T> {
  protected supabase = createClient()
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  async findAll(options: FindOptions = {}): Promise<PaginatedResponse<T>> {
    try {
      const { page = 1, limit = 10, filters = {}, sort, include = [] } = options

      let query = this.supabase.from(this.tableName).select(this.getSelectFields(include), { count: "exact" })

      // Appliquer les filtres
      query = this.applyFilters(query, filters)

      // Appliquer le tri
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === "asc" })
      }

      // Appliquer la pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data as T[],
        error: null,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }
    } catch (error) {
      console.error(`Error in ${this.tableName} findAll:`, error)
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      }
    }
  }

  async findById(id: string, include: string[] = []): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.getSelectFields(include))
        .eq("id", id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as T,
        error: null,
      }
    } catch (error) {
      console.error(`Error in ${this.tableName} findById:`, error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert([
          {
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: result as T,
        error: null,
      }
    } catch (error) {
      console.error(`Error in ${this.tableName} create:`, error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: result as T,
        error: null,
      }
    } catch (error) {
      console.error(`Error in ${this.tableName} update:`, error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase.from(this.tableName).delete().eq("id", id)

      if (error) throw error

      return {
        success: true,
        data: undefined,
        error: null,
      }
    } catch (error) {
      console.error(`Error in ${this.tableName} delete:`, error)
      return {
        success: false,
        data: undefined,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  protected getSelectFields(include: string[] = []): string {
    let fields = "*"

    if (include.length > 0) {
      // Logique pour inclure les relations
      const relations = include.map((rel) => `${rel}(*)`).join(", ")
      fields = `*, ${relations}`
    }

    return fields
  }

  protected applyFilters(query: any, filters: FilterOptions): any {
    if (filters.search) {
      // Implémentation de la recherche (à personnaliser par service)
    }

    if (filters.status) {
      query = query.eq("statut", filters.status)
    }

    if (filters.type) {
      query = query.eq("type", filters.type)
    }

    if (filters.role) {
      query = query.eq("role", filters.role)
    }

    if (filters.dateRange) {
      query = query.gte("created_at", filters.dateRange.start).lte("created_at", filters.dateRange.end)
    }

    return query
  }
}
