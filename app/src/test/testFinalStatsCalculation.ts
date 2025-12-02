import { getKamiById } from '../services/kamiService.js';
import { getKamiSkills } from '../services/skillService.js';
import { getSkillInfo } from '../utils/skillMappings.js';

// Mock the dependencies to test logic without network calls if possible, 
// but since we are in a CLI environment with access to the codebase, 
// we can try to run it against the actual service if we have a valid Kami ID.
// However, querying on-chain might be slow or fail if no Kami exists.
// Let's try to fetch a specific Kami ID from the debug output we saw earlier.
// Kami ID: 418670d5-37cb-495d-bc64-b2656e70304d (from debugKamigotchiAPI.ts output)
// Wait, that ID looks like a UUID from Supabase, not an on-chain ID (which is uint256).
// The debug output showed: "id": "418670d5...", "kami_index": 12035.
// So on-chain ID is likely derived from index or stored.
// GetterSystem.getKamiByIndex(12035) -> returns on-chain ID.

// Let's test getKamiByIndex with a known index.
import { getKamiByIndex } from '../services/kamiService.js';

async function testFinalStats() {
    const kamiIndex = 3204; // From previous test output
    console.log(`🔍 Fetching Kami #${kamiIndex} to verify stats calculation...`);

    try {
        const kami = await getKamiByIndex(kamiIndex);
        console.log(`✅ Retrieved Kami: ${kami.name} (Level ${kami.level})`);
        
        console.log('📊 Base Stats:');
        console.log(JSON.stringify(kami.baseStats, null, 2));

        console.log('🛠️  Skills:');
        kami.skills.skills.forEach(s => {
            if (s.level > 0) {
                console.log(`   - ${s.name} (Lv.${s.level}): ${s.skillBonus} -> Final: ${JSON.stringify(s.finalSkillBonus)}`);
            }
        });

        console.log('📈 Aggregated Bonuses:');
        console.log(JSON.stringify(kami.skills.aggregatedBonuses, null, 2));

        console.log('🏁 Final Stats:');
        console.log(JSON.stringify(kami.finalStats, null, 2));

        // Manual verification
        const expectedPower = kami.baseStats.power + kami.skills.aggregatedBonuses.power;
        if (Math.abs(kami.finalStats.power - expectedPower) < 0.01) {
            console.log(`✅ Power calculation correct: ${kami.baseStats.power} + ${kami.skills.aggregatedBonuses.power} = ${kami.finalStats.power}`);
        } else {
            console.error(`❌ Power calculation INCORRECT: ${kami.baseStats.power} + ${kami.skills.aggregatedBonuses.power} != ${kami.finalStats.power}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testFinalStats();
