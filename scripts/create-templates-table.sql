
-- Création de la table document_templates
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  contenu TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_templates_type ON document_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON document_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON document_templates(created_at DESC);

-- Politique RLS pour les templates
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Politique : Les RH et admins peuvent tout voir et modifier
CREATE POLICY "RH and admins can manage templates" ON document_templates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role IN ('admin', 'rh')
  )
);

-- Politique : Tous les utilisateurs authentifiés peuvent lire les templates
CREATE POLICY "Authenticated users can read templates" ON document_templates
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_templates_updated_at ON document_templates;
CREATE TRIGGER trigger_update_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- Insérer quelques modèles par défaut
INSERT INTO document_templates (nom, type, description, contenu) VALUES
(
  'Convention de stage standard',
  'convention',
  'Modèle standard de convention de stage tripartite',
  'CONVENTION DE STAGE

Entre les soussignés :

L''entreprise : {{entreprise}}
Adresse : {{adresse_entreprise}}
Représentée par : {{representant_entreprise}}

Et :

L''établissement : {{etablissement}}
Adresse : {{adresse_etablissement}}
Représenté par : {{representant_etablissement}}

Et :

Le stagiaire : {{nom_stagiaire}} {{prenom_stagiaire}}
Né(e) le : {{date_naissance}}
Adresse : {{adresse_stagiaire}}

Il a été convenu ce qui suit :

Article 1 - Objet
La présente convention a pour objet l''organisation d''un stage de formation au sein de l''entreprise {{entreprise}}.

Article 2 - Durée et période
Le stage se déroulera du {{date_debut}} au {{date_fin}}, soit une durée de {{duree_stage}}.

Article 3 - Missions
{{missions}}

Article 4 - Encadrement
Le stagiaire sera encadré par {{tuteur_entreprise}} au sein de l''entreprise et par {{tuteur_etablissement}} au sein de l''établissement.

Fait en trois exemplaires à {{lieu}}, le {{date_signature}}.

Signatures :'
),
(
  'Attestation de stage',
  'attestation', 
  'Modèle d''attestation de fin de stage',
  'ATTESTATION DE STAGE

Je soussigné(e) {{representant_entreprise}}, {{fonction_representant}}, 
de l''entreprise {{entreprise}}, située {{adresse_entreprise}},

Atteste que {{prenom_stagiaire}} {{nom_stagiaire}}, né(e) le {{date_naissance}},
a effectué un stage au sein de notre entreprise du {{date_debut}} au {{date_fin}}.

Durant cette période, {{prenom_stagiaire}} a été chargé(e) des missions suivantes :
{{missions}}

Ce stage s''est déroulé de manière satisfaisante.

Cette attestation est délivrée pour servir et valoir ce que de droit.

Fait à {{lieu}}, le {{date_delivrance}}.

{{representant_entreprise}}
{{fonction_representant}}
Signature et cachet de l''entreprise'
);

COMMENT ON TABLE document_templates IS 'Modèles de documents pour la génération automatique';
