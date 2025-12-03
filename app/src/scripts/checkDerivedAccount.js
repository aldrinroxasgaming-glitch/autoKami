import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const GETTER_SYSTEM_ADDRESS = process.env.GETTER_SYSTEM_ADDRESS || '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const COMPONENTS = loadIds('components.json');

if (!process.env.OPERATOR_PRIVATE_KEY) throw new Error("No Private Key");

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
// Derive Account ID from the Wallet Address
const derivedAccountId = BigInt(wallet.address);

async function getComponentAddress(encodedId) {
    const world = new ethers.Contract(WORLD_ADDRESS, loadAbi('World.json').abi, provider);
    const registryAddr = await world.components();
    const IDOwnsKamiComponent = loadAbi('IDOwnsKamiComponent.json');
    const registry = new ethers.Contract(registryAddr, IDOwnsKamiComponent.abi, provider);
    const addresses = await registry.getFunction('getEntitiesWithValue(bytes)')(encodedId);
    if (addresses.length > 0) {
        return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found: ' + encodedId);
}

async function main() {
    console.log(`Wallet Address: ${wallet.address}`);
    console.log(`Derived Account ID: ${derivedAccountId}`);

    // 1. Check Account Info
    const GetterSystemABI = [
        "function getAccount(uint256 id) view returns (tuple(uint32 index, string name, int32 currStamina, uint32 room))"
    ];
    const getter = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI, provider);
    
    try {
        const account = await getter.getAccount(derivedAccountId);
        console.log(`\nAccount Info:`);
        console.log(`- Name: ${account.name}`);
        console.log(`- Stamina: ${account.currStamina}`);
    } catch (e) {
        console.error("Error fetching account:", e.message);
    }

    // 2. Check Inventory (Slots 1004 and 1104)
    try {
        const slotsAddr = await getComponentAddress(COMPONENTS.Slots.encodedID);
        const valuesAddr = await getComponentAddress(COMPONENTS.Values.encodedID);
        
        const Slots = new ethers.Contract(slotsAddr, loadAbi('KeysComponent.json').abi, provider);
        const Values = new ethers.Contract(valuesAddr, loadAbi('ValuesComponent.json').abi, provider);

        const items = await Slots.getFunction('get(uint256)')(derivedAccountId);
        const amounts = await Values.getFunction('get(uint256)')(derivedAccountId);
        
        console.log(`\nInventory:`);
        if (items.length === 0) console.log("(Empty)");
        
        for(let i=0; i<items.length; i++) {
            const id = items[i];
            const amt = amounts[i];
            console.log(`- Item ${id}: ${amt}`);
        }

    } catch(e) {
        console.error("Inventory check error:", e.message);
    }
}

main().catch(console.error);
