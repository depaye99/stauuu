-- Vérifier les utilisateurs de test
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM users 
WHERE email LIKE '%@test.com'
ORDER BY created_at DESC;

-- Vérifier les comptes auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
WHERE email LIKE '%@test.com'
ORDER BY created_at DESC;

-- Compter les utilisateurs par rôle
SELECT 
  role,
  COUNT(*) as count
FROM users 
GROUP BY role;
