import { createClient } from "@/lib/supabase/client"

interface SystemSettings {
  [key: string]: any
}

class SettingsService {
  private cache: SystemSettings = {}
  private cacheExpiry = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async getSetting(key: string): Promise<any> {
    try {
      // Vérifier le cache
      if (this.isCacheValid() && this.cache[key] !== undefined) {
        return this.cache[key]
      }

      // Récupérer depuis la base de données
      await this.loadSettings()
      return this.cache[key] || this.getDefaultValue(key)
    } catch (error) {
      console.warn(`⚠️ Erreur récupération paramètre ${key}:`, error)
      return this.getDefaultValue(key)
    }
  }

  async getAllSettings(): Promise<SystemSettings> {
    try {
      if (!this.isCacheValid()) {
        await this.loadSettings()
      }
      return { ...this.cache }
    } catch (error) {
      console.warn("⚠️ Erreur récupération paramètres:", error)
      return this.getDefaultSettings()
    }
  }

  async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("system_settings")
        .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() })

      if (error) throw error

      // Invalider le cache
      this.invalidateCache()
      console.log(`✅ Paramètre ${key} mis à jour:`, value)
      return true
    } catch (error) {
      console.error(`❌ Erreur mise à jour paramètre ${key}:`, error)
      return false
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const supabase = createClient()

      const { data: settings, error } = await supabase.from("system_settings").select("key, value")

      if (error) {
        console.warn("⚠️ Erreur chargement paramètres:", error)
        this.cache = this.getDefaultSettings()
        return
      }

      this.cache = {}
      settings?.forEach((setting) => {
        try {
          this.cache[setting.key] = JSON.parse(setting.value)
        } catch {
          this.cache[setting.key] = setting.value
        }
      })

      // Ajouter les valeurs par défaut pour les clés manquantes
      const defaults = this.getDefaultSettings()
      Object.keys(defaults).forEach((key) => {
        if (this.cache[key] === undefined) {
          this.cache[key] = defaults[key]
        }
      })

      this.cacheExpiry = Date.now() + this.CACHE_DURATION
    } catch (error) {
      console.warn("⚠️ Exception chargement paramètres:", error)
      this.cache = this.getDefaultSettings()
    }
  }

  private isCacheValid(): boolean {
    return Date.now() < this.cacheExpiry && Object.keys(this.cache).length > 0
  }

  private invalidateCache(): void {
    this.cacheExpiry = 0
    this.cache = {}
  }

  private getDefaultValue(key: string): any {
    const defaults = this.getDefaultSettings()
    return defaults[key]
  }

  private getDefaultSettings(): SystemSettings {
    return {
      // Entreprise
      company_name: "Bridge Technologies Solutions",
      company_address: "123 Rue de la Technologie, Yaoundé",
      company_phone: "+237 123 456 789",
      company_email: "contact@bridgetech.cm",

      // Stages
      auto_assign_tuteur: true,
      max_stagiaires_per_tuteur: 5,
      stage_duration_months: 6,

      // Notifications
      notification_email_enabled: true,
      notification_types: ["demande_created", "document_uploaded", "evaluation_due"],

      // Sécurité
      session_timeout_hours: 8,
      require_password_change: false,
      min_password_length: 8,

      // Workflow
      require_document_approval: true,
      auto_approve_evaluations: false,
    }
  }
}

export const settingsService = new SettingsService()
