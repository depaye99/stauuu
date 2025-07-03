-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS demandes CASCADE;
DROP TABLE IF EXISTS stagiaires CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'stagiaire' CHECK (role IN ('admin', 'rh', 'tuteur', 'stagiaire')),
  phone VARCHAR(20),
  address TEXT,
  department VARCHAR(100),
  position VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

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

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);
CREATE INDEX idx_demandes_stagiaire_id ON demandes(stagiaire_id);
CREATE INDEX idx_demandes_statut ON demandes(statut);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);

-- DISABLE Row Level Security for development (IMPORTANT!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE stagiaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Insert test data to verify everything works
INSERT INTO users (id, email, name, role, phone, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@test.com', 'Admin Test', 'admin', '+33123456789', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'rh@test.com', 'RH Manager', 'rh', '+33123456790', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'tuteur@test.com', 'Tuteur Principal', 'tuteur', '+33123456791', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'stagiaire@test.com', 'Stagiaire Test', 'stagiaire', '+33123456792', true);

-- Insert test stagiaire
INSERT INTO stagiaires (id, user_id, tuteur_id, entreprise, poste, date_debut, date_fin, statut) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'TechCorp', 'Développeur Junior', '2024-01-15', '2024-07-15', 'actif');

-- Insert test demande
INSERT INTO demandes (id, stagiaire_id, tuteur_id, type, titre, description, statut) VALUES
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'stage_academique', 'Demande de stage académique', 'Demande de validation de stage académique pour le semestre', 'en_attente');

-- Insert test document
INSERT INTO documents (id, nom, type, taille, url, user_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', 'CV_Stagiaire.pdf', 'application/pdf', 1024000, '/documents/cv_stagiaire.pdf', '550e8400-e29b-41d4-a716-446655440004');

-- Insert test notification
INSERT INTO notifications (id, user_id, titre, message, type) VALUES
  ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440004', 'Bienvenue', 'Bienvenue dans la plateforme de gestion des stages', 'info');

-- Insert test template
INSERT INTO templates (id, nom, type, contenu, variables, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440050', 'Email de bienvenue', 'email', 'Bonjour {{nom}}, bienvenue dans notre plateforme!', ARRAY['nom'], '550e8400-e29b-41d4-a716-446655440001');

-- Verify data insertion
SELECT 'Tables created and data inserted successfully!' as status;
SELECT 'Users count: ' || COUNT(*) as users_count FROM users;
SELECT 'Stagiaires count: ' || COUNT(*) as stagiaires_count FROM stagiaires;
SELECT 'Demandes count: ' || COUNT(*) as demandes_count FROM demandes;
SELECT 'Documents count: ' || COUNT(*) as documents_count FROM documents;
SELECT 'Notifications count: ' || COUNT(*) as notifications_count FROM notifications;
SELECT 'Templates count: ' || COUNT(*) as templates_count FROM templates;
