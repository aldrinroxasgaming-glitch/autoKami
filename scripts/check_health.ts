import { getKamiByIndex } from '../app/src/services/kamiService.js';

async function main() {
    // Get command line arg for kami index, default to 625
    const KAMI_INDEX = process.argv[2] ? parseInt(process.argv[2]) : 625;
    console.log(`Checking Health for Kami #${KAMI_INDEX}...`);

    try {
        const kami = await getKamiByIndex(KAMI_INDEX);
        
        console.log('\n--- KAMI HEALTH REPORT ---');
        console.log(`ID: ${kami.id}`);
        console.log(`Name: ${kami.name}`);
        
        console.log(`\n[Health Stats]`);
        console.log(`Current Health (Base+Shift): ${kami.currentHealth}`);
        console.log(`Raw Base: ${kami.stats.health.base}`);
        console.log(`Raw Shift: ${kami.stats.health.shift}`);
        console.log(`Raw Sync Health: ${kami.stats.health.sync}`);
        console.log(`Skill Bonus Health: ${kami.skills.aggregatedBonuses.health}`);
        console.log(`Final Max Health: ${kami.finalStats.health}`);
        
        console.log(`\n[Status]`);
        if (kami.currentHealth < kami.finalStats.health) {
             console.log(`Status: DAMAGED (${kami.finalStats.health - kami.currentHealth} HP below max)`);
        } else {
             console.log(`Status: HEALTHY`);
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

main();
