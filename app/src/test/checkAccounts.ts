import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAccounts() {
    console.log('🔍 Checking existing operator wallets...\n');

    const { data: wallets, error } = await supabase
        .from('operator_wallets')
        .select('*')
        .limit(10);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (!wallets || wallets.length === 0) {
        console.log('⚠️  No operator wallets found in database');
        return;
    }

    console.log(`Found ${wallets.length} operator wallets:\n`);

    for (const wallet of wallets) {
        console.log(`📝 Wallet: ${wallet.name}`);
        console.log(`   ID: ${wallet.id}`);
        console.log(`   Address: ${wallet.wallet_address}`);
        console.log(`   User ID: ${wallet.user_id}`);
        console.log(`   Active: ${wallet.is_active}`);
        console.log('');
    }

    console.log('\n💡 You can use any of these wallet addresses to test the refresh flow.');
    console.log('   Update testRefreshFlow.ts with one of these addresses.\n');
}

checkAccounts();
