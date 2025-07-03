-- Script pour synchroniser les utilisateurs de auth.users vers la table users
-- Utiliser uniquement si nécessaire pour réparer les données

-- Fonction pour synchroniser un utilisateur spécifique
CREATE OR REPLACE FUNCTION sync_auth_user_to_profile(user_email text)
RETURNS void AS $$
DECLARE
  auth_user_record auth.users%ROWTYPE;
  existing_profile users%ROWTYPE;
BEGIN
  -- Récupérer l'utilisateur de auth.users
  SELECT * INTO auth_user_record 
  FROM auth.users 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Utilisateur % non trouvé dans auth.users', user_email;
    RETURN;
  END IF;
  
  -- Vérifier si le profil existe déjà
  SELECT * INTO existing_profile 
  FROM users 
  WHERE id = auth_user_record.id;
  
  IF FOUND THEN
    RAISE NOTICE 'Profil existe déjà pour %', user_email;
    RETURN;
  END IF;
  
  -- Créer le profil avec les métadonnées
  INSERT INTO users (
    id, 
    email, 
    name, 
    role, 
    phone,
    department,
    position,
    is_active
  ) VALUES (
    auth_user_record.id,
    auth_user_record.email,
    COALESCE(auth_user_record.raw_user_meta_data->>'name', split_part(auth_user_record.email, '@', 1)),
    COALESCE(auth_user_record.raw_user_meta_data->>'role', 'stagiaire'),
    auth_user_record.raw_user_meta_data->>'phone',
    auth_user_record.raw_user_meta_data->>'department',
    auth_user_record.raw_user_meta_data->>'position',
    true
  );
  
  RAISE NOTICE 'Profil créé pour % avec le rôle %', 
    user_email, 
    COALESCE(auth_user_record.raw_user_meta_data->>'role', 'stagiaire');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour synchroniser tous les utilisateurs auth manquants
CREATE OR REPLACE FUNCTION sync_all_missing_profiles()
RETURNS void AS $$
DECLARE
  auth_user_record auth.users%ROWTYPE;
BEGIN
  FOR auth_user_record IN 
    SELECT au.* 
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
    AND au.email_confirmed_at IS NOT NULL
  LOOP
    PERFORM sync_auth_user_to_profile(auth_user_record.email);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter la synchronisation si nécessaire
-- SELECT sync_all_missing_profiles();

-- Vérifier les utilisateurs manquants
SELECT 
  'Utilisateurs auth sans profil:' as status,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL AND au.email_confirmed_at IS NOT NULL;
