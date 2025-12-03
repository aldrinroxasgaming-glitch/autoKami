import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';

// Config from .env.example
const CONFIG = {
    RPC_URL: "https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz",
    WORLD_ADDRESS: "0x2729174c265dbBd8416C6449E0E813E88f43D0E7",
    GETTER_SYSTEM_ADDRESS: "0x12C0989A259471D89D1bA1BB95043D64DAF97c19",
    PRIVATE_KEY: "9129b31bef3ef227258b2cc8a29288ad828c0d6d6632e59dcea29788a86d37d8"
};

const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider);
const accountId = BigInt(wallet.address);

const COMPONENTS = loadIds('components.json');
const SYSTEMS = loadIds('systems.json');

async function getComponentAddress(encodedId) {
    const world = new ethers.Contract(CONFIG.WORLD_ADDRESS, loadAbi('World.json').abi, provider);
    const registryAddr = await world.components();
    const IDOwnsKamiComponent = loadAbi('IDOwnsKamiComponent.json');
    const registry = new ethers.Contract(registryAddr, IDOwnsKamiComponent.abi, provider);
    const addresses = await registry.getFunction('getEntitiesWithValue(bytes)')(encodedId);
    if (addresses.length > 0) {
        return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found: ' + encodedId);
}

async function getSystemAddress(encodedId) {
    const world = new ethers.Contract(CONFIG.WORLD_ADDRESS, loadAbi('World.json').abi, provider);
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
    console.log(`Operator Address: ${wallet.address}`);
    
    // Target Account (Yuuki)
    const targetAccountId = BigInt("24912831289181620569001742271490162307555423067"); 
    console.log(`Target Account ID: ${targetAccountId}`);

    // 1. Check Stamina via Getter
    const GetterSystemABI = [
        "function getAccount(uint256 id) view returns (tuple(uint32 index, string name, int32 currStamina, uint32 room))"
    ];
    const getter = new ethers.Contract(CONFIG.GETTER_SYSTEM_ADDRESS, GetterSystemABI, provider);
    
    try {
        const account = await getter.getAccount(targetAccountId);
        console.log(`\nAccount Info:`);
        console.log(`- Name: ${account.name}`);
        console.log(`- Stamina: ${account.currStamina}`);
        
        if (account.currStamina < 10) {
            console.warn("⚠️ Warning: Not enough stamina (need 10)");
        }
    } catch (e) {
        console.error("Error fetching account:", e.message);
    }

    // 2. Craft
    console.log(`\nAttempting to Craft Recipe #6 via Raw Transaction (0x5c817c70)...`);
    try {
        const craftAddr = await getSystemAddress(SYSTEMS.CraftSystem.encodedID);
        
        // Construct Raw Data manually to match the successful tx format
        // Selector: 0x5c817c70
        // Arg1 (Recipe Index 6): 32 bytes
        // Arg2 (Amount 1): 32 bytes
        const selector = "0x5c817c70";
        const arg1 = "0000000000000000000000000000000000000000000000000000000000000006";
        const arg2 = "0000000000000000000000000000000000000000000000000000000000000001";
        const data = selector + arg1 + arg2;

        console.log("Tx Data:", data);
        console.log("To Address:", craftAddr);

        // Simulate using call first
        try {
            await provider.call({
                to: craftAddr,
                data: data,
                from: wallet.address,
                gasLimit: 3000000
            });
            console.log("✅ Simulation Successful!");
        } catch (e) {
            console.error("❌ Simulation Failed:", e.message);
            // We proceed to try sending anyway in case simulation is strict
        }

        const tx = await wallet.sendTransaction({
            to: craftAddr,
            data: data,
            gasLimit: 3000000
        });
        
        console.log(`Tx Hash: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("🎉 Crafting Successful!");
        } else {
            console.error("❌ Transaction Reverted");
        }

    } catch(e) {
        console.error("Script Error:", e.message);
    }
}

main().catch(console.error);
