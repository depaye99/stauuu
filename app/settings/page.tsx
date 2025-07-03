"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Header } from "@/components/layout/header"
import { BackButton } from "@/components/ui/back-button"
import { User, Bell, Shield, Palette, Globe, Save, RefreshCw, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    demandes: boolean
    evaluations: boolean
    documents: boolean
  }
  display: {
    theme: string
    language: string
    timezone: string
    dateFormat: string
  }
  privacy: {
    profileVisible: boolean
    emailVisible: boolean
    phoneVisible: boolean
  }
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
  })
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      demandes: true,
      evaluations: true,
      documents: true,
    },
    display: {
      theme: "light",
      language: "fr",
      timezone: "Africa/Douala",
      dateFormat: "DD/MM/YYYY",
    },
    privacy: {
      profileVisible: true,
      emailVisible: false,
      phoneVisible: false,
    },
  })
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
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

      const { data: userProfile } = await supabase.from("users").select("*").eq("id", session.user.id).single()
      if (!userProfile) {
        router.push("/auth/login")
        return
      }

      setUser(userProfile)
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        department: userProfile.department || "",
        position: userProfile.position || "",
      })

      await loadUserSettings()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadUserSettings = async () => {
    try {
      const response = await fetch("/api/user/settings")
      const data = await response.json()

      if (data.success && data.data) {
        setSettings({ ...settings, ...data.data })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from("users").update(profile).eq("id", user.id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/user/settings", {
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

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      })

      if (error) throw error

      toast({
        title: "Succès",
        description: "Mot de passe modifié avec succès",
      })
      setPasswords({ current: "", new: "", confirm: "" })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le mot de passe",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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

      <main className="max-w-4xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <BackButton />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-gray-600">Gérer votre profil et vos préférences</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          {/* Navigation responsive avec scroll horizontal sur mobile */}
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full min-w-max grid-cols-5 sm:min-w-0">
              <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              >
                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Sécurité</span>
              </TabsTrigger>
              <TabsTrigger value="display" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Affichage</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Confidentialité</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Camera className="mr-2 h-4 w-4" />
                    Changer la photo
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <Input
                      id="department"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
                    {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Préférences de notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications par email</Label>
                      <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email: checked },
                        })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Types de notifications :</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Nouvelles demandes</span>
                        <Switch
                          checked={settings.notifications.demandes}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, demandes: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Évaluations</span>
                        <Switch
                          checked={settings.notifications.evaluations}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, evaluations: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Documents</span>
                        <Switch
                          checked={settings.notifications.documents}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, documents: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
                    {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité du compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Changer le mot de passe</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Mot de passe actuel</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">Nouveau mot de passe</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={changePassword}
                    disabled={saving || !passwords.new || !passwords.confirm}
                    className="w-full sm:w-auto"
                  >
                    {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                    Changer le mot de passe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Préférences d'affichage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label>Thème</Label>
                    <Select
                      value={settings.display.theme}
                      onValueChange={(value) =>
                        setSettings({ ...settings, display: { ...settings.display, theme: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                        <SelectItem value="system">Système</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <Select
                      value={settings.display.language}
                      onValueChange={(value) =>
                        setSettings({ ...settings, display: { ...settings.display, language: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <Select
                      value={settings.display.timezone}
                      onValueChange={(value) =>
                        setSettings({ ...settings, display: { ...settings.display, timezone: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Douala">Afrique/Douala</SelectItem>
                        <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Format de date</Label>
                    <Select
                      value={settings.display.dateFormat}
                      onValueChange={(value) =>
                        setSettings({ ...settings, display: { ...settings.display, dateFormat: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
                    {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Paramètres de confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profil visible</Label>
                      <p className="text-sm text-gray-500">Permettre aux autres utilisateurs de voir votre profil</p>
                    </div>
                    <Switch
                      checked={settings.privacy.profileVisible}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, privacy: { ...settings.privacy, profileVisible: checked } })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email visible</Label>
                      <p className="text-sm text-gray-500">Afficher votre email dans votre profil public</p>
                    </div>
                    <Switch
                      checked={settings.privacy.emailVisible}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, privacy: { ...settings.privacy, emailVisible: checked } })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Téléphone visible</Label>
                      <p className="text-sm text-gray-500">Afficher votre téléphone dans votre profil public</p>
                    </div>
                    <Switch
                      checked={settings.privacy.phoneVisible}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, privacy: { ...settings.privacy, phoneVisible: checked } })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
                    {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
