-- Script pour corriger la création automatique des stagiaires lors de l'inscription

-- 1. Fonction pour assigner automatiquement un tuteur
CREATE OR REPLACE FUNCTION assign_tuteur_automatically()
RETURNS UUID AS $$
DECLARE
    tuteur_id UUID;
BEGIN
    SELECT u.id INTO tuteur_id
    FROM users u
    LEFT JOIN stagiaires s ON s.tuteur_id = u.id
    WHERE u.role = 'tuteur' AND u.is_active = true
    GROUP BY u.id, u.name
    ORDER BY COUNT(s.id) ASC, u.name ASC
    LIMIT 1;
    
    RETURN tuteur_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger pour créer automatiquement une entrée stagiaire
CREATE OR REPLACE FUNCTION create_stagiaire_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Si c'est un nouveau utilisateur avec le rôle stagiaire
    IF NEW.role = 'stagiaire' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role != 'stagiaire')) THEN
        -- Vérifier si l'entrée stagiaire n'existe pas déjà
        IF NOT EXISTS (SELECT 1 FROM stagiaires WHERE user_id = NEW.id) THEN
            INSERT INTO stagiaires (
                user_id,
                entreprise,
                poste,
                tuteur_id,
                statut,
                date_debut,
                date_fin,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                'Bridge Technologies Solutions',
                'Stagiaire',
                assign_tuteur_automatically(),
                'actif',
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '6 months',
                NOW(),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger
DROP TRIGGER IF EXISTS trigger_create_stagiaire_entry ON users;
CREATE TRIGGER trigger_create_stagiaire_entry
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_stagiaire_entry();

-- 4. Corriger les utilisateurs stagiaires existants sans entrée
INSERT INTO stagiaires (user_id, entreprise, poste, tuteur_id, statut, date_debut, date_fin, created_at, updated_at)
SELECT 
    u.id,
    'Bridge Technologies Solutions',
    'Stagiaire',
    assign_tuteur_automatically(),
    'actif',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    NOW(),
    NOW()
FROM users u
WHERE u.role = 'stagiaire' 
AND NOT EXISTS (SELECT 1 FROM stagiaires s WHERE s.user_id = u.id);

-- 5. Vérification
SELECT 
    'Users with role stagiaire' as type,
    COUNT(*) as count
FROM users WHERE role = 'stagiaire'
UNION ALL
SELECT 
    'Entries in stagiaires table' as type,
    COUNT(*) as count
FROM stagiaires;
