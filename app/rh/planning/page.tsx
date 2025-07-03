"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Calendar, Users, Clock, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlanningEvent {
  id: string
  title: string
  start_date: string
  end_date: string
  type: "stage" | "conge" | "formation" | "reunion"
  stagiaire_id?: string
  tuteur_id?: string
  status: "planifie" | "en_cours" | "termine" | "annule"
  description?: string
  stagiaires?: {
    users: {
      name: string
      email: string
    }
  }
  tuteur?: {
    name: string
    email: string
  }
}

export default function RHPlanningPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<PlanningEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<PlanningEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filterType, setFilterType] = useState<string>("all")
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
      if (!profile || profile.role !== "rh") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadEvents()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("planning_events")
        .select(`
          *,
          stagiaires(
            users(name, email)
          ),
          tuteur:users!planning_events_tuteur_id_fkey(name, email)
        `)
        .order("start_date", { ascending: true })

      if (error) throw error
      setEvents(data || [])
      setFilteredEvents(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement du planning:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le planning",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    let filtered = events

    // Filtrer par mois/année
    filtered = filtered.filter((event) => {
      const eventDate = new Date(event.start_date)
      return eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear
    })

    // Filtrer par type
    if (filterType !== "all") {
      filtered = filtered.filter((event) => event.type === filterType)
    }

    setFilteredEvents(filtered)
  }, [events, selectedMonth, selectedYear, filterType])

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "stage":
        return "bg-blue-100 text-blue-800"
      case "conge":
        return "bg-red-100 text-red-800"
      case "formation":
        return "bg-green-100 text-green-800"
      case "reunion":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planifie":
        return "bg-yellow-100 text-yellow-800"
      case "en_cours":
        return "bg-blue-100 text-blue-800"
      case "termine":
        return "bg-green-100 text-green-800"
      case "annule":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []

    // Jours vides au début
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>)
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day)
      const dayEvents = filteredEvents.filter((event) => {
        const eventStart = new Date(event.start_date)
        const eventEnd = new Date(event.end_date)
        return currentDate >= eventStart && currentDate <= eventEnd
      })

      days.push(
        <div key={day} className="h-24 border border-gray-200 p-1 overflow-hidden">
          <div className="font-semibold text-sm mb-1">{day}</div>
          {dayEvents.slice(0, 2).map((event) => (
            <div
              key={event.id}
              className={`text-xs p-1 rounded mb-1 truncate ${getEventTypeColor(event.type)}`}
              title={event.title}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 2 && <div className="text-xs text-gray-500">+{dayEvents.length - 2} autres</div>}
        </div>,
      )
    }

    return days
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Planning des stages</h1>
          <p className="text-gray-600">Gérer le planning et les disponibilités</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stages actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter((e) => e.type === "stage" && e.status === "en_cours").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Événements ce mois</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredEvents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Congés planifiés</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter((e) => e.type === "conge" && e.status === "planifie").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.filter((e) => e.type === "formation").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Contrôles */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {new Date(2024, i, 1).toLocaleDateString("fr-FR", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => (
                      <SelectItem key={i} value={(new Date().getFullYear() - 2 + i).toString()}>
                        {new Date().getFullYear() - 2 + i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="stage">Stages</SelectItem>
                    <SelectItem value="conge">Congés</SelectItem>
                    <SelectItem value="formation">Formations</SelectItem>
                    <SelectItem value="reunion">Réunions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => router.push("/rh/planning/nouveau")}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel événement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vue calendrier */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {new Date(selectedYear, selectedMonth).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0 mb-4">
              {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
                <div key={day} className="p-2 text-center font-semibold bg-gray-100 border">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0">{renderCalendar()}</div>
          </CardContent>
        </Card>

        {/* Liste des événements */}
        <Card>
          <CardHeader>
            <CardTitle>Événements du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                      <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(event.start_date)} {formatTime(event.start_date)} -{formatDate(event.end_date)}{" "}
                      {formatTime(event.end_date)}
                    </div>
                    {event.stagiaires?.users && (
                      <div className="text-sm text-gray-600">Stagiaire: {event.stagiaires.users.name}</div>
                    )}
                    {event.tuteur && <div className="text-sm text-gray-600">Tuteur: {event.tuteur.name}</div>}
                    {event.description && <div className="text-sm text-gray-600 mt-1">{event.description}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm">
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
