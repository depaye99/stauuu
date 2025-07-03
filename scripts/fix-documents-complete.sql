-- Corriger complètement la table documents
DROP TABLE IF EXISTS documents CASCADE;

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('stage', 'evaluation', 'autre')),
  description TEXT,
  chemin_fichier TEXT NOT NULL,
  url TEXT NOT NULL,
  taille INTEGER NOT NULL,
  type_fichier VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  statut VARCHAR(50) DEFAULT 'approuve' CHECK (statut IN ('en_attente', 'approuve', 'refuse')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_statut ON documents(statut);

-- Créer le bucket documents dans Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false) 
ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour les documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient leurs propres documents
CREATE POLICY "Users can view their own documents" ON documents
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Politique pour que les utilisateurs puissent créer leurs documents
CREATE POLICY "Users can create their own documents" ON documents
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Politique pour que les utilisateurs puissent modifier leurs documents
CREATE POLICY "Users can update their own documents" ON documents
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Politique pour que les admins/RH voient tous les documents
CREATE POLICY "Admins and RH can view all documents" ON documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role IN ('admin', 'rh')
  )
);

-- Politiques pour le storage
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[2]
);

CREATE POLICY "Users can view their own documents in storage" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[2]
);

CREATE POLICY "Admins can view all documents in storage" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role IN ('admin', 'rh')
  )
);
