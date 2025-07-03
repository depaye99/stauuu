-- Corriger toutes les permissions et données

-- 1. Mettre à jour les politiques RLS pour être plus permissives
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Authenticated users can read users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile or admins can update all" ON users
    FOR UPDATE USING (
        auth.uid()::text = id OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin')
    );

-- 2. Corriger les politiques pour les évaluations
DROP POLICY IF EXISTS "Users can view relevant evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can manage relevant evaluations" ON evaluations;

CREATE POLICY "Authenticated users can read evaluations" ON evaluations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage evaluations" ON evaluations
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Créer la table de planning si elle n'existe pas
CREATE TABLE IF NOT EXISTS planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    stagiaire_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tuteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) DEFAULT 'formation' CHECK (type IN ('formation', 'reunion', 'evaluation', 'autre')),
    statut VARCHAR(50) DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la table planning
CREATE INDEX IF NOT EXISTS idx_planning_stagiaire_id ON planning(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_planning_tuteur_id ON planning(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_planning_date_debut ON planning(date_debut);

-- Politiques RLS pour planning
ALTER TABLE planning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage planning" ON planning
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Corriger le champ evaluateur_id dans evaluations si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evaluations' AND column_name = 'evaluateur_id') THEN
        ALTER TABLE evaluations ADD COLUMN evaluateur_id UUID REFERENCES users(id);
        UPDATE evaluations SET evaluateur_id = tuteur_id WHERE evaluateur_id IS NULL;
    END IF;
END $$;

-- 5. Synchroniser les données auth.users avec users
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
    COALESCE(au.raw_user_meta_data->>'role', 'stagiaire')::text as role,
    true as is_active,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- 6. Créer des entrées stagiaires pour les utilisateurs avec le rôle stagiaire
INSERT INTO stagiaires (user_id, entreprise, poste, statut, created_at, updated_at)
SELECT 
    u.id,
    'Bridge Technologies Solutions' as entreprise,
    'Stagiaire' as poste,
    'actif' as statut,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
LEFT JOIN stagiaires s ON u.id = s.user_id
WHERE u.role = 'stagiaire' AND s.user_id IS NULL;

-- 7. Désactiver temporairement la confirmation d'email pour les tests
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

NOTIFY pgrst, 'reload schema';
