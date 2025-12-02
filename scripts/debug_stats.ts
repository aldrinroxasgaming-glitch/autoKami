import { getKamiByIndex } from '../app/src/services/kamiService.js';

async function main() {
    const KAMI_INDEX = 625;
    console.log(`Checking Detailed Stats for Kami #${KAMI_INDEX}...`);

    try {
        const kami = await getKamiByIndex(KAMI_INDEX);
        
        console.log('\n--- RAW STATS ---');
        // Note: MappedKamiData converts these to numbers, let's verify raw if possible or trust the mapping
        console.log('Health Base:', kami.stats.health.base);
        console.log('Health Sync:', kami.stats.health.sync);
        console.log('Health Shift:', kami.stats.health.shift);
        console.log('Health Boost:', kami.stats.health.boost);
        
        console.log('\n--- SKILLS ---');
        console.log('Aggregated Health Bonus:', kami.skills.aggregatedBonuses.health);
        
        console.log('\n--- CALCULATIONS ---');
        const base = kami.stats.health.base;
        const bonus = kami.skills.aggregatedBonuses.health;
        const shift = kami.stats.health.shift;
        
        const maxCalculated = base + bonus;
        const currentCalculated = maxCalculated + shift;
        
        console.log(`User Formula (Max = Base + Bonus): ${base} + ${bonus} = ${maxCalculated}`);
        console.log(`Hypothesis (Current = Max + Shift): ${maxCalculated} + (${shift}) = ${currentCalculated}`);

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

main();
