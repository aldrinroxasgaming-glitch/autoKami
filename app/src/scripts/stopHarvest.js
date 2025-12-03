import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const SYSTEMS = loadIds('systems.json');

if (!process.env.OPERATOR_PRIVATE_KEY) throw new Error("No Private Key");

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);

async function getSystemAddress(systemIdEncoded) {
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

async function main() {
    const kamiId = BigInt("21529575659689268774835790168873071399688633096655808211330839068746878820203"); // Kami #9334
    console.log(`Stopping harvest for Kami ID: ${kamiId}`);

    const STOP_SYSTEM_ID = SYSTEMS.HarvestStopSystem.encodedID;
    const stopAddr = await getSystemAddress(STOP_SYSTEM_ID);
    console.log(`HarvestStopSystem: ${stopAddr}`);

    const StopSystemABI = loadAbi('HarvestStopSystem.json').abi;
    const stopSystem = new ethers.Contract(stopAddr, StopSystemABI, wallet);

    try {
        // executeTyped(uint256 entityId)
        const tx = await stopSystem.executeTyped(kamiId, { gasLimit: 2000000 });
        console.log(`Tx Hash: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("✅ Harvest Stopped! Items claimed.");
        } else {
            console.error("❌ Transaction Reverted");
        }
    } catch (e) {
        console.error("Stop Failed:", e.message);
    }
}

main().catch(console.error);
