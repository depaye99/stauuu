-- Table pour les paramètres système (admin)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les paramètres utilisateur
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Paramètres système par défaut
INSERT INTO system_settings (key, value, description, category) VALUES
('company_name', '"Bridge Technologies Solutions"', 'Nom de l''entreprise', 'company'),
('company_address', '"123 Rue de la Technologie, Yaoundé, Cameroun"', 'Adresse de l''entreprise', 'company'),
('company_phone', '"+237 123 456 789"', 'Téléphone de l''entreprise', 'company'),
('company_email', '"contact@bridgetech.cm"', 'Email de l''entreprise', 'company'),
('max_stagiaires_per_tuteur', '5', 'Nombre maximum de stagiaires par tuteur', 'stages'),
('stage_duration_months', '6', 'Durée par défaut des stages en mois', 'stages'),
('notification_email_enabled', 'true', 'Activer les notifications par email', 'notifications'),
('auto_assign_tuteur', 'true', 'Assignation automatique des tuteurs', 'stages'),
('require_document_approval', 'true', 'Approbation requise pour les documents', 'workflow'),
('session_timeout_hours', '8', 'Durée de session en heures', 'security')
ON CONFLICT (key) DO NOTHING;

-- RLS pour system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- RLS pour user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (user_id = auth.uid());

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
