import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const COMPONENTS = loadIds('components.json');

const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, loadAbi('World.json').abi, provider);

async function getComponentAddress(encodedId) {
    const registryAddress = await world.components();
    const IDOwnsKamiComponent = loadAbi('IDOwnsKamiComponent.json');
    const registry = new ethers.Contract(registryAddress, IDOwnsKamiComponent.abi, provider);
    const addresses = await registry.getFunction('getEntitiesWithValue(bytes)')(encodedId);
    if (addresses.length > 0) {
        return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found for ' + encodedId);
}

async function main() {
    console.log(`Checking Item #1004...`);

    // Get Name Component
    const nameAddr = await getComponentAddress(COMPONENTS.Name.encodedID);
    console.log(`Name Component: ${nameAddr}`);
    const NameComp = new ethers.Contract(nameAddr, loadAbi('NameComponent.json').abi, provider);

    try {
        const name = await NameComp.getFunction('get(uint256)')(1004);
        console.log(`Item #1004 Name: ${name}`);
    } catch (e) {
        console.log("Could not get name for 1004:", e.message);
    }
    
    try {
        const name = await NameComp.getFunction('get(uint256)')(1104);
        console.log(`Item #1104 Name: ${name}`);
    } catch (e) {
        console.log("Could not get name for 1104:", e.message);
    }
}

main().catch(console.error);
