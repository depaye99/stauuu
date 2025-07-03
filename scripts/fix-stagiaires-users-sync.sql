-- Script pour corriger la synchronisation entre users et stagiaires

-- 1. Identifier les utilisateurs stagiaires sans entrée dans la table stagiaires
INSERT INTO stagiaires (user_id, entreprise, poste, statut, created_at, updated_at)
SELECT 
  u.id,
  'Bridge Technologies Solutions' as entreprise,
  'Stagiaire' as poste,
  'actif' as statut,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
WHERE u.role = 'stagiaire' 
  AND u.id NOT IN (SELECT user_id FROM stagiaires WHERE user_id IS NOT NULL);

-- 2. Assigner automatiquement des tuteurs aux stagiaires qui n'en ont pas
UPDATE stagiaires 
SET tuteur_id = (
  SELECT tuteur_users.id 
  FROM users tuteur_users 
  WHERE tuteur_users.role = 'tuteur' 
    AND tuteur_users.is_active = true
  ORDER BY (
    SELECT COUNT(*) 
    FROM stagiaires s2 
    WHERE s2.tuteur_id = tuteur_users.id
  ) ASC
  LIMIT 1
)
WHERE tuteur_id IS NULL;

-- 3. Vérifier les données
SELECT 
  'Total Users' as type,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Users Stagiaires' as type,
  COUNT(*) as count
FROM users WHERE role = 'stagiaire'
UNION ALL
SELECT 
  'Entries in Stagiaires table' as type,
  COUNT(*) as count
FROM stagiaires
UNION ALL
SELECT 
  'Stagiaires with Tuteur' as type,
  COUNT(*) as count
FROM stagiaires WHERE tuteur_id IS NOT NULL;
