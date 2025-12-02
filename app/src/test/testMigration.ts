import dotenv from 'dotenv';
import { 
    getOrCreateUser, 
    addOperatorWallet, 
    getOperatorWallets 
} from '../services/supabaseService.js';

dotenv.config();

async function testPersistence() {
    console.log('🧪 Testing Persistence with Privy ID as User ID\n');

    const TEST_PRIVY_ID = 'did:privy:test-user-' + Date.now();
    const WALLET_ADDRESS = '0x' + '2'.repeat(40);
    const PROFILE_NAME = 'Migration Test Profile';

    try {
        // --- "DEVICE A" ---
        console.log('📱 Simulating Device A...');
        
        // 1. Login (Create User)
        const userA = await getOrCreateUser(TEST_PRIVY_ID);
        console.log(`   ✅ Logged in as ${TEST_PRIVY_ID}`);
        console.log(`   🆔 User ID in DB: ${userA.id}`);

        if (userA.id !== TEST_PRIVY_ID) {
            throw new Error('❌ User ID mismatch! Expected Privy ID as Primary Key.');
        }

        // 2. Add Profile
        const wallet = await addOperatorWallet(
            userA.id, 
            PROFILE_NAME, 
            '999999', 
            WALLET_ADDRESS, 
            'fake-private-key'
        );
        console.log(`   ✅ Added Profile: ${wallet.name} (${wallet.id})`);


        // --- "DEVICE B" ---
        console.log('\n📱 Simulating Device B (New Session)...');

        // 3. Login (Retrieve User)
        const userB = await getOrCreateUser(TEST_PRIVY_ID);
        console.log(`   ✅ Logged in as ${TEST_PRIVY_ID}`);
        
        // 4. Get Profiles
        const profiles = await getOperatorWallets(userB.id);
        console.log(`   🔍 Found ${profiles.length} profiles.`);

        const foundProfile = profiles.find(p => p.id === wallet.id);

        if (foundProfile) {
            console.log(`   ✅ Successfully retrieved profile "${foundProfile.name}" linked to ${userB.id}.`);
            console.log('\n🎉 Persistence Verified: Schema migration successful.');
        } else {
            console.error('   ❌ Failed to find the profile.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testPersistence();
