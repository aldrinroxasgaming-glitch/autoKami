import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Testing Supabase Connection ---');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key Length: ${SUPABASE_KEY?.length}`);
console.log(`Key (first 10 chars): ${SUPABASE_KEY?.substring(0, 10)}...`);
console.log(`Key (last 10 chars): ...${SUPABASE_KEY?.slice(-10)}`);

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    try {
        // 1. Test basic connection by fetching users (limit 1)
        console.log('\n1. Fetching 1 row from "users" table...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (usersError) {
            console.error('❌ Error fetching users:', usersError);
            throw usersError;
        }

        console.log('✅ Successfully fetched users table.');
        console.log(`   Rows returned: ${users?.length}`);
        if (users?.length > 0) {
            console.log('   Sample User ID:', users[0].id);
        }

        // 2. Check for the specific user
        const targetUserId = 'did:privy:cmid7d60n01bnl80cvche3gf5';
        console.log(`\n2. Fetching specific user: ${targetUserId}...`);
        
        const { data: targetUser, error: targetError } = await supabase
            .from('users')
            .select('*')
            .eq('id', targetUserId)
            .single();
            
        if (targetError) {
             console.log(`⚠️ Could not find specific user ${targetUserId} (Error: ${targetError.message})`);
             // This isn't a connection failure, just data missing, so we proceed
        } else {
            console.log('✅ Found specific user!');
            console.log('   User Data:', targetUser);
        }

    } catch (error) {
        console.error('\n❌ CONNECTION TEST FAILED');
        console.error(error);
        process.exit(1);
    }
}

testConnection();
