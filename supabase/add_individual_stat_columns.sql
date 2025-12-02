-- Migration to add individual stat columns to kamigotchis table for easier querying/tracking
-- These columns will store the calculated final stats

DO $$
BEGIN
    -- Core Stats (Integer)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'stat_power') THEN
        ALTER TABLE kamigotchis ADD COLUMN stat_power INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'stat_health') THEN
        ALTER TABLE kamigotchis ADD COLUMN stat_health INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'stat_harmony') THEN
        ALTER TABLE kamigotchis ADD COLUMN stat_harmony INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'stat_violence') THEN
        ALTER TABLE kamigotchis ADD COLUMN stat_violence INTEGER DEFAULT 0;
    END IF;

    -- Multipliers (Float/Decimal)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_fertility') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_fertility NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_bounty') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_bounty NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_metabolism') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_metabolism NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_strain') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_strain NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_defense_shift') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_defense_shift NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_defense_ratio') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_defense_ratio NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_salvage_ratio') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_salvage_ratio NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_atk_spoils_ratio') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_atk_spoils_ratio NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_atk_threshold_ratio') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_atk_threshold_ratio NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'mult_atk_threshold_shift') THEN
        ALTER TABLE kamigotchis ADD COLUMN mult_atk_threshold_shift NUMERIC(5, 2) DEFAULT 1.0;
    END IF;

    -- Flat Boosts (Float/Decimal/Integer)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'boost_cooldown_shift') THEN
        ALTER TABLE kamigotchis ADD COLUMN boost_cooldown_shift INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kamigotchis' AND column_name = 'boost_intensity') THEN
        ALTER TABLE kamigotchis ADD COLUMN boost_intensity INTEGER DEFAULT 0;
    END IF;

END $$;

-- Create indexes for commonly queried stats (optional but good for leaderboards)
CREATE INDEX IF NOT EXISTS idx_kamigotchis_stat_power ON kamigotchis(stat_power DESC);
CREATE INDEX IF NOT EXISTS idx_kamigotchis_stat_health ON kamigotchis(stat_health DESC);
