import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const GETTER_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const abiPath = path.resolve(__dirname, '../abi/GetterSystem.json');
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    const getter = new ethers.Contract(GETTER_ADDRESS, abi.abi, provider);
    
    const KAMI_INDEX = 625;
    console.log(`Checking Raw Stats for Kami #${KAMI_INDEX}...`);

    try {
        const kami = await getter.getKamiByIndex(KAMI_INDEX);
        
        console.log('\n--- RAW VALUES (BigInt) ---');
        console.log('Health Base:', kami.stats.health.base.toString());
        console.log('Health Sync:', kami.stats.health.sync.toString());
        console.log('Health Shift:', kami.stats.health.shift.toString());
        console.log('Health Boost:', kami.stats.health.boost.toString());
        
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

main();
