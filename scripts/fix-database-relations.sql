-- Corriger les relations problématiques entre stagiaires et users
-- Supprimer les contraintes en double et recréer proprement

-- 1. Nettoyer les relations existantes
ALTER TABLE stagiaires DROP CONSTRAINT IF EXISTS stagiaires_user_id_fkey;
ALTER TABLE stagiaires DROP CONSTRAINT IF EXISTS stagiaires_tuteur_id_fkey;

-- 2. Recréer les contraintes proprement
ALTER TABLE stagiaires 
ADD CONSTRAINT stagiaires_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE stagiaires 
ADD CONSTRAINT stagiaires_tuteur_id_fkey 
FOREIGN KEY (tuteur_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Créer une vue pour simplifier les requêtes
CREATE OR REPLACE VIEW stagiaires_complete AS
SELECT 
    s.*,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    t.name as tuteur_name,
    t.email as tuteur_email
FROM stagiaires s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN users t ON s.tuteur_id = t.id;

-- 4. Corriger la table demandes pour inclure les documents
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS documents_joints TEXT[];
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS pieces_jointes JSONB;

-- 5. Créer la table pour les documents des demandes
CREATE TABLE IF NOT EXISTS demande_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    demande_id UUID REFERENCES demandes(id) ON DELETE CASCADE,
    nom_fichier TEXT NOT NULL,
    type_fichier TEXT,
    taille_fichier INTEGER,
    url_fichier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

-- 6. Créer la table pour les notifications email
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    sujet TEXT NOT NULL,
    contenu TEXT NOT NULL,
    envoye BOOLEAN DEFAULT FALSE,
    date_envoi TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX IF NOT EXISTS idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_demande_documents_demande_id ON demande_documents(demande_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_envoye ON email_notifications(envoye);

-- 8. Politiques RLS
ALTER TABLE demande_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour demande_documents
CREATE POLICY "Users can view documents of their own demandes" ON demande_documents
    FOR SELECT USING (
        demande_id IN (
            SELECT id FROM demandes WHERE stagiaire_id IN (
                SELECT id FROM stagiaires WHERE user_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh', 'tuteur')
        )
    );

-- Politique pour email_notifications
CREATE POLICY "Users can view their own email notifications" ON email_notifications
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh')
    ));

-- 9. Fonction pour envoyer des notifications email
CREATE OR REPLACE FUNCTION send_email_notification(
    p_user_id UUID,
    p_type TEXT,
    p_sujet TEXT,
    p_contenu TEXT
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO email_notifications (user_id, type, sujet, contenu)
    VALUES (p_user_id, p_type, p_sujet, p_contenu)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pour envoyer des notifications lors du traitement des demandes
CREATE OR REPLACE FUNCTION notify_demande_processed() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.statut != NEW.statut AND NEW.statut IN ('approuvee', 'rejetee') THEN
        PERFORM send_email_notification(
            (SELECT user_id FROM stagiaires WHERE id = NEW.stagiaire_id),
            'demande_processed',
            'Votre demande a été traitée',
            'Votre demande "' || NEW.titre || '" a été ' || 
            CASE WHEN NEW.statut = 'approuvee' THEN 'approuvée' ELSE 'rejetée' END || '.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_demande_processed ON demandes;
CREATE TRIGGER trigger_notify_demande_processed
    AFTER UPDATE ON demandes
    FOR EACH ROW
    EXECUTE FUNCTION notify_demande_processed();
