
-- Création de la table documents avec la bonne structure
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'autre' CHECK (type IN ('stage', 'evaluation', 'autre')),
    description TEXT,
    chemin_fichier TEXT,
    url TEXT,
    taille INTEGER DEFAULT 0,
    type_fichier VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'archive', 'supprime')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Assurer que RLS est activé
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Admins and RH can view all documents" ON documents;

-- Créer les nouvelles politiques RLS
CREATE POLICY "Users can view relevant documents" ON documents
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            is_public = true OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

CREATE POLICY "Users can insert their own documents" ON documents
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Créer le bucket pour les documents si il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'documents', 
    'documents', 
    false, 
    52428800, -- 50MB
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain'];

-- Politiques pour le storage
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents in storage" ON storage.objects;

CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND 
        auth.role() = 'authenticated' AND
        (string_to_array(name, '/'))[2] = auth.uid()::text
    );

CREATE POLICY "Users can view relevant documents in storage" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND 
        auth.role() = 'authenticated' AND (
            (string_to_array(name, '/'))[2] = auth.uid()::text OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

CREATE POLICY "Users can update their own documents in storage" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND 
        auth.role() = 'authenticated' AND (
            (string_to_array(name, '/'))[2] = auth.uid()::text OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

CREATE POLICY "Users can delete their own documents in storage" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND 
        auth.role() = 'authenticated' AND (
            (string_to_array(name, '/'))[2] = auth.uid()::text OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
        )
    );

SELECT 'Table documents créée avec succès!' as status;
