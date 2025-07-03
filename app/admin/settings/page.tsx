"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { Settings, Building, Users, Bell, Shield, Save, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

interface SystemSettings {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  max_stagiaires_per_tuteur: number
  stage_duration_months: number
  notification_email_enabled: boolean
  auto_assign_tuteur: boolean
  require_document_approval: boolean
  session_timeout_hours: number
}

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState<SystemSettings>({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    max_stagiaires_per_tuteur: 5,
    stage_duration_months: 6,
    notification_email_enabled: true,
    auto_assign_tuteur: true,
    require_document_approval: true,
    session_timeout_hours: 8,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()
      if (!profile || profile.role !== "admin") {
        router.push("/")
        return
      }

      setUser(profile)
      await loadSettings()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      })
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Succès",
          description: "Paramètres sauvegardés avec succès",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Paramètres système</h1>
          <p className="text-gray-600">Configurer les paramètres généraux de l'application</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger value="stages" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Stages
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Workflow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations de l'entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nom de l'entreprise</Label>
                    <Input
                      id="company_name"
                      value={settings.company_name}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_email">Email de contact</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={settings.company_email}
                      onChange={(e) => handleInputChange("company_email", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_address">Adresse</Label>
                  <Textarea
                    id="company_address"
                    value={settings.company_address}
                    onChange={(e) => handleInputChange("company_address", e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_phone">Téléphone</Label>
                  <Input
                    id="company_phone"
                    value={settings.company_phone}
                    onChange={(e) => handleInputChange("company_phone", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Configuration des stages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="max_stagiaires">Stagiaires max par tuteur</Label>
                    <Input
                      id="max_stagiaires"
                      type="number"
                      min="1"
                      max="20"
                      value={settings.max_stagiaires_per_tuteur}
                      onChange={(e) => handleInputChange("max_stagiaires_per_tuteur", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage_duration">Durée par défaut (mois)</Label>
                    <Input
                      id="stage_duration"
                      type="number"
                      min="1"
                      max="24"
                      value={settings.stage_duration_months}
                      onChange={(e) => handleInputChange("stage_duration_months", Number.parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Assignation automatique des tuteurs</Label>
                    <p className="text-sm text-gray-500">Assigner automatiquement un tuteur aux nouveaux stagiaires</p>
                  </div>
                  <Switch
                    checked={settings.auto_assign_tuteur}
                    onCheckedChange={(checked) => handleInputChange("auto_assign_tuteur", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Paramètres de notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-gray-500">Envoyer des notifications par email aux utilisateurs</p>
                  </div>
                  <Switch
                    checked={settings.notification_email_enabled}
                    onCheckedChange={(checked) => handleInputChange("notification_email_enabled", checked)}
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Types de notifications activées :</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nouvelles demandes</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Changements de statut</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Documents à approuver</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rappels d'évaluation</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Paramètres de sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Durée de session (heures)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="1"
                    max="24"
                    value={settings.session_timeout_hours}
                    onChange={(e) => handleInputChange("session_timeout_hours", Number.parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">
                    Les utilisateurs seront déconnectés automatiquement après cette durée d'inactivité
                  </p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Politiques de mot de passe :</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Longueur minimale : 8 caractères</span>
                      <Switch defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Caractères spéciaux requis</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expiration tous les 90 jours</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration du workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Approbation requise pour les documents</Label>
                    <p className="text-sm text-gray-500">Les documents doivent être approuvés avant d'être visibles</p>
                  </div>
                  <Switch
                    checked={settings.require_document_approval}
                    onCheckedChange={(checked) => handleInputChange("require_document_approval", checked)}
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Workflow des demandes :</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Validation RH automatique</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notification tuteur immédiate</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rappels automatiques</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={loadSettings} disabled={saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Sauvegarder
          </Button>
        </div>
      </main>
    </div>
  )
}
