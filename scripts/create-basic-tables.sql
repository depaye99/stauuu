-- Drop existing tables if they exist
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS demandes CASCADE;
DROP TABLE IF EXISTS stagiaires CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with basic columns first
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'stagiaire' CHECK (role IN ('admin', 'rh', 'tuteur', 'stagiaire')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add optional columns one by one
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create stagiaires table
CREATE TABLE stagiaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tuteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entreprise VARCHAR(255),
  poste VARCHAR(255),
  date_debut DATE,
  date_fin DATE,
  statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'suspendu')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create demandes table
CREATE TABLE demandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
  tuteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('stage_academique', 'stage_professionnel', 'conge', 'prolongation', 'attestation')),
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuvee', 'rejetee', 'en_cours', 'terminee')),
  date_demande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_reponse TIMESTAMP WITH TIME ZONE,
  commentaire_reponse TEXT,
  documents_requis TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  taille INTEGER NOT NULL,
  url TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
  evaluateur_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('mi_parcours', 'finale', 'auto_evaluation')),
  note_globale INTEGER CHECK (note_globale >= 0 AND note_globale <= 20),
  competences_techniques INTEGER CHECK (competences_techniques >= 0 AND competences_techniques <= 20),
  competences_relationnelles INTEGER CHECK (competences_relationnelles >= 0 AND competences_relationnelles <= 20),
  autonomie INTEGER CHECK (autonomie >= 0 AND autonomie <= 20),
  commentaires TEXT,
  date_evaluation DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  lu BOOLEAN DEFAULT false,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'document', 'rapport')),
  contenu TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX IF NOT EXISTS idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_stagiaire_id ON demandes(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);

-- DISABLE Row Level Security for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE stagiaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Test insert to verify everything works
INSERT INTO users (id, email, name, role, phone, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'test@example.com', 'Test User', 'admin', '+33123456789', true)
ON CONFLICT (email) DO NOTHING;

-- Verify the insert worked
SELECT 'Database setup completed successfully!' as status;
SELECT 'Test user created: ' || email FROM users WHERE email = 'test@example.com';
SELECT 'Total users: ' || COUNT(*) FROM users;

-- Show table structure
SELECT 'Users table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
