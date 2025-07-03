"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, FileText, Users, Calendar, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/ui/back-button"

interface ReportingData {
  stagiaires: {
    total: number
    actifs: number
    termines: number
    par_mois: Array<{ mois: string; nombre: number }>
    par_departement: Array<{ departement: string; nombre: number }>
  }
  demandes: {
    total: number
    en_attente: number
    approuvees: number
    rejetees: number
    par_type: Array<{ type: string; nombre: number }>
    par_mois: Array<{ mois: string; nombre: number }>
  }
  evaluations: {
    total: number
    moyenne_globale: number
    par_critere: Array<{ critere: string; moyenne: number }>
  }
  documents: {
    total: number
    par_type: Array<{ type: string; nombre: number }>
  }
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [reportData, setReportData] = useState<ReportingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("12")
  const [exportLoading, setExportLoading] = useState(false)
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
      await loadReportData()
    }

    checkAuth()
  }, [router, supabase, period])

  const loadReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reporting?period=${period}`)

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données")
      }

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error("Erreur lors du chargement des rapports:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de rapport",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string, format: string) => {
    try {
      setExportLoading(true)
      const response = await fetch(`/api/reporting/export?type=${type}&format=${format}`)

      if (!response.ok) {
        throw new Error("Erreur lors de l'export")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `${type}_export.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Succès",
        description: "Export téléchargé avec succès",
      })
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export",
        variant: "destructive",
      })
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Impossible de charger les données de rapport.</p>
              <Button className="mt-4" onClick={loadReportData}>
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <BackButton href="/admin" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Rapports et Analyses</h1>
                <p className="text-gray-600">Vue d'ensemble des activités et statistiques</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={period} onValueChange={(value) => setPeriod(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 derniers mois</SelectItem>
                  <SelectItem value="6">6 derniers mois</SelectItem>
                  <SelectItem value="12">12 derniers mois</SelectItem>
                  <SelectItem value="24">24 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Stagiaires</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.stagiaires.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Demandes</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.demandes.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Évaluations</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.evaluations.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.documents.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Évolution des stagiaires */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Stagiaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.stagiaires.par_mois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="nombre" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition des demandes */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Demandes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.demandes.par_type}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, nombre }) => `${type}: ${nombre}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="nombre"
                  >
                    {reportData.demandes.par_type.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Actions d'export */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Stagiaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Exporter la liste complète des stagiaires avec leurs informations
                </p>
                <div className="flex space-x-2">
                  <Button onClick={() => handleExport("stagiaires", "csv")} disabled={exportLoading} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Demandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Exporter la liste complète des demandes avec leurs statuts</p>
                <div className="flex space-x-2">
                  <Button onClick={() => handleExport("demandes", "csv")} disabled={exportLoading} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
