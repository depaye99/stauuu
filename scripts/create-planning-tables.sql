-- Création de la table planning_events
CREATE TABLE IF NOT EXISTS planning_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'autre',
  lieu VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'planifie',
  stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_planning_events_stagiaire_id ON planning_events(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_planning_events_date_debut ON planning_events(date_debut);
CREATE INDEX IF NOT EXISTS idx_planning_events_type ON planning_events(type);
CREATE INDEX IF NOT EXISTS idx_planning_events_status ON planning_events(status);

-- Politique RLS pour planning_events
ALTER TABLE planning_events ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins (accès complet)
CREATE POLICY "Admins can manage all planning events" ON planning_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politique pour les RH (accès complet)
CREATE POLICY "RH can manage all planning events" ON planning_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'rh'
    )
  );

-- Politique pour les tuteurs (accès aux événements de leurs stagiaires)
CREATE POLICY "Tuteurs can manage their stagiaires planning events" ON planning_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stagiaires 
      WHERE stagiaires.id = planning_events.stagiaire_id 
      AND stagiaires.tuteur_id = auth.uid()
    )
  );

-- Politique pour les stagiaires (lecture seule de leurs événements)
CREATE POLICY "Stagiaires can view their planning events" ON planning_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stagiaires 
      WHERE stagiaires.id = planning_events.stagiaire_id 
      AND stagiaires.user_id = auth.uid()
    )
  );

-- Ajout de colonnes manquantes dans la table evaluations
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS competences_techniques INTEGER DEFAULT 10;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS competences_relationnelles INTEGER DEFAULT 10;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS autonomie INTEGER DEFAULT 10;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS initiative INTEGER DEFAULT 10;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS ponctualite INTEGER DEFAULT 10;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS points_forts TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS axes_amelioration TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS objectifs_suivants TEXT;

-- Mise à jour de la fonction de trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour planning_events
CREATE TRIGGER update_planning_events_updated_at 
  BEFORE UPDATE ON planning_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données de test pour planning_events
INSERT INTO planning_events (title, description, date_debut, date_fin, type, lieu, status, stagiaire_id, created_by)
SELECT 
  'Formation ' || s.specialite,
  'Formation initiale en ' || s.specialite,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
  'formation',
  'Salle de formation A',
  'planifie',
  s.id,
  (SELECT id FROM users WHERE role = 'rh' LIMIT 1)
FROM stagiaires s
WHERE s.status = 'actif'
LIMIT 5;

INSERT INTO planning_events (title, description, date_debut, date_fin, type, lieu, status, stagiaire_id, created_by)
SELECT 
  'Évaluation mi-parcours',
  'Évaluation des compétences à mi-parcours',
  NOW() + INTERVAL '1 week',
  NOW() + INTERVAL '1 week' + INTERVAL '1 hour',
  'evaluation',
  'Bureau tuteur',
  'planifie',
  s.id,
  s.tuteur_id
FROM stagiaires s
WHERE s.status = 'actif' AND s.tuteur_id IS NOT NULL
LIMIT 3;
