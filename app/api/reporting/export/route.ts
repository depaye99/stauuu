import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const type = searchParams.get("type") || "demandes"

    console.log("🔍 Export demandé:", { format, type })

    let data: any[] = []
    let headers: string[] = []

    switch (type) {
      case "demandes":
        const { data: demandes, error: demandesError } = await supabase.from("demandes").select(`
            *,
            stagiaire:stagiaires(
              *,
              user:users!user_id(name, email)
            )
          `)

        if (demandesError) {
          console.error("❌ Erreur demandes:", demandesError)
          throw demandesError
        }

        data = demandes || []
        headers = ["ID", "Titre", "Type", "Statut", "Date création", "Stagiaire", "Email"]
        break

      case "stagiaires":
        const { data: stagiaires, error: stagiairesError } = await supabase.from("stagiaires").select(`
            *,
            user:users!user_id(name, email),
            tuteur:users!tuteur_id(name)
          `)

        if (stagiairesError) {
          console.error("❌ Erreur stagiaires:", stagiairesError)
          throw stagiairesError
        }

        data = stagiaires || []
        headers = ["ID", "Nom", "Email", "Entreprise", "Poste", "Tuteur", "Statut"]
        break
    }

    console.log("📊 Données récupérées:", data.length, "éléments")

    if (format === "csv") {
      const csvContent = generateCSV(data, headers, type)

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}_export.csv"`,
        },
      })
    }

    return NextResponse.json({ data, headers })
  } catch (error) {
    console.error("💥 Erreur export:", error)
    return NextResponse.json({ error: "Erreur serveur: " + (error as Error).message }, { status: 500 })
  }
}

function generateCSV(data: any[], headers: string[], type: string): string {
  const csvHeaders = headers.join(",")

  const csvRows = data.map((item) => {
    switch (type) {
      case "demandes":
        return [
          item.id,
          `"${item.titre || ""}"`,
          item.type || "",
          item.statut || "",
          new Date(item.created_at).toLocaleDateString(),
          `"${item.stagiaire?.user?.name || ""}"`,
          item.stagiaire?.user?.email || "",
        ].join(",")

      case "stagiaires":
        return [
          item.id,
          `"${item.user?.name || ""}"`,
          item.user?.email || "",
          `"${item.entreprise || ""}"`,
          `"${item.poste || ""}"`,
          `"${item.tuteur?.name || ""}"`,
          item.statut || "",
        ].join(",")

      default:
        return ""
    }
  })

  return [csvHeaders, ...csvRows].join("\n")
}
