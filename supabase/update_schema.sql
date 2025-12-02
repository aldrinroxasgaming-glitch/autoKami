-- Safe migration script to update the database schema
-- Run this in the Supabase SQL Editor

-- 1. Add duration columns to kami_profiles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kami_profiles' AND column_name = 'harvest_duration') THEN
        ALTER TABLE kami_profiles ADD COLUMN harvest_duration INTEGER DEFAULT 60;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kami_profiles' AND column_name = 'rest_duration') THEN
        ALTER TABLE kami_profiles ADD COLUMN rest_duration INTEGER DEFAULT 30;
    END IF;
END $$;

-- 2. Fix operator_wallets schema (Account ID vs Wallet Address)
DO $$
BEGIN
    -- Check if we still have the old schema (wallet_address holds the ID) and lack account_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operator_wallets' AND column_name = 'wallet_address') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operator_wallets' AND column_name = 'account_id') THEN
        
        -- Rename the old wallet_address (which held IDs) to account_id
        ALTER TABLE operator_wallets RENAME COLUMN wallet_address TO account_id;
        
        -- Add the new wallet_address column
        ALTER TABLE operator_wallets ADD COLUMN wallet_address TEXT DEFAULT '';
        
        -- Update the unique constraint (drop old, add new)
        -- Note: Constraint name might vary, trying standard naming convention
        BEGIN
            ALTER TABLE operator_wallets DROP CONSTRAINT IF EXISTS operator_wallets_user_id_wallet_address_key;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if constraint doesn't exist or name is different
            NULL;
        END;
        
        ALTER TABLE operator_wallets ADD CONSTRAINT operator_wallets_user_id_account_id_key UNIQUE (user_id, account_id);
        
        -- Update index
        DROP INDEX IF EXISTS idx_operator_wallets_wallet_address;
        CREATE INDEX idx_operator_wallets_account_id ON operator_wallets(account_id);
    END IF;
END $$;

-- 3. Update the helper function (Fixes the return type error)
-- Drop first to handle return type change
DROP FUNCTION IF EXISTS get_user_active_wallets(text) CASCADE;

CREATE OR REPLACE FUNCTION get_user_active_wallets(p_privy_user_id TEXT)
RETURNS TABLE (
  wallet_id UUID,
  wallet_name TEXT,
  account_id TEXT,
  wallet_address TEXT,
  kami_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ow.id as wallet_id,
    ow.name as wallet_name,
    ow.account_id,
    ow.wallet_address,
    COUNT(kp.id) as kami_count
  FROM operator_wallets ow
  JOIN users u ON ow.user_id = u.id
  LEFT JOIN kami_profiles kp ON kp.operator_wallet_id = ow.id
  WHERE u.privy_user_id = p_privy_user_id
    AND ow.is_active = true
  GROUP BY ow.id, ow.name, ow.account_id, ow.wallet_address
  ORDER BY ow.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
