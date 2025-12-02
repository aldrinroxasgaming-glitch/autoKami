import dotenv from 'dotenv';
import { getKamisByAccountId } from '../services/accountService.js';
import { getKamiById } from '../services/kamiService.js';

dotenv.config();

async function checkHealth() {
    console.log('🏥 Checking Kami Health Data...\n');

    const testAccountId = '1306601529779032187882334195689384186122390621944'; // From previous test

    try {
        const kamis = await getKamisByAccountId(testAccountId);
        
        if (kamis.length === 0) {
            console.log('No kamis found.');
            return;
        }

        const kami = kamis[0];
        console.log(`Kami: ${kami.name || 'Kami #' + kami.index} (ID: ${kami.id})`);
        console.log('State:', kami.state);
        console.log('\n--- Health Data ---');
        console.log('Max Health (Final Stats):', kami.finalStats.health);
        console.log('Base Health (Raw Stat):', kami.stats.health.base);
        
        console.log('\n--- Other Stats (Final) ---');
        console.log('Power:', kami.finalStats.power);
        console.log('Harmony:', kami.finalStats.harmony);
        console.log('Violence:', kami.finalStats.violence);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkHealth();
