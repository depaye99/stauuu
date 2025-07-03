"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, LogOut, User, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LanguageSelector } from "@/components/language-selector"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  user?: any
  showAuth?: boolean
}

interface Notification {
  id: string
  titre: string
  message: string
  type: string
  lu: boolean
  created_at: string
}

export function Header({ user, showAuth = false }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    if (loadingNotifications) return

    setLoadingNotifications(true)
    try {
      console.log("🔔 Chargement des notifications...")

      const response = await fetch("/api/notifications")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log("✅ Notifications chargées:", data.data?.length || 0)
        setNotifications(data.data || [])
      } else {
        console.error("❌ Erreur API notifications:", data.error)
      }
    } catch (error) {
      console.error("💥 Erreur lors du chargement des notifications:", error)
      // Ne pas afficher d'erreur à l'utilisateur pour les notifications
      setNotifications([])
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, lu: true } : notif)))
      }
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur"
      case "rh":
        return "Ressources Humaines"
      case "tuteur":
        return "Tuteur"
      case "stagiaire":
        return "Stagiaire"
      default:
        return role
    }
  }

  const getProfileLink = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin/profile"
      case "rh":
        return "/rh/profile"
      case "tuteur":
        return "/tuteur/profile"
      case "stagiaire":
        return "/stagiaire/profile"
      default:
        return "/profile"
    }
  }

  const unreadCount = notifications.filter((n) => !n.lu).length

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/images/logo.png" alt="Bridge Technologies Solutions" className="h-10 w-auto" />
        </Link>

        {!showAuth && (
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/contacts"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Contacts
            </Link>
            <Link
              href="/entreprise"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Entreprise
            </Link>
            <Link
              href="/services"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Services
            </Link>
          </nav>
        )}

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {unreadCount} non lues
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {loadingNotifications ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm">Chargement...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex flex-col items-start p-4 cursor-pointer ${
                            !notification.lu ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                          onClick={() => !notification.lu && markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{notification.titre}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </div>
                              <div className="text-xs text-gray-400 mt-2">
                                {new Date(notification.created_at).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            {!notification.lu && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menu utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(user.role)}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getProfileLink(user.role)} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : showAuth ? (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/auth/register">
                <Button>S'inscrire</Button>
              </Link>
            </div>
          ) : (
            <>
              <LanguageSelector />
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
