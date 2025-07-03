-- Correction complète de la base de données

-- 1. Corriger les politiques RLS pour permettre l'accès aux données
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stagiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Stagiaires can view own data" ON stagiaires;
DROP POLICY IF EXISTS "RH can manage stagiaires" ON stagiaires;
DROP POLICY IF EXISTS "Users can view own demandes" ON demandes;
DROP POLICY IF EXISTS "RH can manage demandes" ON demandes;
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;
DROP POLICY IF EXISTS "Users can view own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

-- Créer des politiques plus permissives
CREATE POLICY "Authenticated users can view users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id OR 
                     EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'rh')));

CREATE POLICY "Authenticated users can view stagiaires" ON stagiaires
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and RH can manage stagiaires" ON stagiaires
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'rh')));

CREATE POLICY "Tuteurs can update their stagiaires" ON stagiaires
    FOR UPDATE USING (tuteur_id = auth.uid()::text);

CREATE POLICY "Authenticated users can view demandes" ON demandes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own demandes" ON demandes
    FOR ALL USING (stagiaire_id = auth.uid()::text OR 
                   EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'rh', 'tuteur')));

CREATE POLICY "Authenticated users can manage documents" ON documents
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view evaluations" ON evaluations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage relevant evaluations" ON evaluations
    FOR ALL USING (stagiaire_id = auth.uid()::text OR 
                   evaluateur_id = auth.uid()::text OR
                   EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'rh')));

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid()::text);

-- 2. Corriger la table stagiaires pour s'assurer qu'elle a les bonnes colonnes
ALTER TABLE stagiaires 
ADD COLUMN IF NOT EXISTS entreprise TEXT,
ADD COLUMN IF NOT EXISTS poste TEXT,
ADD COLUMN IF NOT EXISTS date_debut DATE,
ADD COLUMN IF NOT EXISTS date_fin DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX IF NOT EXISTS idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_stagiaire_id ON demandes(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_demandes_tuteur_id ON demandes(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_stagiaire_id ON evaluations(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluateur_id ON evaluations(evaluateur_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 4. Corriger les politiques de storage pour les documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques de storage
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own documents" ON storage.objects
    FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete own documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = owner);

-- 5. Créer des utilisateurs de test si ils n'existent pas
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
VALUES 
    ('admin-test-id', 'admin@bridge.com', 'Admin Test', 'admin', true, NOW(), NOW()),
    ('rh-test-id', 'rh@bridge.com', 'RH Test', 'rh', true, NOW(), NOW()),
    ('tuteur-test-id', 'tuteur@bridge.com', 'Tuteur Test', 'tuteur', true, NOW(), NOW()),
    ('stagiaire-test-id', 'stagiaire@bridge.com', 'Stagiaire Test', 'stagiaire', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 6. Créer un stagiaire de test
INSERT INTO stagiaires (id, user_id, tuteur_id, entreprise, poste, statut, date_debut, date_fin, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'stagiaire-test-id',
    'tuteur-test-id',
    'Bridge Technologies',
    'Développeur Junior',
    'actif',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 7. Vérifier que toutes les tables existent
CREATE TABLE IF NOT EXISTS planning_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('stage', 'conge', 'formation', 'reunion')),
    stagiaire_id UUID REFERENCES users(id),
    tuteur_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'planifie' CHECK (status IN ('planifie', 'en_cours', 'termine', 'annule')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour planning_events
CREATE INDEX IF NOT EXISTS idx_planning_events_stagiaire_id ON planning_events(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_planning_events_tuteur_id ON planning_events(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_planning_events_start_date ON planning_events(start_date);

-- Politique RLS pour planning_events
ALTER TABLE planning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view planning events" ON planning_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "RH and admins can manage planning events" ON planning_events
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'rh')));

-- 8. Fonction pour synchroniser les utilisateurs auth avec la table users
CREATE OR REPLACE FUNCTION sync_user_to_users_table()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id::text,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'stagiaire'),
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour synchroniser automatiquement
DROP TRIGGER IF EXISTS sync_user_trigger ON auth.users;
CREATE TRIGGER sync_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_to_users_table();

COMMIT;
