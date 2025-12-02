// Skill data from mapping/skill_tree_csv.txt
// Each skill has: Tree, Tier, Skill ID, Skill Name, Image Link, Skill Bonus

export interface SkillInfo {
  tree: string;
  tier: number;
  name: string;
  imageUrl: string;
  skillBonus: string; // Raw bonus string like "1 Power", "6% Fertility Boost"
}

// Parsed skill bonus for calculations
export interface ParsedSkillBonus {
  type: string;       // "power", "health", "harmony", "violence", "fertilityBoost", "bountyBoost", etc.
  value: number;      // Numeric value (e.g., 1, 10, 6)
  isPercent: boolean; // Whether it's a percentage
  isPerHour: boolean; // For intensity boosts like "5/hr"
}

/**
 * Parse a skill bonus string into structured data
 * Examples: "1 Power", "10 Health", "6% Fertility Boost", "5/hr Intensity Boost"
 */
export function parseSkillBonus(bonusStr: string): ParsedSkillBonus | null {
  const str = bonusStr.toLowerCase().trim();

  // Match patterns like "1 power", "10 health", "-2.5% strain", "5/hr intensity boost"
  const percentMatch = str.match(/^(-?\d+(?:\.\d+)?)\s*%\s*(.+)$/);
  const perHourMatch = str.match(/^(-?\d+(?:\.\d+)?)\/hr\s*(.+)$/);
  const flatMatch = str.match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/);
  const negativeSecMatch = str.match(/^(-?\d+)s\s+(.+)$/);

  if (percentMatch) {
    return {
      value: parseFloat(percentMatch[1]),
      type: normalizeType(percentMatch[2]),
      isPercent: true,
      isPerHour: false
    };
  }

  if (perHourMatch) {
    return {
      value: parseFloat(perHourMatch[1]),
      type: normalizeType(perHourMatch[2]),
      isPercent: false,
      isPerHour: true
    };
  }

  if (negativeSecMatch) {
    return {
      value: parseFloat(negativeSecMatch[1]),
      type: normalizeType(negativeSecMatch[2]),
      isPercent: false,
      isPerHour: false
    };
  }

  if (flatMatch) {
    return {
      value: parseFloat(flatMatch[1]),
      type: normalizeType(flatMatch[2]),
      isPercent: false,
      isPerHour: false
    };
  }

  return null;
}

function normalizeType(typeStr: string): string {
  const normalized = typeStr.toLowerCase().trim();

  // Map various names to canonical types
  const typeMap: Record<string, string> = {
    'power': 'power',
    'health': 'health',
    'harmony': 'harmony',
    'violence': 'violence',
    'fertility boost': 'fertilityBoost',
    'bounty boost': 'bountyBoost',
    'metabolism boost': 'metabolismBoost',
    'intensity boost': 'intensityBoost',
    'strain': 'strain',
    'defense shift': 'defenseShift',
    'defense ratio': 'defenseRatio',
    'salvage ratio': 'salvageRatio',
    'defense salvage ratio': 'salvageRatio', // Guardian tree salvage (Vampire, First Aid)
    'atk spoils ratio': 'atkSpoilsRatio',
    'atk threshold ratio': 'atkThresholdRatio',
    'atk threshold shift': 'atkThresholdShift',
    'standard cooldown shift': 'cooldownShift',
  };

  return typeMap[normalized] || normalized.replace(/\s+/g, '');
}

export const SKILL_REGISTRY: Record<number, SkillInfo> = {
  // Predator Tree
  111: { tree: 'Predator', tier: 1, name: 'Aggression', imageUrl: 'https://app.kamigotchi.io/assets/aggression-fPDOHm5y.png', skillBonus: '1 violence' },
  112: { tree: 'Predator', tier: 1, name: 'Grit', imageUrl: 'https://app.kamigotchi.io/assets/grit-DJICsy1S.png', skillBonus: '10 health' },
  113: { tree: 'Predator', tier: 1, name: 'Mercenary', imageUrl: 'https://app.kamigotchi.io/assets/professional-COViVpv-.png', skillBonus: '2% atk spoils ratio' },
  121: { tree: 'Predator', tier: 2, name: 'Professional', imageUrl: 'https://app.kamigotchi.io/assets/professional-COViVpv-.png', skillBonus: '5% atk threshold ratio' },
  122: { tree: 'Predator', tier: 2, name: 'Cruelty', imageUrl: 'https://app.kamigotchi.io/assets/cruelty-CMr3gSxO.png', skillBonus: '2% atk threshold shift' },
  123: { tree: 'Predator', tier: 2, name: 'Sniper', imageUrl: 'https://app.kamigotchi.io/assets/sniper-C68GIPOc.png', skillBonus: '-10s standard cooldown shift' },
  131: { tree: 'Predator', tier: 3, name: 'Warmonger', imageUrl: 'https://app.kamigotchi.io/assets/warmonger-gLeWPM0l.png', skillBonus: '3 violence' },
  132: { tree: 'Predator', tier: 3, name: 'Vampire', imageUrl: 'https://app.kamigotchi.io/assets/vampire-C03apBTT.png', skillBonus: '5% defense salvage ratio' },
  133: { tree: 'Predator', tier: 3, name: 'Bandit', imageUrl: 'https://app.kamigotchi.io/assets/bandit-DC5e9E8E.png', skillBonus: '5% atk spoils ratio' },
  141: { tree: 'Predator', tier: 4, name: 'Hungry', imageUrl: 'https://app.kamigotchi.io/assets/hungry-CczAv7Mn.png', skillBonus: '1 power' },
  142: { tree: 'Predator', tier: 4, name: 'Brutality', imageUrl: 'https://app.kamigotchi.io/assets/brutality-CD1ZRi8-.png', skillBonus: '2% atk threshold shift' },
  143: { tree: 'Predator', tier: 4, name: 'Marksman', imageUrl: 'https://app.kamigotchi.io/assets/marksman-CnrFR5j2.png', skillBonus: '-10s standard cooldown shift' },
  151: { tree: 'Predator', tier: 5, name: 'Specialist', imageUrl: 'https://app.kamigotchi.io/assets/specialist-BE8KRsyo.png', skillBonus: '5% atk threshold ratio' },
  152: { tree: 'Predator', tier: 5, name: 'First Aid', imageUrl: 'https://app.kamigotchi.io/assets/first_aid-Bp8GKv6D.png', skillBonus: '5% defense salvage ratio' },
  153: { tree: 'Predator', tier: 5, name: 'Bounty Hunter', imageUrl: 'https://app.kamigotchi.io/assets/bounty_hunter-Cq-Jn8gi.png', skillBonus: '2% atk spoils ratio' },
  161: { tree: 'Predator', tier: 6, name: 'Warlord', imageUrl: 'https://app.kamigotchi.io/assets/warlord-DJhX_l9_.png', skillBonus: '5 violence' },
  162: { tree: 'Predator', tier: 6, name: 'Lethality', imageUrl: 'https://app.kamigotchi.io/assets/lethality-CbfNws5Z.png', skillBonus: '5% atk threshold shift' },
  163: { tree: 'Predator', tier: 6, name: 'Assassin', imageUrl: 'https://app.kamigotchi.io/assets/assassin-B8NRq7tG.png', skillBonus: '-50s standard cooldown shift' },

  // Enlightened Tree
  211: { tree: 'Enlightened', tier: 1, name: 'Self Care', imageUrl: 'https://app.kamigotchi.io/assets/self_care-D4UBIQxc.png', skillBonus: '5% Metabolism Boost' },
  212: { tree: 'Enlightened', tier: 1, name: 'Cardio', imageUrl: 'https://app.kamigotchi.io/assets/cardio-Er62keJM.png', skillBonus: '10 Health' },
  213: { tree: 'Enlightened', tier: 1, name: 'Good Constitution', imageUrl: 'https://app.kamigotchi.io/assets/good_constitution-Ddtemj-m.png', skillBonus: '6% Fertility Boost' },
  221: { tree: 'Enlightened', tier: 2, name: 'Focus', imageUrl: 'https://app.kamigotchi.io/assets/focus-B3KI3eh_.png', skillBonus: '4% Bounty Boost' },
  222: { tree: 'Enlightened', tier: 2, name: 'Meditative Breathing', imageUrl: 'https://app.kamigotchi.io/assets/meditative_breathing-CfjMsZHH.png', skillBonus: '2% Defense Shift' },
  223: { tree: 'Enlightened', tier: 2, name: 'Concentration', imageUrl: 'https://app.kamigotchi.io/assets/concentration-CAw5whjV.png', skillBonus: '-2.5% Strain' },
  231: { tree: 'Enlightened', tier: 3, name: 'Sleep Hygiene', imageUrl: 'https://app.kamigotchi.io/assets/sleep_hygiene-CUJLSp2b.png', skillBonus: '15% Metabolism Boost' },
  232: { tree: 'Enlightened', tier: 3, name: 'Warmup Exercise', imageUrl: 'https://app.kamigotchi.io/assets/warmup_exercise-D8eZGXAP.png', skillBonus: '15/hr Intensity Boost' },
  233: { tree: 'Enlightened', tier: 3, name: 'Advanced Mewing', imageUrl: 'https://app.kamigotchi.io/assets/advanced_mewing-DGzEVGAI.png', skillBonus: '18% Fertility Boost' },
  241: { tree: 'Enlightened', tier: 4, name: 'Momentum', imageUrl: 'https://app.kamigotchi.io/assets/flow-C2OKOBT6.png', skillBonus: '4% Bounty Boost' },
  242: { tree: 'Enlightened', tier: 4, name: 'Therapy', imageUrl: 'https://app.kamigotchi.io/assets/therapy-WQWt9sZa.png', skillBonus: '2% Defense Shift' },
  243: { tree: 'Enlightened', tier: 4, name: 'Endurance', imageUrl: 'https://app.kamigotchi.io/assets/endurance-CXWqP2At.png', skillBonus: '-2.5% Strain' },
  251: { tree: 'Enlightened', tier: 5, name: 'Regeneration', imageUrl: 'https://app.kamigotchi.io/assets/regeneration-C6gQ7BEx.png', skillBonus: '5% Metabolism Boost' },
  252: { tree: 'Enlightened', tier: 5, name: 'Workout Routine', imageUrl: 'https://app.kamigotchi.io/assets/workout_routine-BvASzAFF.png', skillBonus: '5/hr Intensity Boost' },
  253: { tree: 'Enlightened', tier: 5, name: 'Productivity', imageUrl: 'https://app.kamigotchi.io/assets/productivity-CKnAsj6a.png', skillBonus: '6% Fertility Boost' },
  261: { tree: 'Enlightened', tier: 6, name: 'Wu Wei', imageUrl: 'https://app.kamigotchi.io/assets/wu_wei-hx-a2oM3.png', skillBonus: '20% Bounty Boost' },
  262: { tree: 'Enlightened', tier: 6, name: 'Spin Class', imageUrl: 'https://app.kamigotchi.io/assets/spin_class-DIR19gmw.png', skillBonus: '50 Health' },
  263: { tree: 'Enlightened', tier: 6, name: 'Immortality', imageUrl: 'https://app.kamigotchi.io/assets/immortality-Cr_v7lMf.png', skillBonus: '-12.5% Strain' },

  // Guardian Tree
  311: { tree: 'Guardian', tier: 1, name: 'Defensiveness', imageUrl: 'https://app.kamigotchi.io/assets/defensiveness-D5FYByVw.png', skillBonus: '1 Harmony' },
  312: { tree: 'Guardian', tier: 1, name: 'Toughness', imageUrl: 'https://app.kamigotchi.io/assets/toughness-COmOt8mG.png', skillBonus: '10 Health' },
  313: { tree: 'Guardian', tier: 1, name: 'Patience', imageUrl: 'https://app.kamigotchi.io/assets/patience-CBM-U_zG.png', skillBonus: '5/hr Intensity Boost' },
  321: { tree: 'Guardian', tier: 2, name: 'Meticulous', imageUrl: 'https://app.kamigotchi.io/assets/meticulous-B2voXcv-.png', skillBonus: '-5% Defense Ratio' },
  322: { tree: 'Guardian', tier: 2, name: 'Vigor', imageUrl: 'https://app.kamigotchi.io/assets/vigor-B-vN7zvw.png', skillBonus: '10 Health' },
  323: { tree: 'Guardian', tier: 2, name: 'Armor', imageUrl: 'https://app.kamigotchi.io/assets/armor-CUvog5WW.png', skillBonus: '-2% Defense Shift' },
  331: { tree: 'Guardian', tier: 3, name: 'Anxiety', imageUrl: 'https://app.kamigotchi.io/assets/anxiety-gxJSodNe.png', skillBonus: '3 Harmony' },
  332: { tree: 'Guardian', tier: 3, name: 'Die Hard', imageUrl: 'https://app.kamigotchi.io/assets/die_hard-CX6aRnfs.png', skillBonus: '-7.5% Strain' },
  333: { tree: 'Guardian', tier: 3, name: 'Loyalty', imageUrl: 'https://app.kamigotchi.io/assets/loyalty-C77abdrH.png', skillBonus: '15/hr Intensity Boost' },
  341: { tree: 'Guardian', tier: 4, name: 'Flawless', imageUrl: 'https://app.kamigotchi.io/assets/flawless-DfLk6FQG.png', skillBonus: '-5% Defense Ratio' },
  342: { tree: 'Guardian', tier: 4, name: 'Dedication', imageUrl: 'https://app.kamigotchi.io/assets/dedication-DUHrdgTg.png', skillBonus: '5/hr Intensity Boost' },
  343: { tree: 'Guardian', tier: 4, name: 'Shielding', imageUrl: 'https://app.kamigotchi.io/assets/shielding-CDSUhOC3.png', skillBonus: '-2% Defense Shift' },
  351: { tree: 'Guardian', tier: 5, name: 'Powerhouse', imageUrl: 'https://app.kamigotchi.io/assets/powerhouse-BZVLJCN7.png', skillBonus: '1 Violence' },
  352: { tree: 'Guardian', tier: 5, name: 'Hefty', imageUrl: 'https://app.kamigotchi.io/assets/heft-DfTbHiyB.png', skillBonus: '10 Health' },
  353: { tree: 'Guardian', tier: 5, name: 'Fortress', imageUrl: 'https://app.kamigotchi.io/assets/fortress-DzBl0Apq.png', skillBonus: '-2% Defense Shift' },
  361: { tree: 'Guardian', tier: 6, name: 'Neurosis', imageUrl: 'https://app.kamigotchi.io/assets/neurosis-BgJhhd47.png', skillBonus: '5 Harmony' },
  362: { tree: 'Guardian', tier: 6, name: 'Undying', imageUrl: 'https://app.kamigotchi.io/assets/undying-BRjBD67J.png', skillBonus: '-12.5% Strain' },
  363: { tree: 'Guardian', tier: 6, name: 'Obsession', imageUrl: 'https://app.kamigotchi.io/assets/obsession-CAoq-OcT.png', skillBonus: '25/hr Intensity Boost' },

  // Harvester Tree
  411: { tree: 'Harvester', tier: 1, name: 'Acquisitiveness', imageUrl: 'https://app.kamigotchi.io/assets/acquisitiveness-BEUA9MGW.png', skillBonus: '1 Power' },
  412: { tree: 'Harvester', tier: 1, name: 'Mogging', imageUrl: 'https://app.kamigotchi.io/assets/mogging-GXrkIEcL.png', skillBonus: '10 Health' },
  413: { tree: 'Harvester', tier: 1, name: 'Greed', imageUrl: 'https://app.kamigotchi.io/assets/greed-DlvUiNSi.png', skillBonus: '4% Bounty Boost' },
  421: { tree: 'Harvester', tier: 2, name: 'Wide Portfolio', imageUrl: 'https://app.kamigotchi.io/assets/wide_portfolio-DW-tj0Ia.png', skillBonus: '-2.5% Strain' },
  422: { tree: 'Harvester', tier: 2, name: 'Side Hustles', imageUrl: 'https://app.kamigotchi.io/assets/side_hustles-DIlNZFiI.png', skillBonus: '6% Fertility Boost' },
  423: { tree: 'Harvester', tier: 2, name: 'Hedging', imageUrl: 'https://app.kamigotchi.io/assets/hedging-oTyDdUU-.png', skillBonus: '2% Salvage Ratio' },
  431: { tree: 'Harvester', tier: 3, name: 'Technical Analysis', imageUrl: 'https://app.kamigotchi.io/assets/technical_analysis-lQjW8G8X.png', skillBonus: '3 Power' },
  432: { tree: 'Harvester', tier: 3, name: 'Daylight Savings', imageUrl: 'https://app.kamigotchi.io/assets/daylight_savings-CncZZKoy.png', skillBonus: '-5% Defense Shift' },
  433: { tree: 'Harvester', tier: 3, name: 'Leverage', imageUrl: 'https://app.kamigotchi.io/assets/leverage-BD4ScNtv.png', skillBonus: '10% Bounty Boost' },
  441: { tree: 'Harvester', tier: 4, name: 'Opportunist', imageUrl: 'https://app.kamigotchi.io/assets/opportunist-2RqC8NsY.png', skillBonus: '1 Violence' },
  442: { tree: 'Harvester', tier: 4, name: 'Trading Courses', imageUrl: 'https://app.kamigotchi.io/assets/trading_courses-mL6aZB2L.png', skillBonus: '6% Fertility Boost' },
  443: { tree: 'Harvester', tier: 4, name: 'Index Funds', imageUrl: 'https://app.kamigotchi.io/assets/index_funds-CmTD13P-.png', skillBonus: '1 Harmony' },
  451: { tree: 'Harvester', tier: 5, name: 'Time in the Market', imageUrl: 'https://app.kamigotchi.io/assets/time_in_the_market-BFVOi9S4.png', skillBonus: '-2.5% Strain' },
  452: { tree: 'Harvester', tier: 5, name: 'Looping', imageUrl: 'https://app.kamigotchi.io/assets/looping-DUup9RPr.png', skillBonus: '10 Health' },
  453: { tree: 'Harvester', tier: 5, name: 'Stimulants', imageUrl: 'https://app.kamigotchi.io/assets/stimulants-oWNJ2i1l.png', skillBonus: '4% Bounty Boost' },
  461: { tree: 'Harvester', tier: 6, name: 'Intelligent Investor', imageUrl: 'https://app.kamigotchi.io/assets/intelligent_investor-DQxqfgre.png', skillBonus: '5 Power' },
  462: { tree: 'Harvester', tier: 6, name: 'Paid Groupchat', imageUrl: 'https://app.kamigotchi.io/assets/paid_groupchat-C4Te42Ja.png', skillBonus: '30% Fertility Boost' },
  463: { tree: 'Harvester', tier: 6, name: 'Coward', imageUrl: 'https://app.kamigotchi.io/assets/coward-DBPNiNvD.png', skillBonus: '10% Salvage Ratio' },
};

/**
 * Get skill info by skill index
 */
export function getSkillInfo(skillIndex: number): SkillInfo | null {
  return SKILL_REGISTRY[skillIndex] || null;
}
