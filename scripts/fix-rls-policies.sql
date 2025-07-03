-- Corriger les politiques RLS pour les documents et autres tables

-- 1. Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can only see own documents" ON documents;
DROP POLICY IF EXISTS "Users can only insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can only update own documents" ON documents;
DROP POLICY IF EXISTS "Users can only delete own documents" ON documents;

-- 2. Créer des politiques plus permissives pour les documents
CREATE POLICY "Allow authenticated users to view documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert documents" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update documents" ON documents
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete documents" ON documents
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Vérifier et corriger les politiques pour les autres tables
-- Stagiaires
DROP POLICY IF EXISTS "Enable read access for all users" ON stagiaires;
CREATE POLICY "Allow all authenticated users to read stagiaires" ON stagiaires
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert stagiaires" ON stagiaires
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update stagiaires" ON stagiaires
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Demandes
DROP POLICY IF EXISTS "Enable read access for all users" ON demandes;
CREATE POLICY "Allow all authenticated users to read demandes" ON demandes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert demandes" ON demandes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update demandes" ON demandes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Users
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
CREATE POLICY "Allow all authenticated users to read users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update users" ON users
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Evaluations
CREATE POLICY "Allow all authenticated users to read evaluations" ON evaluations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert evaluations" ON evaluations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update evaluations" ON evaluations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Notifications
CREATE POLICY "Allow all authenticated users to read notifications" ON notifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update notifications" ON notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Activer RLS sur toutes les tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stagiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Créer un bucket pour les documents si il n'existe pas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques pour le storage
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
    FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
