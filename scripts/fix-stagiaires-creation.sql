-- Script pour corriger la création des stagiaires et l'assignation des tuteurs

-- 1. Créer une fonction pour assigner automatiquement un tuteur
CREATE OR REPLACE FUNCTION assign_tuteur_automatically()
RETURNS UUID AS $$
DECLARE
    tuteur_id UUID;
BEGIN
    -- Trouver le tuteur avec le moins de stagiaires
    SELECT u.id INTO tuteur_id
    FROM users u
    LEFT JOIN stagiaires s ON u.id = s.tuteur_id
    WHERE u.role = 'tuteur' AND u.is_active = true
    GROUP BY u.id
    ORDER BY COUNT(s.id) ASC
    LIMIT 1;
    
    -- Si aucun tuteur trouvé, prendre le premier tuteur actif
    IF tuteur_id IS NULL THEN
        SELECT id INTO tuteur_id
        FROM users
        WHERE role = 'tuteur' AND is_active = true
        LIMIT 1;
    END IF;
    
    RETURN tuteur_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer un trigger pour créer automatiquement une entrée stagiaire
CREATE OR REPLACE FUNCTION create_stagiaire_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Si c'est un nouveau utilisateur avec le rôle stagiaire
    IF NEW.role = 'stagiaire' AND (TG_OP = 'INSERT' OR OLD.role != 'stagiaire') THEN
        -- Vérifier si l'entrée stagiaire n'existe pas déjà
        IF NOT EXISTS (SELECT 1 FROM stagiaires WHERE user_id = NEW.id) THEN
            INSERT INTO stagiaires (
                user_id,
                entreprise,
                poste,
                tuteur_id,
                statut,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                'Bridge Technologies Solutions',
                'Stagiaire',
                assign_tuteur_automatically(),
                'actif',
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

-- 4. Corriger les stagiaires existants qui n'ont pas d'entrée dans la table stagiaires
INSERT INTO stagiaires (user_id, entreprise, poste, tuteur_id, statut, created_at, updated_at)
SELECT 
    u.id,
    'Bridge Technologies Solutions',
    'Stagiaire',
    assign_tuteur_automatically(),
    'actif',
    NOW(),
    NOW()
FROM users u
WHERE u.role = 'stagiaire' 
AND NOT EXISTS (SELECT 1 FROM stagiaires s WHERE s.user_id = u.id);

-- 5. Mettre à jour les stagiaires existants pour s'assurer qu'ils ont les bonnes valeurs
UPDATE stagiaires 
SET 
    entreprise = 'Bridge Technologies Solutions',
    poste = 'Stagiaire',
    updated_at = NOW()
WHERE entreprise IS NULL OR entreprise != 'Bridge Technologies Solutions'
   OR poste IS NULL OR poste != 'Stagiaire';

-- 6. Assigner des tuteurs aux stagiaires qui n'en ont pas
UPDATE stagiaires 
SET tuteur_id = assign_tuteur_automatically(),
    updated_at = NOW()
WHERE tuteur_id IS NULL;
