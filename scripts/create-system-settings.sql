-- Créer la table system_settings manquante
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer des paramètres par défaut
INSERT INTO system_settings (key, value, description) VALUES
('company_name', 'Bridge Technologies Solutions', 'Nom de l''entreprise'),
('app_name', 'Stage Manager', 'Nom de l''application'),
('default_stage_duration', '3', 'Durée par défaut du stage en mois'),
('notification_email', 'admin@bridge-tech.com', 'Email de notification'),
('max_file_size', '10485760', 'Taille maximale des fichiers en bytes (10MB)'),
('allowed_file_types', 'pdf,doc,docx,jpg,jpeg,png', 'Types de fichiers autorisés')
ON CONFLICT (key) DO NOTHING;

-- Désactiver RLS pour development
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Créer une fonction pour créer la table via RPC
CREATE OR REPLACE FUNCTION create_system_settings_table()
RETURNS void AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
    
    INSERT INTO system_settings (key, value, description) VALUES
    ('company_name', 'Bridge Technologies Solutions', 'Nom de l''entreprise'),
    ('app_name', 'Stage Manager', 'Nom de l''application'),
    ('default_stage_duration', '3', 'Durée par défaut du stage en mois'),
    ('notification_email', 'admin@bridge-tech.com', 'Email de notification')
    ON CONFLICT (key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
