-- Migration to use Privy User ID as primary key for users table
-- Warning: This will delete existing data if not handled carefully.
-- For dev environment, we will drop and recreate.

-- Disable triggers temporarily if needed (not doing here for simplicity)

-- 1. Drop dependent tables
DROP TABLE IF EXISTS harvest_logs CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS kami_profiles CASCADE;
DROP TABLE IF EXISTS kamigotchis CASCADE;
DROP TABLE IF EXISTS operator_wallets CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Recreate Users table with TEXT ID
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Privy ID string
  privy_user_id TEXT UNIQUE NOT NULL, -- Duplicate for query compat
  email TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recreate Operator Wallets
CREATE TABLE operator_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  wallet_address TEXT DEFAULT '',
  encrypted_private_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- 4. Recreate Kamigotchis
CREATE TABLE kamigotchis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_wallet_id UUID NOT NULL REFERENCES operator_wallets(id) ON DELETE CASCADE,
  kami_entity_id TEXT NOT NULL UNIQUE,
  kami_index INTEGER NOT NULL,
  kami_name TEXT,
  level INTEGER DEFAULT 1,
  state TEXT DEFAULT 'RESTING',
  room_index INTEGER,
  room_name TEXT,
  media_uri TEXT,
  account_id TEXT NOT NULL,
  affinities JSONB,
  stats JSONB,
  final_stats JSONB,
  traits JSONB,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Recreate Kami Profiles
CREATE TABLE kami_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kamigotchi_id UUID NOT NULL REFERENCES kamigotchis(id) ON DELETE CASCADE,
  operator_wallet_id UUID NOT NULL REFERENCES operator_wallets(id) ON DELETE CASCADE,
  auto_harvest_enabled BOOLEAN DEFAULT false,
  harvest_node_index INTEGER,
  auto_collect_enabled BOOLEAN DEFAULT false,
  auto_restart_enabled BOOLEAN DEFAULT false,
  min_health_threshold INTEGER DEFAULT 20,
  auto_heal_enabled BOOLEAN DEFAULT false,
  harvest_schedule_type TEXT DEFAULT 'continuous',
  harvest_start_time TIME,
  harvest_end_time TIME,
  harvest_duration INTEGER DEFAULT 60,
  rest_duration INTEGER DEFAULT 30,
  last_harvest_start TIMESTAMP WITH TIME ZONE,
  last_collect TIMESTAMP WITH TIME ZONE,
  is_currently_harvesting BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kamigotchi_id)
);

-- 6. Recreate Harvest Logs
CREATE TABLE harvest_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kami_profile_id UUID NOT NULL REFERENCES kami_profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  tx_hash TEXT,
  error_message TEXT,
  musu_collected INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Recreate System Logs
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  kami_profile_id TEXT,
  kami_index INTEGER,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Recreate User Settings
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notification_email TEXT,
  notification_enabled BOOLEAN DEFAULT true,
  notification_on_harvest_complete BOOLEAN DEFAULT true,
  notification_on_error BOOLEAN DEFAULT true,
  notification_on_low_health BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'arcade',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Re-enable indexes and triggers (simplified copy from schema.sql)
CREATE INDEX idx_operator_wallets_user_id ON operator_wallets(user_id);
CREATE INDEX idx_operator_wallets_account_id ON operator_wallets(account_id);
CREATE INDEX idx_kamigotchis_user_id ON kamigotchis(user_id);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- 10. Update helper function
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
  WHERE u.id = p_privy_user_id
    AND ow.is_active = true
  GROUP BY ow.id, ow.name, ow.account_id, ow.wallet_address
  ORDER BY ow.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kamigotchis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kami_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Simple policies (assuming auth.uid() matches Privy ID for frontend access if used)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can view own wallets" ON operator_wallets FOR SELECT USING (user_id = auth.uid()::text);
-- ... (add other policies as needed or rely on service role for backend)
