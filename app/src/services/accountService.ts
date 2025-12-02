import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import { getKamiById, MappedKamiData } from './kamiService.js';
import components from '../../../ids/components.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';

// getAccount ABI (not in the ABI file, from code snippet)
const GET_ACCOUNT_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }],
    "name": "getAccount",
    "outputs": [{
      "components": [
        { "internalType": "uint32", "name": "index", "type": "uint32" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "int32", "name": "currStamina", "type": "int32" },
        { "internalType": "uint32", "name": "room", "type": "uint32" }
      ],
      "internalType": "struct AccountShape",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize provider
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Create World contract instance
const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);

// Create GetterSystem contract for getAccount
const getterSystem = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GET_ACCOUNT_ABI, provider);

/**
 * Compute account ID from wallet address
 * Account ID = uint256(address)
 */
export function computeAccountIdFromAddress(address: string): bigint {
  return BigInt(address);
}

/**
 * Get account data from GetterSystem.getAccount(accountId)
 */
async function getAccountData(accountId: bigint): Promise<{ index: number; name: string; currStamina: number; room: number }> {
  try {
    const result = await getterSystem.getAccount(accountId);
    return {
      index: Number(result.index),
      name: result.name,
      currStamina: Number(result.currStamina),
      room: Number(result.room)
    };
  } catch (error) {
    // Account may not exist
    return { index: 0, name: '', currStamina: 0, room: 0 };
  }
}

/**
 * Get all Kami entities owned by an account ID
 * Uses the IDOwnsKamiComponent to query all Kami entities
 */
export async function getKamisByAccountId(accountId: string | bigint): Promise<MappedKamiData[]> {
  try {
    const accountIdBigInt = typeof accountId === 'string' ? BigInt(accountId) : accountId;

    // Get the components registry address from World
    const componentsRegistryAddress = await world.components();

    // Get the IDOwnsKamiComponent address from the registry
    const ownsKamiComponentId = components.OwnsKamiID.encodedID;

    // Load component registry ABI
    const componentRegistryABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
    const componentRegistryABI = JSON.parse(readFileSync(componentRegistryABIPath, 'utf-8'));

    // Create components registry contract
    const componentsRegistry = new ethers.Contract(
      componentsRegistryAddress,
      componentRegistryABI.abi,
      provider
    );

    // Query the registry to get the component address
    const componentAddresses = await componentsRegistry.getFunction('getEntitiesWithValue(bytes)')(ownsKamiComponentId);

    if (componentAddresses.length === 0) {
      throw new Error('IDOwnsKamiComponent not found in registry');
    }

    // Convert first entity to address
    const entityId = BigInt(componentAddresses[0].toString());
    const ownsKamiComponentAddress = ethers.getAddress(
      '0x' + entityId.toString(16).padStart(40, '0')
    );

    // Create IDOwnsKamiComponent contract instance
    const ownsKamiComponent = new ethers.Contract(
      ownsKamiComponentAddress,
      componentRegistryABI.abi,
      provider
    );

    // Query all Kami entities with this account ID value
    const kamiEntityIds = await ownsKamiComponent.getFunction('getEntitiesWithValue(uint256)')(accountIdBigInt);

    // Convert to array of BigInt
    const entityIds: bigint[] = kamiEntityIds.map((id: any) => BigInt(id.toString()));

    if (entityIds.length === 0) {
      return [];
    }

    // Retrieve each Kami's data using GetterSystem
    const kamis: MappedKamiData[] = [];
    for (const entityId of entityIds) {
      try {
        const kami = await getKamiById(entityId);
        kamis.push(kami);
      } catch (error) {
        console.warn(`Failed to retrieve Kami ${entityId}:`, error);
      }
    }

    return kamis;
  } catch (error) {
    throw new Error(`Failed to retrieve Kamis by account ID: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export interface AccountData {
  id: string;
  address: string;
  name: string;
  roomIndex: number;
  currStamina: number;
  kamis: MappedKamiData[];
}

/**
 * Get account data by wallet address
 * Computes the account ID from the address and retrieves Kamis
 */
export async function getAccountByAddress(walletAddress: string): Promise<AccountData> {
  try {
    // Compute account ID from address
    const accountId = computeAccountIdFromAddress(walletAddress);

    // Get account info from GetterSystem
    const accountInfo = await getAccountData(accountId);

    // Get Kamis owned by this account
    const kamis = await getKamisByAccountId(accountId);

    return {
      id: accountId.toString(),
      address: walletAddress,
      name: accountInfo.name,
      roomIndex: accountInfo.room,
      currStamina: accountInfo.currStamina,
      kamis
    };
  } catch (error) {
    throw new Error(`Failed to get account by address: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get account data by account ID
 */
export async function getAccountById(accountId: string): Promise<AccountData> {
  try {
    const accountIdBigInt = BigInt(accountId);

    // Get account info from GetterSystem
    const accountInfo = await getAccountData(accountIdBigInt);

    // Get Kamis owned by this account
    const kamis = await getKamisByAccountId(accountId);

    return {
      id: accountId,
      address: '',
      name: accountInfo.name,
      roomIndex: accountInfo.room,
      currStamina: accountInfo.currStamina,
      kamis
    };
  } catch (error) {
    throw new Error(`Failed to get account by ID: ${error instanceof Error ? error.message : String(error)}`);
  }
}
