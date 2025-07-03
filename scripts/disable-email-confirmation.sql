-- This script helps configure Supabase for development
-- Run this in your Supabase SQL Editor to disable email confirmation

-- Note: These are configuration changes that should be done in the Supabase Dashboard
-- Go to Authentication > Settings and:
-- 1. Disable "Enable email confirmations"
-- 2. Set "Site URL" to your development URL (http://localhost:3000)
-- 3. Add your development URL to "Redirect URLs"

-- For now, let's create a simple function to help with user management
CREATE OR REPLACE FUNCTION confirm_user_email(user_email text)
RETURNS void AS $$
BEGIN
  -- This function can be used to manually confirm users in development
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE email = user_email AND email_confirmed_at IS NULL;
  
  RAISE NOTICE 'User % email confirmed', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to list unconfirmed users
CREATE OR REPLACE FUNCTION list_unconfirmed_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.created_at
  FROM auth.users u
  WHERE u.email_confirmed_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage examples:
-- SELECT confirm_user_email('user@example.com');
-- SELECT * FROM list_unconfirmed_users();

SELECT 'Email confirmation helper functions created!' as message;
