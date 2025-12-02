-- Migration to add detailed stat columns to kamigotchis table
-- Run this in your Supabase SQL Editor

ALTER TABLE kamigotchis 
ADD COLUMN IF NOT EXISTS final_stats JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS current_health NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stat_power NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stat_health NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stat_harmony NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stat_violence NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS mult_fertility NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_bounty NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_metabolism NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_strain NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_defense_shift NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_defense_ratio NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_salvage_ratio NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_atk_spoils_ratio NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_atk_threshold_ratio NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mult_atk_threshold_shift NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS boost_cooldown_shift NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS boost_intensity NUMERIC DEFAULT 0;

-- Ensure indices for performance
CREATE INDEX IF NOT EXISTS idx_kamigotchis_user_id ON kamigotchis(user_id);
CREATE INDEX IF NOT EXISTS idx_kamigotchis_kami_entity_id ON kamigotchis(kami_entity_id);