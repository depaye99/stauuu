import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Language } from "./i18n"

interface User {
  id: string
  email: string
  name: string
  role: string
  first_name?: string
  last_name?: string
}

interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface AppState {
  // Theme & Language
  theme: "light" | "dark"
  language: Language
  setTheme: (theme: "light" | "dark") => void
  setLanguage: (language: Language) => void

  // User
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Data
  demandes: any[]
  documents: any[]
  stagiaires: any[]
  setDemandes: (demandes: any[]) => void
  setDocuments: (documents: any[]) => void
  setStagiaires: (stagiaires: any[]) => void

  // UI State
  isLoading: boolean
  error: string | null
  notifications: Notification[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void

  // Filters & Search
  searchQuery: string
  filters: {
    status?: string
    type?: string
    department?: string
    dateRange?: { start: string; end: string }
  }
  setSearchQuery: (query: string) => void
  setFilters: (filters: any) => void

  // Color Theme
  primaryColor: string
  setPrimaryColor: (color: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme & Language
      theme: "light",
      language: "fr",
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),

      // User
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // Data
      demandes: [],
      documents: [],
      stagiaires: [],
      setDemandes: (demandes) => set({ demandes }),
      setDocuments: (documents) => set({ documents }),
      setStagiaires: (stagiaires) => set({ stagiaires }),

      // UI State
      isLoading: false,
      error: null,
      notifications: [],
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      addNotification: (notification) => {
        const notifications = get().notifications
        set({ notifications: [...notifications, notification] })
      },
      removeNotification: (id) => {
        const notifications = get().notifications.filter((n) => n.id !== id)
        set({ notifications })
      },

      // Filters & Search
      searchQuery: "",
      filters: {},
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setFilters: (filters) => set({ filters }),

      // Color Theme
      primaryColor: "#3b82f6",
      setPrimaryColor: (color) => set({ primaryColor: color }),
    }),
    {
      name: "bridge-app-storage",
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currentUser: state.currentUser,
        primaryColor: state.primaryColor,
      }),
    },
  ),
)
