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
    const targetAccount = BigInt(process.env.TEST_ACCOUNT_ADDRESS);
    const operatorAccount = BigInt(process.env.OPERATOR_PRIVATE_KEY ? new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY).address : 0);

    // 1. Get Keys and Values Component Addresses
    // LibRecipe uses these to check inputs.
    // Keys = Item Indices (uint32[])
    // Values = Item Amounts (uint256[])
    const keysAddr = await getComponentAddress(COMPONENTS.Keys.encodedID);
    const valuesAddr = await getComponentAddress(COMPONENTS.Values.encodedID);
    
    console.log(`Keys Component: ${keysAddr}`);
    console.log(`Values Component: ${valuesAddr}`);
    
    const Keys = new ethers.Contract(keysAddr, loadAbi('KeysComponent.json').abi, provider);
    const Values = new ethers.Contract(valuesAddr, loadAbi('ValuesComponent.json').abi, provider);

    const check = async (id, label) => {
        // Inventory data is stored at hash("inventory", accID)?
        // LibInventory.sol usually stores data at `accID` directly OR `hash("inventory", accID)`.
        // Let's try BOTH.
        
        const idsToCheck = [
            { id: id, desc: "Direct ID" },
            { id: ethers.solidityPackedKeccak256(["string", "uint256"], ["inventory", id]), desc: "Hash('inventory', ID)" }
        ];

        for (const checkId of idsToCheck) {
            console.log(`\nChecking ${label} [${checkId.desc}]...`);
            try {
                const items = await Keys.getFunction('get(uint256)')(checkId.id);
                const amounts = await Values.getFunction('get(uint256)')(checkId.id);
                
                if (items.length === 0) {
                    console.log("- Empty");
                } else {
                    for(let i=0; i<items.length; i++) {
                        console.log(`- Item #${items[i]}: ${amounts[i]}`);
                    }
                }
            } catch (e) {
                console.log(`- Error: ${e.message.split('(')[0]}`);
            }
        }
    };

    await check(targetAccount, "Yuuki");
}

main().catch(console.error);

