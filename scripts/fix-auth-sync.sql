-- Script pour synchroniser les utilisateurs avec Supabase Auth
-- Exécuter ce script si vous avez des utilisateurs dans votre table users 
-- qui ne sont pas synchronisés avec Supabase Auth

-- Fonction pour créer un utilisateur auth depuis un utilisateur existant
CREATE OR REPLACE FUNCTION sync_user_to_auth(
  user_email text,
  user_name text,
  user_role text DEFAULT 'stagiaire'
)
RETURNS text AS $$
DECLARE
  result_message text;
BEGIN
  -- Note: Cette fonction nécessite des privilèges d'administration
  -- Elle doit être exécutée avec un compte ayant accès à auth.users
  
  -- Vérifier si l'utilisateur existe déjà dans auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    result_message := 'User ' || user_email || ' already exists in auth.users';
  ELSE
    -- Message d'instruction car nous ne pouvons pas créer directement des utilisateurs auth
    result_message := 'User ' || user_email || ' needs to be created manually via Supabase dashboard or signup flow';
  END IF;
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lister les utilisateurs qui ont besoin d'être synchronisés
SELECT 
  u.email,
  u.name,
  u.role,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.email = u.email) 
    THEN 'Already in auth.users'
    ELSE 'Needs manual creation'
  END as auth_status
FROM users u
WHERE u.is_active = true
ORDER BY u.email;

-- Instructions pour la synchronisation manuelle
SELECT 'Pour synchroniser les utilisateurs existants:' as instructions
UNION ALL
SELECT '1. Connectez-vous au dashboard Supabase'
UNION ALL  
SELECT '2. Allez dans Authentication > Users'
UNION ALL
SELECT '3. Créez manuellement chaque utilisateur manquant'
UNION ALL
SELECT '4. Ou demandez aux utilisateurs de s''inscrire via le formulaire';
