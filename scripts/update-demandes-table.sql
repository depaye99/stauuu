-- Ajouter les colonnes manquantes à la table demandes pour stocker les données spécifiques
ALTER TABLE demandes 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Ajouter un commentaire pour expliquer l'utilisation de metadata
COMMENT ON COLUMN demandes.metadata IS 'Stockage des données spécifiques selon le type de demande (congé, prolongation, etc.)';

-- Mettre à jour les contraintes de type pour inclure les nouveaux types
ALTER TABLE demandes 
DROP CONSTRAINT IF EXISTS demandes_type_check;

ALTER TABLE demandes 
ADD CONSTRAINT demandes_type_check 
CHECK (type IN ('stage_academique', 'stage_professionnel', 'conge', 'prolongation', 'attestation', 'demande_conge', 'demande_prolongation'));

-- Créer un index sur la colonne metadata pour les requêtes JSON
CREATE INDEX IF NOT EXISTS idx_demandes_metadata ON demandes USING GIN (metadata);

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'demandes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Afficher un message de confirmation
SELECT 'Table demandes mise à jour avec succès!' as status;
