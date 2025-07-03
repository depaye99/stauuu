
-- Création de la table planning
CREATE TABLE IF NOT EXISTS planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) DEFAULT 'autre' CHECK (type IN ('formation', 'reunion', 'evaluation', 'projet', 'presentation', 'autre')),
    lieu VARCHAR(255),
    status VARCHAR(50) DEFAULT 'planifie' CHECK (status IN ('planifie', 'en_cours', 'termine', 'annule')),
    stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
    tuteur_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_planning_stagiaire_id ON planning(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_planning_tuteur_id ON planning(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_planning_date_debut ON planning(date_debut);

-- Assurer que RLS est activé
ALTER TABLE planning ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour planning
DROP POLICY IF EXISTS "Users can view relevant planning" ON planning;
DROP POLICY IF EXISTS "Tuteurs can manage their planning" ON planning;

CREATE POLICY "Users can view relevant planning" ON planning
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            tuteur_id = auth.uid() OR
            stagiaire_id IN (SELECT id FROM stagiaires WHERE user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

CREATE POLICY "Tuteurs can manage their planning" ON planning
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            tuteur_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_planning_updated_at 
    BEFORE UPDATE ON planning 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Table planning créée avec succès!' as status;
