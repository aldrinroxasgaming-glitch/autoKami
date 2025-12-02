-- Migration to add stats and final_stats columns to kamigotchis table if they don't exist
DO $$
BEGIN
    -- Add stats column (for base stats)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'stats') THEN
        ALTER TABLE kamigotchis ADD COLUMN stats JSONB;
    END IF;

    -- Add final_stats column (for calculated stats including skills)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'final_stats') THEN
        ALTER TABLE kamigotchis ADD COLUMN final_stats JSONB;
    END IF;
END $$;
