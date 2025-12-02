import dotenv from 'dotenv';
import { getKamisByAccountId } from '../services/accountService.js';

dotenv.config();

async function testGetKamis() {
    console.log('🧪 Testing getKamisByAccountId\n');

    // Use the account ID format (big number, not 0x address)
    const testAccountId = '1306601529779032187882334195689384186122390621944';

    console.log(`📍 Testing with account ID: ${testAccountId}\n`);

    try {
        console.log('Fetching kamis from on-chain...');
        const kamis = await getKamisByAccountId(testAccountId);

        console.log(`\n✅ Successfully retrieved ${kamis.length} kamis!\n`);

        if (kamis.length > 0) {
            console.log('📦 Kami Details:\n');
            kamis.forEach((kami, index) => {
                console.log(`${index + 1}. ${kami.name || `Kami #${kami.index}`}`);
                console.log(`   Entity ID: ${kami.id}`);
                console.log(`   Index: ${kami.index}`);
                console.log(`   Level: ${kami.level}`);
                console.log(`   State: ${kami.state}`);
                console.log(`   Media URI: ${kami.mediaURI}`);
                console.log(`   Room: ${kami.room?.name || 'Unknown'} (#${kami.room?.index})`);
                console.log(`   Affinities: ${kami.affinities.join(', ')}`);
                console.log();
            });

            console.log('\n✨ Test successful! getKamisByAccountId is working correctly.\n');
        } else {
            console.log('⚠️  No kamis found for this account ID');
            console.log('   Try a different account ID that has kamis\n');
        }

    } catch (error) {
        console.error('\n❌ Error fetching kamis:');
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

testGetKamis();
