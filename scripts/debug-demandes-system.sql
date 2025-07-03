-- Script pour débugger et corriger le système de demandes

-- 1. Vérifier la structure de la table demandes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'demandes' 
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes et relations
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'demandes';

-- 3. Vérifier les données existantes
SELECT 
    d.*,
    s.user_id as stagiaire_user_id,
    u.email as stagiaire_email
FROM demandes d
LEFT JOIN stagiaires s ON d.stagiaire_id = s.id
LEFT JOIN users u ON s.user_id = u.id
ORDER BY d.created_at DESC
LIMIT 10;

-- 4. Vérifier les stagiaires existants
SELECT 
    s.*,
    u.email,
    u.role
FROM stagiaires s
JOIN users u ON s.user_id = u.id
WHERE u.role = 'stagiaire'
ORDER BY s.created_at DESC;

-- 5. Créer la table demandes si elle n'existe pas ou la corriger
CREATE TABLE IF NOT EXISTS demandes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
    tuteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('stage_academique', 'stage_professionnel', 'conge', 'prolongation', 'attestation')),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuvee', 'rejetee', 'en_cours', 'terminee')),
    date_demande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_reponse TIMESTAMP WITH TIME ZONE,
    commentaire_reponse TEXT,
    documents_requis JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Activer RLS
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS
DROP POLICY IF EXISTS "Stagiaires peuvent voir leurs demandes" ON demandes;
CREATE POLICY "Stagiaires peuvent voir leurs demandes" ON demandes
    FOR SELECT USING (
        stagiaire_id IN (
            SELECT id FROM stagiaires WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Stagiaires peuvent créer leurs demandes" ON demandes;
CREATE POLICY "Stagiaires peuvent créer leurs demandes" ON demandes
    FOR INSERT WITH CHECK (
        stagiaire_id IN (
            SELECT id FROM stagiaires WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tuteurs peuvent voir les demandes de leurs stagiaires" ON demandes;
CREATE POLICY "Tuteurs peuvent voir les demandes de leurs stagiaires" ON demandes
    FOR SELECT USING (
        tuteur_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh')
        )
    );

DROP POLICY IF EXISTS "Admins et RH peuvent tout voir" ON demandes;
CREATE POLICY "Admins et RH peuvent tout voir" ON demandes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh')
        )
    );

-- 8. Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_demandes_updated_at ON demandes;
CREATE TRIGGER update_demandes_updated_at
    BEFORE UPDATE ON demandes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Insérer des données de test si aucune demande n'existe
DO $$
DECLARE
    test_stagiaire_id UUID;
    test_tuteur_id UUID;
BEGIN
    -- Récupérer un stagiaire de test
    SELECT s.id INTO test_stagiaire_id
    FROM stagiaires s
    JOIN users u ON s.user_id = u.id
    WHERE u.role = 'stagiaire'
    LIMIT 1;
    
    -- Récupérer un tuteur de test
    SELECT id INTO test_tuteur_id
    FROM users
    WHERE role = 'tuteur'
    LIMIT 1;
    
    -- Insérer une demande de test si on a trouvé un stagiaire
    IF test_stagiaire_id IS NOT NULL THEN
        INSERT INTO demandes (stagiaire_id, tuteur_id, type, titre, description)
        VALUES (
            test_stagiaire_id,
            test_tuteur_id,
            'stage_academique',
            'Demande de stage de test',
            'Ceci est une demande de test pour vérifier le système'
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Demande de test créée pour le stagiaire %', test_stagiaire_id;
    ELSE
        RAISE NOTICE 'Aucun stagiaire trouvé pour créer une demande de test';
    END IF;
END $$;

-- 10. Vérifier le résultat final
SELECT 
    'Demandes créées' as status,
    COUNT(*) as count
FROM demandes;
