-- Create users table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS stagiaires (
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
CREATE TABLE IF NOT EXISTS demandes (
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
CREATE TABLE IF NOT EXISTS documents (
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
CREATE TABLE IF NOT EXISTS evaluations (
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
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE TABLE IF NOT EXISTS templates (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX IF NOT EXISTS idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_stagiaire_id ON demandes(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stagiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you may want to customize these)
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Insert a test admin user (optional)
INSERT INTO users (id, email, name, role, is_active) 
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  'Admin Test',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

SELECT 'Database setup completed successfully!' as message;
