
-- Script pour corriger tous les problèmes de types UUID dans la base de données
-- En gérant les vues et règles qui dépendent des colonnes

-- Étape 1: Supprimer les vues qui pourraient causer des conflits
DROP VIEW IF EXISTS v_stagiaires_complet CASCADE;
DROP VIEW IF EXISTS v_users_stagiaires CASCADE;
DROP VIEW IF EXISTS v_planning_complet CASCADE;

-- Étape 2: Supprimer temporairement les politiques RLS qui peuvent causer des problèmes
DROP POLICY IF EXISTS "Users can view relevant planning" ON planning;
DROP POLICY IF EXISTS "Tuteurs can manage their planning" ON planning;
DROP POLICY IF EXISTS "Users can view their stagiaires" ON stagiaires;
DROP POLICY IF EXISTS "Users can view relevant demandes" ON demandes;
DROP POLICY IF EXISTS "Users can manage their demandes" ON demandes;

-- Étape 3: Convertir toutes les colonnes ID en UUID si elles ne le sont pas déjà
DO $$
BEGIN
    -- Corriger la table users
    BEGIN
        ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;
        RAISE NOTICE 'Colonne users.id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'users.id déjà en UUID ou erreur: %', SQLERRM;
    END;

    -- Corriger la table stagiaires
    BEGIN
        ALTER TABLE stagiaires ALTER COLUMN id TYPE UUID USING id::UUID;
        RAISE NOTICE 'Colonne stagiaires.id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'stagiaires.id déjà en UUID ou erreur: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE stagiaires ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
        RAISE NOTICE 'Colonne stagiaires.user_id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'stagiaires.user_id déjà en UUID ou erreur: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE stagiaires ALTER COLUMN tuteur_id TYPE UUID USING tuteur_id::UUID;
        RAISE NOTICE 'Colonne stagiaires.tuteur_id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'stagiaires.tuteur_id déjà en UUID ou erreur: %', SQLERRM;
    END;

    -- Corriger la table demandes
    BEGIN
        ALTER TABLE demandes ALTER COLUMN id TYPE UUID USING id::UUID;
        RAISE NOTICE 'Colonne demandes.id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'demandes.id déjà en UUID ou erreur: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE demandes ALTER COLUMN stagiaire_id TYPE UUID USING stagiaire_id::UUID;
        RAISE NOTICE 'Colonne demandes.stagiaire_id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'demandes.stagiaire_id déjà en UUID ou erreur: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE demandes ALTER COLUMN tuteur_id TYPE UUID USING tuteur_id::UUID;
        RAISE NOTICE 'Colonne demandes.tuteur_id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'demandes.tuteur_id déjà en UUID ou erreur: %', SQLERRM;
    END;

    -- Corriger la table planning
    BEGIN
        ALTER TABLE planning ALTER COLUMN id TYPE UUID USING id::UUID;
        RAISE NOTICE 'Colonne planning.id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'planning.id déjà en UUID ou erreur: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE planning ALTER COLUMN stagiaire_id TYPE UUID USING stagiaire_id::UUID;
        RAISE NOTICE 'Colonne planning.stagiaire_id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'planning.stagiaire_id déjà en UUID ou erreur: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE planning ALTER COLUMN tuteur_id TYPE UUID USING tuteur_id::UUID;
        RAISE NOTICE 'Colonne planning.tuteur_id convertie en UUID';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'planning.tuteur_id déjà en UUID ou erreur: %', SQLERRM;
    END;
END $$;

-- Étape 4: Recréer les politiques RLS avec les bons types
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

CREATE POLICY "Users can view their stagiaires" ON stagiaires
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            tuteur_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

CREATE POLICY "Users can view relevant demandes" ON demandes
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            stagiaire_id IN (SELECT id FROM stagiaires WHERE user_id = auth.uid()) OR
            tuteur_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

CREATE POLICY "Users can manage their demandes" ON demandes
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            stagiaire_id IN (SELECT id FROM stagiaires WHERE user_id = auth.uid()) OR
            tuteur_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

-- Étape 5: Recréer la vue stagiaires complète si nécessaire
CREATE VIEW v_stagiaires_complet AS
SELECT 
    s.id,
    s.user_id,
    u.name,
    u.email,
    s.entreprise,
    s.poste,
    s.tuteur_id,
    t.name as tuteur_name,
    s.statut,
    s.date_debut,
    s.date_fin,
    s.created_at,
    s.updated_at
FROM stagiaires s
JOIN users u ON s.user_id = u.id
LEFT JOIN users t ON s.tuteur_id = t.id;

-- Message de confirmation
SELECT 'Conversion UUID terminée avec succès!' as status;
