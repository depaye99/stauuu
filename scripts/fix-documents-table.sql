-- Corriger la table documents pour supporter les uploads
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS chemin_fichier TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'approuve';

-- Créer le bucket documents dans Supabase Storage si nécessaire
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false) 
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs d'uploader leurs documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour permettre aux utilisateurs de voir leurs documents
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour permettre aux admins de voir tous les documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'rh')
  )
);
