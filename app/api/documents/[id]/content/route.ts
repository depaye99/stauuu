
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le document
    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    const canAccess = 
      userProfile?.role === 'rh' || 
      userProfile?.role === 'admin' || 
      document.user_id === session.user.id ||
      (document.is_public && userProfile?.role === 'tuteur')

    if (!canAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Pour les documents générés, recréer le contenu
    if (document.statut === 'genere') {
      // Récupérer les données du stagiaire
      const { data: stagiaire, error: stagiaireError } = await supabase
        .from("stagiaires")
        .select(`
          *,
          users!stagiaires_user_id_fkey(id, name, email, phone),
          tuteur:users!stagiaires_tuteur_id_fkey(id, name, email, phone)
        `)
        .eq("user_id", document.user_id)
        .single()

      if (stagiaireError || !stagiaire) {
        return NextResponse.json({ error: "Données stagiaire non trouvées" }, { status: 404 })
      }

      let content = ""
      if (document.type_fichier === 'attestation') {
        content = generateAttestationHTML(stagiaire)
      } else if (document.type_fichier === 'convention') {
        content = generateConventionHTML(stagiaire)
      }

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${document.nom}"`,
        },
      })
    }

    // Pour les autres documents, rediriger vers l'URL de stockage
    return NextResponse.redirect(document.url || '#')
  } catch (error) {
    console.error("Erreur récupération contenu document:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

function generateAttestationHTML(stagiaire: any): string {
  const dateDebut = stagiaire.date_debut ? new Date(stagiaire.date_debut).toLocaleDateString('fr-FR') : 'Non spécifiée'
  const dateFin = stagiaire.date_fin ? new Date(stagiaire.date_fin).toLocaleDateString('fr-FR') : 'Non spécifiée'

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Attestation de Stage</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.8;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border: 3px solid #000;
            padding: 20px;
            background: #f8f9fa;
        }
        .republic { 
            font-size: 14px; 
            font-weight: bold; 
            margin-bottom: 20px;
        }
        .title { 
            font-size: 28px; 
            font-weight: bold; 
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 20px 0;
        }
        .content {
            margin: 30px 0;
            font-size: 16px;
            text-align: justify;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 80px;
        }
        .signature-left, .signature-right {
            text-align: center;
            width: 45%;
        }
        .signature-title {
            font-weight: bold;
            margin-bottom: 20px;
        }
        .blank-line {
            border-bottom: 1px solid #000;
            margin: 0 10px;
            display: inline-block;
            width: 200px;
            height: 20px;
        }
        .location-date {
            text-align: right;
            margin: 30px 0;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="republic">République Algérienne Démocratique et Populaire</div>
        <div class="title">Attestation de stage</div>
    </div>
    
    <div class="content">
        <p>Je soussigné(e) (le responsable de stage) <span class="blank-line"></span></p>
        
        <p>Que l'étudiant (e) <strong>${stagiaire.users?.name || 'N/A'}</strong> né (e) le <span class="blank-line"></span> à <span class="blank-line"></span></p>
        
        <p>Inscrit(e) à la Faculté de Technologie, Université Hassiba Benbouali Chlef :</p>
        
        <p>A effectué un stage de fin de formation dans la filière <span class="blank-line"></span></p>
        
        <p>À l'établissement, administration (...) <strong>Bridge Technologies Solutions</strong></p>
        
        <p>Durant la période de <strong>${dateDebut}</strong> à <strong>${dateFin}</strong></p>
    </div>
    
    <div class="location-date">
        Fait à ........................le.........................
    </div>
    
    <div class="signatures">
        <div class="signature-left">
            <div class="signature-title">Le Doyen de la Faculté<br>de Technologie</div>
            <div style="height: 80px;"></div>
        </div>
        <div class="signature-right">
            <div class="signature-title">Le Responsable de l'établissement ou<br>l'administration d'accueil</div>
            <div style="height: 60px;"></div>
            <div><strong>${stagiaire.tuteur?.name || 'Non assigné'}</strong></div>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 40px; font-style: italic; font-size: 14px;">
        Cette attestation est délivrée pour servir et faire valoir que de droit
    </div>
</body>
</html>`
}

function generateConventionHTML(stagiaire: any): string {
  const dateDebut = stagiaire.date_debut ? new Date(stagiaire.date_debut).toLocaleDateString('fr-FR') : 'Non spécifiée'
  const dateFin = stagiaire.date_fin ? new Date(stagiaire.date_fin).toLocaleDateString('fr-FR') : 'Non spécifiée'
  const dateAujourdhui = new Date().toLocaleDateString('fr-FR')

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Convention de Stage</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .section { margin-bottom: 30px; }
        .signature { display: flex; justify-content: space-between; margin-top: 60px; }
        .signature-box { text-align: center; width: 45%; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONVENTION DE STAGE</h1>
    </div>
    
    <div class="section">
        <h2>ENTRE LES SOUSSIGNÉS :</h2>
        <p><strong>L'ENTREPRISE :</strong> Bridge Technologies Solutions</p>
        <p><strong>Représentée par :</strong> ${stagiaire.tuteur?.name || 'Non assigné'}</p>
        <p><strong>Email :</strong> ${stagiaire.tuteur?.email || 'N/A'}</p>
    </div>
    
    <div class="section">
        <p><strong>LE STAGIAIRE :</strong></p>
        <p><strong>Nom :</strong> ${stagiaire.users?.name || 'N/A'}</p>
        <p><strong>Email :</strong> ${stagiaire.users?.email || 'N/A'}</p>
        <p><strong>Téléphone :</strong> ${stagiaire.users?.phone || 'N/A'}</p>
    </div>
    
    <div class="section">
        <h2>ARTICLE 1 - DURÉE ET PÉRIODE DU STAGE</h2>
        <p><strong>Date de début :</strong> ${dateDebut}</p>
        <p><strong>Date de fin :</strong> ${dateFin}</p>
        <p><strong>Poste :</strong> ${stagiaire.poste || 'Stagiaire'}</p>
    </div>
    
    <div class="section">
        <h2>ARTICLE 2 - ENCADREMENT</h2>
        <p>Le stagiaire sera encadré par : <strong>${stagiaire.tuteur?.name || 'Non assigné'}</strong></p>
    </div>
    
    <p style="margin-top: 40px;">Fait le ${dateAujourdhui}</p>
    
    <div class="signature">
        <div class="signature-box">
            <p><strong>L'ENTREPRISE</strong></p>
            <br><br>
            <p>${stagiaire.tuteur?.name || 'Non assigné'}</p>
        </div>
        <div class="signature-box">
            <p><strong>LE STAGIAIRE</strong></p>
            <br><br>
            <p>${stagiaire.users?.name || 'N/A'}</p>
        </div>
    </div>
</body>
</html>`
}
