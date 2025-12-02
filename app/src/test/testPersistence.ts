import dotenv from 'dotenv';
import { 
    getOrCreateUser, 
    addOperatorWallet, 
    getOperatorWallets 
} from '../services/supabaseService.js';

dotenv.config();

async function testPersistence() {
    console.log('🧪 Testing Cross-Device Persistence (Privy ID Linking)\n');

    const TEST_PRIVY_ID = 'test-persistence-user-' + Date.now();
    const WALLET_ADDRESS = '0x' + '1'.repeat(40);
    const PROFILE_NAME = 'Persistence Test Profile';

    try {
        // --- "DEVICE A" ---
        console.log('📱 Simulating Device A...');
        
        // 1. Login (Create User)
        const userA = await getOrCreateUser(TEST_PRIVY_ID);
        console.log(`   ✅ Logged in as ${TEST_PRIVY_ID} (UUID: ${userA.id})`);

        // 2. Add Profile
        const wallet = await addOperatorWallet(
            userA.id, 
            PROFILE_NAME, 
            '123456', // Fake Account ID
            WALLET_ADDRESS, 
            'fake-private-key'
        );
        console.log(`   ✅ Added Profile: ${wallet.name} (${wallet.id})`);


        // --- "DEVICE B" ---
        console.log('\n📱 Simulating Device B (New Session)...');

        // 3. Login (Retrieve User)
        const userB = await getOrCreateUser(TEST_PRIVY_ID);
        console.log(`   ✅ Logged in as ${TEST_PRIVY_ID} (UUID: ${userB.id})`);

        if (userA.id !== userB.id) {
            throw new Error('❌ User UUID mismatch! User identity not persisting.');
        }

        // 4. Get Profiles
        const profiles = await getOperatorWallets(userB.id);
        console.log(`   🔍 Found ${profiles.length} profiles.`);

        const foundProfile = profiles.find(p => p.id === wallet.id);

        if (foundProfile) {
            console.log(`   ✅ Successfully retrieved profile "${foundProfile.name}" created on Device A.`);
            console.log('\n🎉 Persistence Verified: Privy ID is correctly linked to Operator Wallets.');
        } else {
            console.error('   ❌ Failed to find the profile created on Device A.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testPersistence();
