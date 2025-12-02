import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import systems from '../../../ids/systems.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';

// Initialize provider
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Create World contract instance
const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);

export interface ExecuteSystemCallParams {
  systemId: string; // e.g., "system.harvest.start" or encoded ID
  arguments?: string[]; // bytes-encoded arguments
  typedParams?: any[]; // typed parameters for executeTyped
  privateKey: string;
}

/**
 * Get system address from World contract
 */
export async function getSystemAddress(systemId: string): Promise<string> {
  // Check if systemId is an encoded ID (starts with 0x)
  let encodedId: string;
  if (systemId.startsWith('0x')) {
    encodedId = systemId;
  } else {
    // Look up system ID in systems.json
    const systemKey = Object.keys(systems).find(
      key => (systems as any)[key].id === systemId
    );
    if (!systemKey) {
      throw new Error(`System ID not found: ${systemId}`);
    }
    encodedId = (systems as any)[systemKey].encodedID;
  }

  // Get systems registry address
  const systemsRegistryAddress = await world.systems();
  
  // Load systems registry ABI (it's a Uint256Component)
  // Load systems registry ABI (it's a Uint256Component, same as IDOwnsKamiComponent)
  const systemsRegistryABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
  const systemsRegistryABI = JSON.parse(readFileSync(systemsRegistryABIPath, 'utf-8'));
  
  const systemsRegistry = new ethers.Contract(
    systemsRegistryAddress,
    systemsRegistryABI.abi,
    provider
  );

  // Get system address using getEntitiesWithValue(bytes)
  const systemAddresses = await systemsRegistry.getFunction('getEntitiesWithValue(bytes)')(encodedId);
  
  if (systemAddresses.length === 0) {
    throw new Error(`System address not found for: ${systemId}`);
  }

  // Convert first entity to address
  const entityId = BigInt(systemAddresses[0].toString());
  return ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
}

/**
 * Load system ABI by system ID
 */
function loadSystemABI(systemId: string): any {
  // Map system IDs to ABI file names
  const systemABIMap: Record<string, string> = {
    'system.harvest.start': 'HarvestStartSystem.json',
    'system.harvest.stop': 'HarvestStopSystem.json',
    'system.harvest.collect': 'HarvestCollectSystem.json',
    'system.harvest.liquidate': 'HarvestLiquidateSystem.json',
    'system.account.register': 'AccountRegisterSystem.json',
    'system.account.move': 'AccountMoveSystem.json',
    'system.account.set.name': 'AccountSetNameSystem.json',
    'system.account.set.operator': 'AccountSetOperatorSystem.json',
    'system.kami.name': 'KamiNameSystem.json',
    'system.kami.level': 'KamiLevelSystem.json',
    'system.kami.use.item': 'KamiUseItemSystem.json',
    'system.skill.upgrade': 'SkillUpgradeSystem.json',
    'system.skill.reset': 'SkillResetSystem.json',
    'system.craft': 'CraftSystem.json',
    'system.listing.sell': 'ListingSellSystem.json',
    'system.listing.buy': 'ListingBuySystem.json',
  };

  const abiFileName = systemABIMap[systemId];
  if (!abiFileName) {
    // Try to infer from system ID
    const parts = systemId.split('.');
    const systemName = parts[parts.length - 1];
    const capitalized = systemName.charAt(0).toUpperCase() + systemName.slice(1);
    const inferredName = parts.slice(1).map((p, i) => 
      i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p
    ).join('') + 'System.json';
    
    throw new Error(`System ABI not found for: ${systemId}. Please add it to systemABIMap or use file: ${inferredName}`);
  }

  const abiPath = join(__dirname, '../../../abi', abiFileName);
  return JSON.parse(readFileSync(abiPath, 'utf-8'));
}

/**
 * Execute a system call transaction
 */
export async function executeSystemCall(params: ExecuteSystemCallParams): Promise<ethers.ContractTransactionResponse> {
  const { systemId, arguments: args, typedParams, privateKey } = params;

  // Create wallet from private key
  const wallet = new ethers.Wallet(privateKey, provider);

  // Get system address
  const systemAddress = await getSystemAddress(systemId);

  // Load system ABI
  const systemABI = loadSystemABI(systemId);

  // Create system contract instance with wallet
  const system = new ethers.Contract(systemAddress, systemABI.abi, wallet);

  // Execute transaction
  if (typedParams && typedParams.length > 0) {
    // Use executeTyped if available and typedParams provided
    if (systemABI.abi.some((fn: any) => fn.name === 'executeTyped')) {
      return await system.executeTyped(...typedParams, { gasLimit: 2000000 });
    }
  }

  // Use execute with encoded arguments
  if (args && args.length > 0) {
    // If args is provided as hex strings, use directly
    const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256'],
      [args[0]] // Assuming single uint256 argument for now
    );
    return await system.execute(encodedArgs, { gasLimit: 2000000 });
  }

  // If no arguments, try executeTyped with no params
  if (systemABI.abi.some((fn: any) => fn.name === 'executeTyped')) {
    return await system.executeTyped({ gasLimit: 2000000 });
  }

  throw new Error('Unable to determine execution method. Provide either typedParams or arguments.');
}

