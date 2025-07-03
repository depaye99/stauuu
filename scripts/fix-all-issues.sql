-- Script pour corriger tous les problèmes identifiés
-- Exécuter ce script pour réparer la base de données

-- 1. Vérifier et créer les tables manquantes si nécessaire
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);

-- 3. Vérifier que la table users a tous les champs nécessaires
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. Vérifier que la table stagiaires a tous les champs nécessaires
ALTER TABLE stagiaires ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. Créer des politiques RLS pour les notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les admins puissent créer des notifications
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
CREATE POLICY "Admins can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'rh')
        )
    );

-- Politique pour que les utilisateurs puissent marquer leurs notifications comme lues
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Insérer quelques notifications de test pour chaque utilisateur
INSERT INTO notifications (user_id, titre, message, type)
SELECT 
    u.id,
    'Bienvenue sur la plateforme',
    'Votre compte a été créé avec succès. Explorez les fonctionnalités disponibles.',
    'info'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.user_id = u.id 
    AND n.titre = 'Bienvenue sur la plateforme'
);

-- 7. Créer une fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION clean_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND lu = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Vérifier l'intégrité des données
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
UPDATE users SET created_at = NOW() WHERE created_at IS NULL;

-- 9. Optimiser les requêtes avec des vues
CREATE OR REPLACE VIEW stagiaires_with_details AS
SELECT 
    s.*,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    t.name as tuteur_name,
    t.email as tuteur_email
FROM stagiaires s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN users t ON s.tuteur_id = t.id;

-- 10. Créer des triggers pour maintenir updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables principales
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stagiaires_updated_at ON stagiaires;
CREATE TRIGGER update_stagiaires_updated_at
    BEFORE UPDATE ON stagiaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Afficher un résumé des corrections
SELECT 
    'Corrections appliquées avec succès' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM stagiaires) as total_stagiaires,
    (SELECT COUNT(*) FROM notifications) as total_notifications;
