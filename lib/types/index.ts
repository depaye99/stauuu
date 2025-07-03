// Re-export des types principaux depuis database.types.ts
export type {
  User,
  UserRole,
  UserProfile,
  Stagiaire,
  StagiaireWithUser,
  Demande,
  DemandeWithRelations,
  Document,
  DocumentWithRelations,
  Evaluation,
  EvaluationWithRelations,
  Notification,
  NotificationWithRelations,
  Template,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
  FilterOptions,
  SortOptions,
} from "@/lib/supabase/database.types"

// Types additionnels pour l'application
export interface AppError {
  message: string
  code?: string
  details?: any
}

export interface LoadingState {
  isLoading: boolean
  error: AppError | null
}

export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
}

export interface TableState<T = any> {
  data: T[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
  }
  filters: Record<string, any>
  sort: {
    field: string
    direction: "asc" | "desc"
  }
}
