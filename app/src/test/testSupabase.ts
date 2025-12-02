import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from the app directory
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log('🔍 Testing Supabase connection...\n');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase credentials not found in .env');
    console.error('\nPlease check your .env file has:');
    console.error('  SUPABASE_URL=...');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=... (or SUPABASE_ANON_KEY=...)');
    process.exit(1);
}

console.log(`✅ Found Supabase credentials`);
console.log(`📡 URL: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDatabase() {
    const requiredTables = [
        'users',
        'operator_wallets',
        'kamigotchis',
        'kami_profiles',
        'harvest_logs',
        'user_settings'
    ];

    console.log('🔍 Checking database tables...\n');

    for (const table of requiredTables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ Table "${table}": ${error.message}`);
            } else {
                console.log(`✅ Table "${table}": EXISTS (${count || 0} rows)`);
            }
        } catch (err) {
            console.log(`❌ Table "${table}": ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    console.log('\n🔍 Checking environment variables...\n');

    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length > 20) {
        console.log('✅ ENCRYPTION_KEY is set');
    } else {
        console.log('⚠️  ENCRYPTION_KEY is not set or too short');
    }

    if (process.env.OPERATOR_PRIVATE_KEY && process.env.OPERATOR_PRIVATE_KEY !== 'your_private_key_here') {
        console.log('✅ OPERATOR_PRIVATE_KEY is set');
    } else {
        console.log('⚠️  OPERATOR_PRIVATE_KEY is not set');
    }

    console.log('\n✨ Database test complete!\n');
}

testDatabase().catch((err) => {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
});
