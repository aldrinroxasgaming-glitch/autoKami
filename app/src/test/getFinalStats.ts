import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getKamiById } from '../services/kamiService.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function showKamiStats() {
    console.log('📊 Fetching Kamigotchis from Supabase...');

    const { data: kamis, error } = await supabase
        .from('kamigotchis')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching kamis:', error);
        return;
    }

    if (!kamis || kamis.length === 0) {
        console.log('No kamigotchis found in database.');
        return;
    }

    console.log(`Found ${kamis.length} kamis. Calculating stats.\n`);

    for (const dbKami of kamis) {
        console.log(`🔍 Analyzing Kami ${dbKami.kami_name || '#' + dbKami.kami_index} (Entity: ${dbKami.kami_entity_id})`);
        
        try {
            // Fetch fresh data from on-chain to verify calculation logic
            const onChainKami = await getKamiById(dbKami.kami_entity_id);
            
            console.log(`   Level: ${onChainKami.level}`);
            console.log(`   ----------------------------------------------------------------`);
            console.log(`   | STAT      | BASE | SKILL BONUS (Total) | FINAL (Calc) | EXPECTED |`);
            console.log(`   |-----------|------|---------------------|--------------|----------|`);
            
            const stats = ['power', 'health', 'harmony', 'violence'] as const;
            
            stats.forEach(stat => {
                const base = onChainKami.baseStats[stat];
                const bonus = onChainKami.skills.aggregatedBonuses[stat];
                const final = base + bonus;
                const onChainFinal = onChainKami.finalStats[stat];
                
                const match = final === onChainFinal ? '✅' : '❌';
                
                console.log(`   | ${stat.padEnd(9)} | ${base.toString().padEnd(4)} | ${bonus.toString().padEnd(19)} | ${final.toString().padEnd(12)} | ${match.padEnd(8)} |`);
            });
            console.log(`   ----------------------------------------------------------------`);
            
            // Show breakdown of skills contributing to bonuses
            const activeSkills = onChainKami.skills.skills.filter(s => s.level > 0 && s.finalSkillBonus);
            if (activeSkills.length > 0) {
                console.log(`\n   🛠  Skill Breakdown:`);
                activeSkills.forEach(skill => {
                    const bonus = skill.finalSkillBonus;
                    if (bonus) {
                        console.log(`      - ${skill.name} (Lvl ${skill.level}): +${bonus.value} ${bonus.type}`);
                    }
                });
            } else {
                console.log(`\n   (No active skills with bonuses)`);
            }
            
            console.log('\n');

        } catch (err) {
            console.error(`   ❌ Failed to fetch on-chain data: ${err instanceof Error ? err.message : String(err)}\n`);
        }
    }
}

showKamiStats();
