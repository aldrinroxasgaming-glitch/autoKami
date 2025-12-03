import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const SYSTEMS = loadIds('systems.json');

const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, loadAbi('World.json').abi, provider);

async function getSystemAddress(encodedId) {
    const registryAddr = await world.systems();
    const IDOwnsKamiComponent = loadAbi('IDOwnsKamiComponent.json');
    const registry = new ethers.Contract(registryAddr, IDOwnsKamiComponent.abi, provider);
    const addresses = await registry.getFunction('getEntitiesWithValue(bytes)')(encodedId);
    if (addresses.length > 0) {
        return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
    }
    throw new Error('System not found: ' + encodedId);
}

async function main() {
    const craftAddr = await getSystemAddress(SYSTEMS.CraftSystem.encodedID);
    console.log(`CraftSystem Address: ${craftAddr}`);
    
    const expectedAddr = "0xd5dDd9102900cbF6277e16D3eECa9686F2531951";
    if (craftAddr === expectedAddr) {
        console.log("✅ Address MATCHES the successful transaction 'to' address.");
    } else {
        console.log("❌ Address MISMATCH. Transaction called a different contract.");
    }
}

main().catch(console.error);
