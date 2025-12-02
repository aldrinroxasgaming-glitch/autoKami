import { getKamiById, getKamiByIndex, MappedKamiData } from './kamiService.js';
import { getKamiSkills, KamiSkills } from './skillService.js';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import GetterSystemABI from '../../../abi/GetterSystem.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const getterSystem = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI.abi, provider);

export interface FarmingStats {
  kami: MappedKamiData;
  skills: KamiSkills;
  finalStats: {
    health: number;
    power: number;
    harmony: number;
    violence: number;
  };
  harvestOutput: {
    baseMUSUPerHour: number;
    intensityMultiplier: number;
    affinityBonus: number;
    fertilityBoost: number;
    totalMUSUPerHour: number;
    estimatedMUSU: number; // for given duration
  };
  regeneration: {
    healthRegenPerSecond: number;
    staminaRegenPerSecond: number;
    timeToFullHealth: number; // seconds
    timeToFullStamina: number; // seconds
  };
  nodeInfo?: {
    index: number;
    name: string;
    affinity: string;
  };
}

/**
 * Calculate affinity bonus based on body/hand types and node type
 * Based on KAMIGOTCHI_FORMULAS.md
 */
function calculateAffinityBonus(
  bodyType: string,
  handType: string,
  nodeType: string,
  fertilityBoost: number = 0
): number {
  let affinityBonus = 1.0; // Base

  // Body part contribution
  if (bodyType === 'NORMAL') {
    // No contribution
  } else if (bodyType === nodeType) {
    affinityBonus += 0.65 + fertilityBoost;
  } else {
    affinityBonus -= 0.25;
  }

  // Hand part contribution
  if (handType === 'NORMAL') {
    // No contribution
  } else if (handType === nodeType) {
    affinityBonus += 0.35 + fertilityBoost;
  } else {
    affinityBonus -= 0.10;
  }

  return affinityBonus;
}

/**
 * Calculate harvest output based on Kami stats and node (internal)
 */
function calculateHarvestOutputInternal(
  kami: MappedKamiData,
  skills: KamiSkills,
  nodeType: string | undefined,
  duration: number
): {
  baseMUSUPerHour: number;
  intensityMultiplier: number;
  affinityBonus: number;
  fertilityBoost: number;
  totalMUSUPerHour: number;
  estimatedMUSU: number;
} {
  // Base MUSU per hour is based on Power stat (using final power with skill bonuses)
  const finalPower = kami.stats.power.sync + skills.skillBonuses.power;
  const baseMUSUPerHour = Math.max(0, finalPower);

  // Intensity multiplier (ramps up over time)
  // Simplified: 1.0 base, increases with duration
  // In reality, this would be calculated based on actual harvest start time
  const intensityMultiplier = 1.0 + (Math.min(duration, 3600) / 3600) * 0.5; // Max 1.5x after 1 hour

  // Fertility boost from skills (Harvester and Enlightened trees)
  const fertilityBoost = skills.skillBonuses.fertilityBoost;

  // Affinity bonus calculation (includes fertility boost)
  let affinityBonus = 1.0;
  if (nodeType && kami.traits.body && kami.traits.hand) {
    const bodyType = kami.traits.body.type || 'NORMAL';
    const handType = kami.traits.hand.type || 'NORMAL';
    affinityBonus = calculateAffinityBonus(bodyType, handType, nodeType, fertilityBoost);
  }

  // Total MUSU per hour
  const totalMUSUPerHour = baseMUSUPerHour * intensityMultiplier * affinityBonus;

  // Estimated MUSU for given duration (in seconds)
  const estimatedMUSU = (totalMUSUPerHour / 3600) * duration;

  return {
    baseMUSUPerHour,
    intensityMultiplier,
    affinityBonus,
    fertilityBoost,
    totalMUSUPerHour,
    estimatedMUSU: Math.max(0, estimatedMUSU)
  };
}

/**
 * Calculate regeneration times
 */
function calculateRegeneration(kami: MappedKamiData, skills: KamiSkills): {
  healthRegenPerSecond: number;
  staminaRegenPerSecond: number;
  timeToFullHealth: number;
  timeToFullStamina: number;
} {
  // Health regeneration is based on Harmony stat (using final harmony with skill bonuses)
  const finalHarmony = kami.stats.harmony.sync + skills.skillBonuses.harmony;
  const healthRegenPerSecond = Math.max(0, finalHarmony) / 3600; // per second

  // Stamina regeneration
  // Note: Stamina is not currently in MappedKamiData, using health as proxy
  // In reality, stamina would be retrieved from StaminaComponent
  const maxStamina = 100; // Default max stamina
  const currentStamina = 100; // Would need to fetch from component
  const staminaRegenPerSecond = maxStamina / 3600; // Regenerates to full in 1 hour

  // Time to full health (using final health with skill bonuses)
  const finalMaxHealth = kami.stats.health.sync + skills.skillBonuses.health;
  const currentHealth = kami.stats.health.base;
  const healthDeficit = finalMaxHealth - currentHealth;
  const timeToFullHealth = healthDeficit > 0 && healthRegenPerSecond > 0
    ? healthDeficit / healthRegenPerSecond
    : 0;

  // Time to full stamina
  const staminaDeficit = maxStamina - currentStamina;
  const timeToFullStamina = staminaDeficit > 0 && staminaRegenPerSecond > 0
    ? staminaDeficit / staminaRegenPerSecond
    : 0;

  return {
    healthRegenPerSecond,
    staminaRegenPerSecond,
    timeToFullHealth,
    timeToFullStamina
  };
}

/**
 * Get node information if nodeIndex is provided
 */
async function getNodeInfo(nodeIndex: number | undefined): Promise<{ index: number; name: string; affinity: string } | undefined> {
  if (nodeIndex === undefined) {
    return undefined;
  }

  try {
    // Get node data from GetterSystem
    const nodeData = await getterSystem.getNode(nodeIndex);
    
    // Node data structure would need to be defined based on actual contract
    // For now, return basic info
    return {
      index: nodeIndex,
      name: `Node ${nodeIndex}`, // Would need to map from nodeNames.txt
      affinity: 'UNKNOWN' // Would need to get from node data
    };
  } catch (error) {
    console.warn(`Failed to get node info for index ${nodeIndex}:`, error);
    return undefined;
  }
}

/**
 * Get comprehensive farming stats for a Kami
 * Accepts either entity ID (bigint) or index (number)
 */
export async function getFarmingStats(
  kamiIdOrIndex: bigint | number,
  nodeIndex?: number,
  duration: number = 3600
): Promise<FarmingStats> {
  // Determine if input is an index or entity ID
  // If it's a number and less than 1e10, treat it as an index
  // Otherwise, treat it as an entity ID
  let kami: MappedKamiData;
  let kamiId: bigint;
  
  if (typeof kamiIdOrIndex === 'number' && kamiIdOrIndex < 1e10) {
    // Treat as index
    kami = await getKamiByIndex(kamiIdOrIndex);
    kamiId = BigInt(kami.id);
  } else {
    // Treat as entity ID
    kamiId = typeof kamiIdOrIndex === 'bigint' ? kamiIdOrIndex : BigInt(kamiIdOrIndex);
    kami = await getKamiById(kamiId);
  }

  // Get Kami skills
  const skills = await getKamiSkills(kamiId);

  // Calculate final stats (base + skill bonuses)
  const finalStats = {
    health: kami.stats.health.sync + skills.skillBonuses.health,
    power: kami.stats.power.sync + skills.skillBonuses.power,
    harmony: kami.stats.harmony.sync + skills.skillBonuses.harmony,
    violence: kami.stats.violence.sync + skills.skillBonuses.violence,
  };

  // Get node info if provided
  const nodeInfo = await getNodeInfo(nodeIndex);
  const nodeType = nodeInfo?.affinity;

  // Calculate harvest output (using final stats)
  const harvestOutput = calculateHarvestOutputInternal(kami, skills, nodeType, duration);

  // Calculate regeneration (using final stats)
  const regeneration = calculateRegeneration(kami, skills);

  return {
    kami,
    skills,
    finalStats,
    harvestOutput,
    regeneration,
    nodeInfo
  };
}

/**
 * Calculate harvest output for a Kami (standalone function)
 * Accepts either entity ID (bigint) or index (number)
 */
export async function calculateHarvestOutput(
  kamiIdOrIndex: bigint | number,
  nodeIndex?: number,
  duration: number = 3600
): Promise<FarmingStats['harvestOutput']> {
  const stats = await getFarmingStats(kamiIdOrIndex, nodeIndex, duration);
  return stats.harvestOutput;
}

/**
 * Calculate regeneration time for a Kami (standalone function)
 * Accepts either entity ID (bigint) or index (number)
 */
export async function calculateRegenerationTime(
  kamiIdOrIndex: bigint | number
): Promise<FarmingStats['regeneration']> {
  const stats = await getFarmingStats(kamiIdOrIndex);
  return stats.regeneration;
}

