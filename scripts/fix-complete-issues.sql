-- Script de correction complète pour tous les problèmes identifiés

-- 1. Correction de la fonction get_database_stats() 
DROP FUNCTION IF EXISTS get_database_stats();

CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
  table_name TEXT,
  record_count BIGINT,
  table_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    COALESCE(
      (SELECT n_tup_ins - n_tup_del 
       FROM pg_stat_user_tables 
       WHERE schemaname = 'public' AND relname = t.table_name), 
      0
    ) as record_count,
    pg_size_pretty(
      COALESCE(
        (SELECT pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname)) 
         FROM pg_stat_user_tables 
         WHERE schemaname = 'public' AND relname = t.table_name), 
        0
      )
    ) as table_size
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
  ORDER BY record_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Correction du script de vérification des tables
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name_var TEXT;
    required_tables TEXT[] := ARRAY[
        'users', 'stagiaires', 'demandes', 'documents', 'evaluations', 
        'notifications', 'templates', 'system_settings', 'audit_log',
        'demande_documents', 'email_notifications'
    ];
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES TABLES ===';
    
    FOREACH table_name_var IN ARRAY required_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name_var
        ) THEN
            missing_tables := array_append(missing_tables, table_name_var);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Tables manquantes: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les tables requises sont présentes';
    END IF;
END $$;

-- 3. Créer les tables manquantes si nécessaire
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Corriger la table demande_documents si elle n'existe pas
CREATE TABLE IF NOT EXISTS demande_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_id UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    type_document TEXT NOT NULL,
    obligatoire BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(demande_id, document_id)
);

-- 5. Ajouter les colonnes manquantes
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS chemin_fichier TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'approuve';

-- 6. Créer le bucket documents si nécessaire
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false) 
ON CONFLICT (id) DO NOTHING;

-- 7. Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can only see own documents" ON documents;
DROP POLICY IF EXISTS "Users can only insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can only update own documents" ON documents;
DROP POLICY IF EXISTS "Users can only delete own documents" ON documents;

-- 8. Créer des politiques permissives
DO $$
BEGIN
    -- Documents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow authenticated users to view documents') THEN
        CREATE POLICY "Allow authenticated users to view documents" ON documents
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow authenticated users to insert documents') THEN
        CREATE POLICY "Allow authenticated users to insert documents" ON documents
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow authenticated users to update documents') THEN
        CREATE POLICY "Allow authenticated users to update documents" ON documents
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow authenticated users to delete documents') THEN
        CREATE POLICY "Allow authenticated users to delete documents" ON documents
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;

    -- Stagiaires
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stagiaires' AND policyname = 'Allow all authenticated users to read stagiaires') THEN
        CREATE POLICY "Allow all authenticated users to read stagiaires" ON stagiaires
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stagiaires' AND policyname = 'Allow all authenticated users to insert stagiaires') THEN
        CREATE POLICY "Allow all authenticated users to insert stagiaires" ON stagiaires
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Storage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow authenticated uploads') THEN
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow authenticated downloads') THEN
        CREATE POLICY "Allow authenticated downloads" ON storage.objects
            FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
    END IF;
END $$;

-- 9. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_statut ON documents(statut);
CREATE INDEX IF NOT EXISTS idx_demande_documents_demande_id ON demande_documents(demande_id);
CREATE INDEX IF NOT EXISTS idx_demande_documents_document_id ON demande_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX IF NOT EXISTS idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);

-- 10. Mise à jour des fonctions de mise à jour automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer les triggers pour updated_at si ils n'existent pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_documents_updated_at') THEN
        CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stagiaires_updated_at') THEN
        CREATE TRIGGER update_stagiaires_updated_at BEFORE UPDATE ON stagiaires 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 11. Insérer des paramètres système par défaut
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES 
    ('site_name', '"Plateforme de Gestion des Stages"', 'Nom du site', 'general', true),
    ('max_file_size', '10485760', 'Taille maximale des fichiers (10MB)', 'upload', false),
    ('allowed_file_types', '["pdf", "doc", "docx", "jpg", "jpeg", "png", "txt"]', 'Types de fichiers autorisés', 'upload', false),
    ('email_notifications_enabled', 'true', 'Activer les notifications email', 'notifications', false)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

RAISE NOTICE '✅ Correction complète de la base de données terminée';
