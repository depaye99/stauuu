import { createClient } from "@/lib/supabase/client"

interface DocumentTemplate {
  id: string
  nom: string
  type: string
  contenu: string
  variables: string[]
}

interface GenerationData {
  stagiaire?: any
  tuteur?: any
  entreprise?: string
  dateDebut?: string
  dateFin?: string
  [key: string]: any
}

export class DocumentGeneratorService {
  private supabase = createClient()

  async getTemplates() {
    const { data, error } = await this.supabase.from("templates").select("*").eq("is_active", true).order("nom")

    if (error) throw error
    return data as DocumentTemplate[]
  }

  async getTemplate(id: string) {
    const { data, error } = await this.supabase.from("templates").select("*").eq("id", id).single()

    if (error) throw error
    return data as DocumentTemplate
  }

  async generateDocument(templateId: string, data: GenerationData) {
    try {
      const template = await this.getTemplate(templateId)

      // Remplacer les variables dans le contenu
      let content = template.contenu

      // Variables prédéfinies
      const variables = {
        "{{STAGIAIRE_NOM}}": data.stagiaire?.users?.name || "",
        "{{STAGIAIRE_EMAIL}}": data.stagiaire?.users?.email || "",
        "{{STAGIAIRE_TELEPHONE}}": data.stagiaire?.users?.phone || "",
        "{{STAGIAIRE_ADRESSE}}": data.stagiaire?.users?.address || "",
        "{{TUTEUR_NOM}}": data.tuteur?.name || "",
        "{{TUTEUR_EMAIL}}": data.tuteur?.email || "",
        "{{TUTEUR_POSTE}}": data.tuteur?.position || "",
        "{{ENTREPRISE}}": data.entreprise || "BRIDGE Technologies Solutions",
        "{{DATE_DEBUT}}": data.dateDebut ? new Date(data.dateDebut).toLocaleDateString("fr-FR") : "",
        "{{DATE_FIN}}": data.dateFin ? new Date(data.dateFin).toLocaleDateString("fr-FR") : "",
        "{{DATE_AUJOURD_HUI}}": new Date().toLocaleDateString("fr-FR"),
        "{{DUREE_STAGE}}": this.calculateStageDuration(data.dateDebut, data.dateFin),
        ...data, // Variables personnalisées
      }

      // Remplacer toutes les variables
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g")
        content = content.replace(regex, String(value))
      })

      // Générer le PDF
      const pdfBuffer = await this.generatePDF(content, template.nom)

      // Sauvegarder le document
      const fileName = `${template.nom}_${data.stagiaire?.users?.name || "document"}_${Date.now()}.pdf`
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from("documents")
        .upload(fileName, pdfBuffer, {
          contentType: "application/pdf",
        })

      if (uploadError) throw uploadError

      // Enregistrer en base
      const { data: documentData, error: dbError } = await this.supabase
        .from("documents")
        .insert({
          nom: fileName,
          type: template.type,
          taille: pdfBuffer.byteLength,
          url: uploadData.path,
          user_id: data.stagiaire?.user_id || "",
          is_public: false,
        })
        .select()
        .single()

      if (dbError) throw dbError

      return {
        document: documentData,
        downloadUrl: await this.getDownloadUrl(uploadData.path),
      }
    } catch (error) {
      console.error("Erreur lors de la génération du document:", error)
      throw error
    }
  }

  private async generatePDF(htmlContent: string, title: string): Promise<ArrayBuffer> {
    // Utiliser une API externe ou une bibliothèque pour générer le PDF
    // Pour cet exemple, on simule la génération
    const response = await fetch("/api/documents/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: htmlContent,
        title: title,
        options: {
          format: "A4",
          margin: {
            top: "20mm",
            right: "20mm",
            bottom: "20mm",
            left: "20mm",
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la génération du PDF")
    }

    return await response.arrayBuffer()
  }

  private calculateStageDuration(startDate?: string, endDate?: string): string {
    if (!startDate || !endDate) return ""

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffMonths > 0) {
      return `${diffMonths} mois`
    } else if (diffWeeks > 0) {
      return `${diffWeeks} semaines`
    } else {
      return `${diffDays} jours`
    }
  }

  private async getDownloadUrl(path: string): Promise<string> {
    const { data } = await this.supabase.storage.from("documents").createSignedUrl(path, 3600) // 1 heure

    return data?.signedUrl || ""
  }

  // Templates prédéfinis
  async createDefaultTemplates() {
    const templates = [
      {
        nom: "Convention de stage",
        type: "convention",
        contenu: `
          <h1>CONVENTION DE STAGE</h1>
          
          <h2>ENTRE LES SOUSSIGNÉS :</h2>
          
          <p><strong>L'ENTREPRISE :</strong> {{ENTREPRISE}}</p>
          <p>Représentée par : {{TUTEUR_NOM}}, {{TUTEUR_POSTE}}</p>
          <p>Email : {{TUTEUR_EMAIL}}</p>
          
          <p><strong>LE STAGIAIRE :</strong></p>
          <p>Nom : {{STAGIAIRE_NOM}}</p>
          <p>Email : {{STAGIAIRE_EMAIL}}</p>
          <p>Téléphone : {{STAGIAIRE_TELEPHONE}}</p>
          <p>Adresse : {{STAGIAIRE_ADRESSE}}</p>
          
          <h2>ARTICLE 1 - OBJET DE LA CONVENTION</h2>
          <p>La présente convention a pour objet de définir les conditions dans lesquelles le stagiaire effectuera son stage au sein de l'entreprise.</p>
          
          <h2>ARTICLE 2 - DURÉE ET PÉRIODE DU STAGE</h2>
          <p>Durée du stage : {{DUREE_STAGE}}</p>
          <p>Date de début : {{DATE_DEBUT}}</p>
          <p>Date de fin : {{DATE_FIN}}</p>
          
          <h2>ARTICLE 3 - ENCADREMENT</h2>
          <p>Le stagiaire sera encadré par : {{TUTEUR_NOM}}</p>
          
          <p>Fait le {{DATE_AUJOURD_HUI}}</p>
          
          <table style="width: 100%; margin-top: 50px;">
            <tr>
              <td style="text-align: center;">
                <p><strong>L'ENTREPRISE</strong></p>
                <p>{{TUTEUR_NOM}}</p>
              </td>
              <td style="text-align: center;">
                <p><strong>LE STAGIAIRE</strong></p>
                <p>{{STAGIAIRE_NOM}}</p>
              </td>
            </tr>
          </table>
        `,
        variables: ["STAGIAIRE_NOM", "STAGIAIRE_EMAIL", "TUTEUR_NOM", "ENTREPRISE", "DATE_DEBUT", "DATE_FIN"],
        is_active: true,
        created_by: "system",
      },
      {
        nom: "Attestation de stage",
        type: "attestation",
        contenu: `
          <div style="text-align: center; margin-bottom: 50px;">
            <h1>ATTESTATION DE STAGE</h1>
          </div>
          
          <p>Je soussigné(e), {{TUTEUR_NOM}}, {{TUTEUR_POSTE}} chez {{ENTREPRISE}}, atteste par la présente que :</p>
          
          <p style="margin: 30px 0; text-align: center; font-size: 18px;">
            <strong>{{STAGIAIRE_NOM}}</strong>
          </p>
          
          <p>a effectué un stage au sein de notre entreprise du {{DATE_DEBUT}} au {{DATE_FIN}}, soit une durée de {{DUREE_STAGE}}.</p>
          
          <p>Durant cette période, le stagiaire a fait preuve de sérieux, de motivation et a contribué positivement aux activités de l'entreprise.</p>
          
          <p>Cette attestation est délivrée pour servir et valoir ce que de droit.</p>
          
          <div style="margin-top: 80px; text-align: right;">
            <p>Fait le {{DATE_AUJOURD_HUI}}</p>
            <p style="margin-top: 50px;">
              <strong>{{TUTEUR_NOM}}</strong><br>
              {{TUTEUR_POSTE}}<br>
              {{ENTREPRISE}}
            </p>
          </div>
        `,
        variables: ["STAGIAIRE_NOM", "TUTEUR_NOM", "TUTEUR_POSTE", "ENTREPRISE", "DATE_DEBUT", "DATE_FIN"],
        is_active: true,
        created_by: "system",
      },
    ]

    for (const template of templates) {
      await this.supabase.from("templates").upsert(template, { onConflict: "nom" })
    }
  }
}

export const documentGenerator = new DocumentGeneratorService()
