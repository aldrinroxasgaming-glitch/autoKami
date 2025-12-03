import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';

// Load ABIs and Config dynamically
const CraftSystem = loadAbi('CraftSystem.json');
const SYSTEMS = loadIds('systems.json');

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';

// Initialize provider
const provider = new ethers.JsonRpcProvider(RPC_URL);

export interface CraftResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Helper to get system address (reused pattern)
async function getSystemAddress(systemIdEncoded: string): Promise<string> {
  const world = new ethers.Contract(WORLD_ADDRESS, loadAbi('World.json').abi, provider);
  const registryAddr = await world.systems();
  const IDOwnsKamiComponent = loadAbi('IDOwnsKamiComponent.json');
  const registry = new ethers.Contract(registryAddr, IDOwnsKamiComponent.abi, provider);
  const addresses = await registry.getFunction('getEntitiesWithValue(bytes)')(systemIdEncoded);
  if (addresses.length > 0) {
    return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
  }
  throw new Error('System not found');
}

export async function craftRecipe(
  recipeIndex: number, 
  amount: number, 
  privateKey: string
): Promise<CraftResult> {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const systemId = SYSTEMS.CraftSystem.encodedID;
    const systemAddress = await getSystemAddress(systemId);
    
    // Use Raw Transaction Construction to match known-working script
    // Selector for craft(uint32,uint256): 0x5c817c70
    const selector = "0x5c817c70";
    const arg1 = recipeIndex.toString(16).padStart(64, '0');
    const arg2 = amount.toString(16).padStart(64, '0');
    const data = selector + arg1 + arg2;

    console.log(`[Crafting] Crafting Recipe #${recipeIndex} (x${amount})`);
    console.log(`[Crafting] Target: ${systemAddress}`);
    // console.log(`[Crafting] Data: ${data}`);

    const tx = await wallet.sendTransaction({
        to: systemAddress,
        data: data,
        gasLimit: 3000000
    });

    console.log(`[Crafting] Tx submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    if (receipt && receipt.status === 1) {
        return { success: true, txHash: tx.hash };
    } else {
        return { success: false, error: 'Transaction reverted' };
    }
  } catch (error: any) {
    console.error('[Crafting] Execution failed:', error);
    return { success: false, error: error.message };
  }
}
