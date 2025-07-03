-- Function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status(table_name text)
RETURNS boolean AS $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name;
    
    RETURN COALESCE(rls_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    size_pretty text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY n_tup_ins - n_tup_del DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Helper functions created successfully!' as message;
