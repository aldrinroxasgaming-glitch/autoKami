import { getKamiByIndex, calculateAllHarvestingStats } from '../app/src/services/kamiService.ts';

async function run() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: npx tsx scripts/testKamiSkills.ts <kamiIndex>');
    process.exit(1);
  }
  const kamiIndex = parseInt(arg, 10);
  try {
    console.log(`Fetching Kami #${kamiIndex}...`);
    const kami = await getKamiByIndex(kamiIndex);

    console.log('\n=== KAMI DATA ===');
    console.log(`Name: ${kami.name}`);
    console.log(`Level: ${kami.level}`);

    console.log('\n=== BASE STATS ===');
    console.log(JSON.stringify(kami.baseStats, null, 2));

    console.log('\n=== FINAL STATS (with skill bonuses) ===');
    console.log(JSON.stringify(kami.finalStats, null, 2));

    console.log('\n=== TRAITS ===');
    console.log(`Body: ${kami.traits.body?.name} (${kami.traits.body?.type})`);
    console.log(`Hands: ${kami.traits.hand?.name} (${kami.traits.hand?.type})`);
    console.log(`Affinities: ${kami.affinities.join(', ')}`);

    console.log('\n=== SKILLS ===');
    console.log(`Total Points Used: ${kami.skills.totalPointsUsed}`);
    console.log(`Unlocked Tiers: ${kami.skills.unlockedTiers.join(', ')}`);

    console.log('\nSkill Breakdown:');
    for (const skill of kami.skills.skills) {
      console.log(`  - ${skill.name} (Lv ${skill.level}): ${skill.skillBonus}`);
      if (skill.finalSkillBonus) {
        const fb = skill.finalSkillBonus;
        const suffix = fb.isPercent ? '%' : (fb.isPerHour ? '/hr' : '');
        console.log(`    → Final: ${fb.value}${suffix} ${fb.type}`);
      }
    }

    console.log('\n=== AGGREGATED SKILL BONUSES ===');
    console.log(JSON.stringify(kami.skills.aggregatedBonuses, null, 2));

    console.log('\n=== HARVESTING STATS (per node type @ 1hr) ===');
    const harvestStats = calculateAllHarvestingStats(kami);
    for (const [nodeType, stats] of Object.entries(harvestStats)) {
      console.log(`\n${nodeType}:`);
      console.log(`  Affinity Bonus: ${stats.affinityBonus}`);
      console.log(`  Body: ${stats.affinityBreakdown.bodyMatch} (${stats.affinityBreakdown.bodyContribution})`);
      console.log(`  Hand: ${stats.affinityBreakdown.handMatch} (${stats.affinityBreakdown.handContribution})`);
      console.log(`  Harvest Fertility: ${stats.harvestFertility}`);
      console.log(`  Intensity/hr: ${stats.intensityPerHour}`);
      console.log(`  MUSU/hr: ${stats.musuPerHour}`);
      console.log(`  Strain/hr: ${stats.strainPerHour} HP`);
      console.log(`  Recovery/hr: ${stats.recoveryPerHour} HP`);
      console.log(`  Net HP/hr: ${stats.netHpPerHour}`);
    }
  } catch (err) {
    console.error('Error fetching kami:', err);
    process.exit(2);
  }
}

run();
