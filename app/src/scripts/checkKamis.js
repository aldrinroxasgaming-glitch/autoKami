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
    const accountId = BigInt(process.env.TEST_ACCOUNT_ADDRESS);
    console.log(`Checking Kamis for Account: ${accountId}`);

    const ownsKamiAddr = await getComponentAddress(COMPONENTS.OwnsKamiID.encodedID);
    console.log(`OwnsKamiID Component: ${ownsKamiAddr}`);
    
    const OwnsKami = new ethers.Contract(ownsKamiAddr, loadAbi('IDOwnsKamiComponent.json').abi, provider);

    const GETTER_SYSTEM_ADDRESS = process.env.GETTER_SYSTEM_ADDRESS || '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
    const GetterSystemABI = [
        "function getKami(uint256 id) view returns (tuple(uint256 id, uint32 index, string name, string mediaURI, tuple(tuple(int32 base, int32 shift, int32 boost, int32 sync) health, tuple(int32 base, int32 shift, int32 boost, int32 sync) power, tuple(int32 base, int32 shift, int32 boost, int32 sync) harmony, tuple(int32 base, int32 shift, int32 boost, int32 sync) violence) stats, tuple(uint32 face, uint32 hand, uint32 body, uint32 background, uint32 color) traits, string[] affinities, uint256 account, uint256 level, uint256 xp, uint32 room, string state))"
    ];
    
    const Getter = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI, provider);

    try {
        // getEntitiesWithValue(uint256 value) -> returns list of entities (Kamis) that have this value (AccountID)
        const kamis = await OwnsKami.getFunction('getEntitiesWithValue(uint256)')(accountId);
        
        if (kamis.length === 0) {
            console.log("No Kamis found.");
        } else {
            console.log(`Found ${kamis.length} Kamis:`);
            // Check first 5 only to save time/RPC calls
            for (const kamiId of kamis.slice(0, 5)) {
                try {
                    const k = await Getter.getKami(kamiId);
                    console.log(`- [${k.index}] ${k.name} | State: ${k.state} | Room: ${k.room}`);
                } catch (e) {
                    console.log(`- Kami ID: ${kamiId} (Error fetching details: ${e.message})`);
                }
            }
        }

    } catch (e) {
        console.error("Error fetching Kamis:", e.message);
    }
}

main().catch(console.error);
