import dotenv from 'dotenv';
import { resolve } from 'path';
import { getOrCreateUser, getKamigotchis, getOrCreateKamiProfile, getOperatorWallets } from '../services/supabaseService.js';

// Load .env from the app directory
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function debugAPI() {
    const privyUserId = process.env.TEST_PRIVY_USER_ID;
    if (!privyUserId) {
        console.error('TEST_PRIVY_USER_ID not set');
        return;
    }

    console.log(`🔍 Debugging API for user: ${privyUserId}`);

    try {
        const user = await getOrCreateUser(privyUserId);
        console.log(`✅ User found: ${user.id}`);

        const wallets = await getOperatorWallets(user.id);
        console.log(`✅ Found ${wallets.length} operator wallets:`);
        wallets.forEach(w => console.log(`   - ${w.name} (ID: ${w.id})`));

        const kamigotchis = await getKamigotchis(user.id);
        console.log(`✅ Found ${kamigotchis.length} kamigotchis in DB`);

        if (kamigotchis.length > 0) {
            console.log('🔍 Sample Kamigotchi Data:');
            const k = kamigotchis[0];
            console.log(JSON.stringify({
                id: k.id,
                kami_index: k.kami_index,
                operator_wallet_id: k.operator_wallet_id
            }, null, 2));
        }

        console.log('\n🔍 Simulating API Response Construction...');
        const apiResponse = await Promise.all(
            kamigotchis.map(async (kami) => {
                try {
                    // This is the logic from kamigotchiRoutes.ts
                    const profile = await getOrCreateKamiProfile(kami.id, kami.operator_wallet_id);
                    return {
                        id: kami.id,
                        index: kami.kami_index,
                        operatorWalletId: kami.operator_wallet_id, // This is what we need to check!
                        // ... other fields omitted for brevity
                    };
                } catch (e) {
                    console.error(`Error processing kami ${kami.id}`, e);
                    return null;
                }
            })
        );

        console.log('✅ API Response Items (first 5):');
        console.log(JSON.stringify(apiResponse.slice(0, 5), null, 2));

        // Verify mapping logic
        if (wallets.length > 0) {
            const walletId = wallets[0].id;
            const filtered = apiResponse.filter((k: any) => k && k.operatorWalletId === walletId);
            console.log(`\n🔍 Filter Check: Found ${filtered.length} kamis for wallet ${wallets[0].name} (${walletId})`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugAPI();
