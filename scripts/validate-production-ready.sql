
-- Script de validation pour s'assurer que la base de données est prête pour la production

-- 1. Vérifier l'existence de toutes les tables requises
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name_var TEXT;
    required_tables TEXT[] := ARRAY[
        'users', 'stagiaires', 'demandes', 'documents', 'evaluations', 
        'notifications', 'templates', 'planning', 'system_settings'
    ];
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES TABLES REQUISES ===';
    
    FOREACH table_name_var IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name_var
        ) THEN
            missing_tables := array_append(missing_tables, table_name_var);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '❌ Tables manquantes: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les tables requises sont présentes';
    END IF;
END $$;

-- 2. Vérifier les politiques RLS
DO $$
DECLARE
    table_name TEXT;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES POLITIQUES RLS ===';
    
    FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = table_name;
        
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = table_name;
        
        IF rls_enabled THEN
            RAISE NOTICE '✅ Table %: RLS activé, % politiques', table_name, policy_count;
        ELSE
            RAISE NOTICE '⚠️ Table %: RLS désactivé', table_name;
        END IF;
    END LOOP;
END $$;

-- 3. Vérifier les contraintes de clés étrangères
SELECT 
    'Contraintes de clés étrangères' as check_type,
    COUNT(*) as count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';

-- 4. Vérifier les index
SELECT 
    'Index créés' as check_type,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public';

-- 5. Vérifier les triggers
SELECT 
    'Triggers actifs' as check_type,
    COUNT(*) as count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND NOT t.tgisinternal;

-- 6. Vérifier les colonnes UUID
DO $$
DECLARE
    table_name TEXT;
    column_name TEXT;
    data_type TEXT;
    issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES TYPES UUID ===';
    
    FOR table_name, column_name, data_type IN 
        SELECT t.table_name, c.column_name, c.data_type
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        AND c.column_name LIKE '%_id'
        AND t.table_type = 'BASE TABLE'
    LOOP
        IF data_type != 'uuid' THEN
            issues := array_append(issues, table_name || '.' || column_name || ' (' || data_type || ')');
        END IF;
    END LOOP;
    
    IF array_length(issues, 1) > 0 THEN
        RAISE NOTICE '❌ Colonnes ID non-UUID: %', array_to_string(issues, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes ID sont en UUID';
    END IF;
END $$;

-- 7. Statistiques des tables
SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_tup_ins - n_tup_del DESC;

-- 8. Vérifier les buckets de stockage
SELECT 
    'Buckets de stockage' as check_type,
    COUNT(*) as count
FROM storage.buckets;

-- 9. Vérifier les paramètres système
SELECT 
    'Paramètres système' as check_type,
    COUNT(*) as count
FROM system_settings;

RAISE NOTICE '=== VALIDATION TERMINÉE ===';
RAISE NOTICE 'Vérifiez les résultats ci-dessus pour vous assurer que tout est correct avant la production.';
