import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import WorldABI from '../../../abi/World.json';
import HarvestStartSystemABI from '../../../abi/HarvestStartSystem.json';
import HarvestStopSystemABI from '../../../abi/HarvestStopSystem.json';
import HarvestCollectSystemABI from '../../../abi/HarvestCollectSystem.json';
import systems from '../../../ids/systems.json';
import components from '../../../ids/components.json';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORLD_ADDRESS = process.env.WORLD_ADDRESS || '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const GETTER_SYSTEM_ADDRESS = process.env.GETTER_SYSTEM_ADDRESS || '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const DEFAULT_OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);

// System IDs from the code snippet
const HARVEST_START_SYSTEM_ID = '0x889a517f187477a50ab38d2b87c697dd40cb524faa7a48fe1ce59620bb8d6203';
const HARVEST_STOP_SYSTEM_ID = '0x2ce6930d030ce775e29350c0200df30632bef67d7b0c72df15cbe7b4be763912';
const HARVEST_COLLECT_SYSTEM_ID = '0x8493c9d75b152fc52d462c6389b227634dbf7dab0534ecb90e9cc85ad4e98145';


import DamageComponentABI from '../../../abi/DamageComponent.json';

// ... (existing imports)

// Component IDs
const OWNS_HARVEST_COMPONENT_ID = '0x5bc28889d745caef68975e56a733199d93efb3f5ae8e4606262ab97c83f72648';
const DAMAGE_COMPONENT_ID = '0x...'; // Need to find this ID from components.json or assume logic

// I need to look up the DamageComponent ID from components.json first.
// I'll assume I can import it.

// ...

// StartTime event topic (used to extract harvest ID from tx receipt)
const START_TIME_TOPIC = '0x9ee42634d52dbd5a24ad226010389fb7306af59bdaec5e20547162dd896dacad';

export interface KamiState {
  isHarvesting: boolean;
  currentHealth: number;
  maxHealth: number; // Note: This might need skill calculation for *true* max, but we get raw sync here
}

/**
 * Get Kami state (status + health)
 */
export async function getKamiState(kamiId: string | bigint): Promise<KamiState> {
  try {
    const GetterSystemABI = JSON.parse(
      readFileSync(join(__dirname, '../../../abi/GetterSystem.json'), 'utf-8')
    );
    const getterSystem = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI.abi, provider);

    const kamiIdBigInt = typeof kamiId === 'string' ? BigInt(kamiId) : kamiId;
    const kamiData = await getterSystem.getKami(kamiIdBigInt);

    const isHarvesting = kamiData.state === 'HARVESTING';
    const currentHealth = Number(kamiData.stats.health.base);
    const maxHealthRaw = Number(kamiData.stats.health.sync); // Base max from sync, skills add to this

    return { isHarvesting, currentHealth, maxHealth: maxHealthRaw };
  } catch (error) {
    console.error('Error getting Kami state:', error);
    throw error;
  }
}

export interface HarvestStartParams {
  kamiId: string | bigint;
  nodeIndex: number;
  privateKey?: string; // Optional - uses OPERATOR_PRIVATE_KEY from env if not provided
  taxerId?: string; // Optional taxer ID (default: 0x0)
  taxAmount?: string; // Optional tax amount (default: 0x0)
}

export interface HarvestStopParams {
  harvestId: string | bigint;
  privateKey?: string; // Optional - uses OPERATOR_PRIVATE_KEY from env if not provided
}

export interface HarvestCollectParams {
  harvestId: string | bigint;
  privateKey?: string; // Optional - uses OPERATOR_PRIVATE_KEY from env if not provided
}

/**
 * Get the operator private key from params or environment
 */
function getPrivateKey(providedKey?: string): string {
  const key = providedKey || DEFAULT_OPERATOR_KEY;
  if (!key) {
    throw new Error('No private key provided and OPERATOR_PRIVATE_KEY not set in environment');
  }
  return key;
}

export interface HarvestResult {
  success: boolean;
  txHash?: string;
  harvestId?: string;
  error?: string;
}

/**
 * Get system address from World contract by system ID
 */
async function getSystemAddress(systemId: string): Promise<string> {
  const systemsRegistryAddress = await world.systems();

  // Load registry ABI
  const registryABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
  const registryABI = JSON.parse(readFileSync(registryABIPath, 'utf-8'));

  const systemsRegistry = new ethers.Contract(
    systemsRegistryAddress,
    registryABI.abi,
    provider
  );

  const systemAddresses = await systemsRegistry.getFunction('getEntitiesWithValue(bytes)')(systemId);

  if (systemAddresses.length === 0) {
    throw new Error(`System address not found for ID: ${systemId}`);
  }

  const entityId = BigInt(systemAddresses[0].toString());
  return ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
}

/**
 * Get component address from registry
 */
async function getComponentAddress(componentId: string): Promise<string> {
  const componentsRegistryAddress = await world.components();

  const registryABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
  const registryABI = JSON.parse(readFileSync(registryABIPath, 'utf-8'));

  const componentsRegistry = new ethers.Contract(
    componentsRegistryAddress,
    registryABI.abi,
    provider
  );

  const componentAddresses = await componentsRegistry.getFunction('getEntitiesWithValue(bytes)')(componentId);

  if (componentAddresses.length === 0) {
    throw new Error(`Component not found: ${componentId}`);
  }

  const entityId = BigInt(componentAddresses[0].toString());
  return ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
}

/**
 * Get harvest entity ID for a Kami
 *
 * The harvest entity ID is deterministically computed as:
 * uint256(keccak256(abi.encodePacked("harvest", kamiID)))
 *
 * This allows us to derive the harvest ID directly from the Kami ID
 * without needing to query an indexer or store state.
 */
export function getHarvestIdForKami(kamiId: string | bigint): string {
  const kamiIdBigInt = typeof kamiId === 'string' ? BigInt(kamiId) : kamiId;

  // Encode "harvest" as bytes and kamiID as uint256, then concatenate (abi.encodePacked)
  // In Solidity: keccak256(abi.encodePacked("harvest", kamiID))
  // abi.encodePacked for string + uint256:
  // - string "harvest" = 0x68617276657374 (7 bytes)
  // - uint256 kamiID = 32 bytes (padded)

  const harvestPrefix = ethers.toUtf8Bytes("harvest");
  const kamiIdBytes = ethers.zeroPadValue(ethers.toBeHex(kamiIdBigInt), 32);

  // Concatenate bytes
  const packed = ethers.concat([harvestPrefix, kamiIdBytes]);

  // Compute keccak256 hash
  const hash = ethers.keccak256(packed);

  // Convert to uint256 (BigInt)
  const harvestId = BigInt(hash);

  return harvestId.toString();
}

/**
 * Check if a Kami is currently harvesting by checking its state
 * This is an alternative to looking up the harvest ID
 */
export async function isKamiHarvesting(kamiId: string | bigint): Promise<boolean> {
  try {
    const GetterSystemABI = JSON.parse(
      readFileSync(join(__dirname, '../../../abi/GetterSystem.json'), 'utf-8')
    );
    const getterSystem = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI.abi, provider);

    const kamiIdBigInt = typeof kamiId === 'string' ? BigInt(kamiId) : kamiId;
    const kamiData = await getterSystem.getKami(kamiIdBigInt);

    return kamiData.state === 'HARVESTING';
  } catch (error) {
    console.error('Error checking Kami harvesting state:', error);
    return false;
  }
}

/**
 * Extract harvest ID from transaction receipt logs
 */
export async function getHarvestIdFromReceipt(txHash: string): Promise<string | null> {
  try {
    const receipt = await provider.waitForTransaction(txHash);

    if (!receipt || !receipt.logs) {
      return null;
    }

    for (const log of receipt.logs) {
      if (log.topics && log.topics[1] === START_TIME_TOPIC) {
        // topics[3] is the harvest ID
        const harvestId = log.topics[3];
        return harvestId;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting harvest ID from receipt:', error);
    return null;
  }
}

/**
 * Start harvesting for a Kami at a specific node
 *
 * @param params - HarvestStartParams containing kamiId, nodeIndex, and privateKey
 * @returns HarvestResult with txHash and harvestId on success
 */
export async function startHarvest(params: HarvestStartParams): Promise<HarvestResult> {
  try {
    const { kamiId, nodeIndex, privateKey, taxerId = '0x0', taxAmount = '0x0' } = params;

    // Create wallet using provided key or env default
    const wallet = new ethers.Wallet(getPrivateKey(privateKey), provider);

    // Get system address
    const systemAddress = await getSystemAddress(HARVEST_START_SYSTEM_ID);

    // Create contract instance
    const harvestStartSystem = new ethers.Contract(
      systemAddress,
      HarvestStartSystemABI.abi,
      wallet
    );

    // Convert parameters
    const kamiIdBigInt = typeof kamiId === 'string' ? BigInt(kamiId) : kamiId;

    // Execute transaction with 4 params:
    // executeTyped(uint256 kamiID, uint32 nodeIndex, uint256 taxerID, uint256 taxAmt)
    // Use zero addresses for taxerID and taxAmt as in reference code
    const tx = await harvestStartSystem.executeTyped(
      kamiIdBigInt,
      nodeIndex,
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000'
    );

    const receipt = await tx.wait();

    // Try to extract harvest ID from logs
    let harvestId: string | undefined;
    if (receipt && receipt.logs) {
      for (const log of receipt.logs) {
        if (log.topics && log.topics[1] === START_TIME_TOPIC) {
          harvestId = log.topics[3];
          break;
        }
      }
    }

    return {
      success: true,
      txHash: tx.hash,
      harvestId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Stop harvesting and collect output
 *
 * @param params - HarvestStopParams containing harvestId and privateKey
 * @returns HarvestResult with txHash on success
 */
export async function stopHarvest(params: HarvestStopParams): Promise<HarvestResult> {
  try {
    const { harvestId, privateKey } = params;

    // Create wallet using provided key or env default
    const wallet = new ethers.Wallet(getPrivateKey(privateKey), provider);

    // Get system address
    const systemAddress = await getSystemAddress(HARVEST_STOP_SYSTEM_ID);

    // Create contract instance
    const harvestStopSystem = new ethers.Contract(
      systemAddress,
      HarvestStopSystemABI.abi,
      wallet
    );

    // Convert harvest ID
    const harvestIdBigInt = typeof harvestId === 'string' ? BigInt(harvestId) : harvestId;

    // Execute transaction
    const tx = await harvestStopSystem.executeTyped(harvestIdBigInt);

    await tx.wait();

    return {
      success: true,
      txHash: tx.hash
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Collect harvest output without stopping
 *
 * @param params - HarvestCollectParams containing harvestId and privateKey
 * @returns HarvestResult with txHash on success
 */
export async function collectHarvest(params: HarvestCollectParams): Promise<HarvestResult> {
  try {
    const { harvestId, privateKey } = params;

    // Create wallet using provided key or env default
    const wallet = new ethers.Wallet(getPrivateKey(privateKey), provider);

    // Get system address
    const systemAddress = await getSystemAddress(HARVEST_COLLECT_SYSTEM_ID);

    // Create contract instance
    const harvestCollectSystem = new ethers.Contract(
      systemAddress,
      HarvestCollectSystemABI.abi,
      wallet
    );

    // Convert harvest ID
    const harvestIdBigInt = typeof harvestId === 'string' ? BigInt(harvestId) : harvestId;

    // Execute transaction
    const tx = await harvestCollectSystem.executeTyped(harvestIdBigInt);

    await tx.wait();

    return {
      success: true,
      txHash: tx.hash
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Convenience function: Stop harvest for a Kami by Kami ID
 * Computes the harvest entity ID from keccak256(abi.encodePacked("harvest", kamiID))
 */
export async function stopHarvestByKamiId(
  kamiId: string | bigint,
  privateKey?: string
): Promise<HarvestResult> {
  // Compute harvest ID deterministically from Kami ID
  const harvestId = getHarvestIdForKami(kamiId);

  return stopHarvest({ harvestId, privateKey });
}

/**
 * Convenience function: Collect harvest for a Kami by Kami ID
 * Computes the harvest entity ID from keccak256(abi.encodePacked("harvest", kamiID))
 */
export async function collectHarvestByKamiId(
  kamiId: string | bigint,
  privateKey?: string
): Promise<HarvestResult> {
  // Compute harvest ID deterministically from Kami ID
  const harvestId = getHarvestIdForKami(kamiId);

  return collectHarvest({ harvestId, privateKey });
}
