import { getKamiByIndex } from '../services/kamiService.js';

async function checkAffinities() {
    const kamiIndex = 3204; 
    console.log(`🔍 Checking affinities for Kami #${kamiIndex}...`);

    try {
        const kami = await getKamiByIndex(kamiIndex);
        console.log(`✅ Kami: ${kami.name}`);
        console.log(`🎨 Affinities:`, kami.affinities);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkAffinities();
