import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from the app directory
const envPath = resolve(process.cwd(), 'app', '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function retrieveKamis() {
    console.log('🔍 Retrieving Kamis from Supabase...');

    const { data: kamis, error } = await supabase
        .from('kamigotchis')
        .select(`
            id, 
            kami_index, 
            kami_name, 
            level, 
            state,
            media_uri,
            operator_wallet_id
        `)
        .limit(10);

    if (error) {
        console.error('❌ Error fetching kamis:', error);
        return;
    }

    if (!kamis || kamis.length === 0) {
        console.log('⚠️ No Kamis found in database.');
    } else {
        console.log(`✅ Found ${kamis.length} Kamis (showing first 10):`);
        kamis.forEach(k => {
            console.log(`   - [${k.kami_index}] ${k.kami_name || 'Unnamed'} (Lv.${k.level}) - Status: ${k.state}`);
            console.log(`     ID: ${k.id}`);
            console.log(`     Wallet: ${k.operator_wallet_id}`);
            console.log(`     Media: ${k.media_uri}`);
        });
    }
}

retrieveKamis();
