-- Script de réparation pour corriger les problèmes de données utilisateur

-- 1. Corriger les utilisateurs avec des rôles manquants
UPDATE users 
SET role = 'stagiaire' 
WHERE role IS NULL OR role = '';

-- 2. Activer tous les utilisateurs inactifs (si nécessaire)
-- UPDATE users SET is_active = true WHERE is_active = false;

-- 3. Corriger les noms manquants
UPDATE users 
SET name = split_part(email, '@', 1) 
WHERE name IS NULL OR name = '';

-- 4. Vérifier les doublons d'email
SELECT email, COUNT(*) as count
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 5. Afficher un résumé des utilisateurs par rôle
SELECT 
  role, 
  COUNT(*) as count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM users 
GROUP BY role
ORDER BY role;

-- 6. Vérifier les utilisateurs auth sans profil
SELECT 
  'Auth users without profile' as issue,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

SELECT 'Réparation terminée' as status;
