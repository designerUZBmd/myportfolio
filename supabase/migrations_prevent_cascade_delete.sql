-- ==============================================================================
-- MIGRATION: Change Foreign Key on portfolio_cases.category_id to prevent CASCADE DELETE
-- ==============================================================================
-- By default, if the foreign key had ON DELETE CASCADE, deleting a category 
-- wiped all linked portfolio cases. This migration changes it to ON DELETE SET NULL 
-- (or RESTRICT) so that cases are safely preserved even if a category is removed.

DO $$
BEGIN
    -- Find and drop any existing foreign key constraint from portfolio_cases to categories
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'portfolio_cases' 
          AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE portfolio_cases 
        DROP CONSTRAINT IF EXISTS portfolio_cases_category_id_fkey;
    END IF;
END $$;

-- Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE portfolio_cases
ADD CONSTRAINT portfolio_cases_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE SET NULL;
