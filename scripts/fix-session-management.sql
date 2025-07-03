-- Script pour améliorer la gestion des sessions

-- 1. Nettoyer les sessions expirées (optionnel, Supabase le fait automatiquement)
-- Mais on peut ajouter des index pour améliorer les performances

-- 2. Créer des index pour améliorer les performances des requêtes d'authentification
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX IF NOT EXISTS idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);

-- 3. Créer une vue pour simplifier les requêtes de stagiaires avec tuteurs
CREATE OR REPLACE VIEW stagiaires_with_tuteur AS
SELECT 
    s.*,
    u.name as stagiaire_name,
    u.email as stagiaire_email,
    t.name as tuteur_name,
    t.email as tuteur_email
FROM stagiaires s
JOIN users u ON s.user_id = u.id
LEFT JOIN users t ON s.tuteur_id = t.id;

-- 4. Fonction pour nettoyer les données utilisateur incohérentes
CREATE OR REPLACE FUNCTION cleanup_user_data()
RETURNS void AS $$
BEGIN
    -- Désactiver les utilisateurs sans email
    UPDATE users 
    SET is_active = false 
    WHERE email IS NULL OR email = '';
    
    -- Corriger les rôles invalides
    UPDATE users 
    SET role = 'stagiaire' 
    WHERE role NOT IN ('admin', 'rh', 'tuteur', 'stagiaire');
    
    -- Supprimer les entrées stagiaires orphelines
    DELETE FROM stagiaires 
    WHERE user_id NOT IN (SELECT id FROM users);
    
    -- Supprimer les entrées stagiaires pour des non-stagiaires
    DELETE FROM stagiaires 
    WHERE user_id IN (SELECT id FROM users WHERE role != 'stagiaire');
END;
$$ LANGUAGE plpgsql;

-- 5. Exécuter le nettoyage
SELECT cleanup_user_data();
