import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const GETTER_SYSTEM_ADDRESS = process.env.GETTER_SYSTEM_ADDRESS || '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const SYSTEMS = loadIds('systems.json');

const provider = new ethers.JsonRpcProvider(RPC_URL);

// Helper: Decrypt
function decrypt(ciphertext) {
    if (!process.env.ENCRYPTION_KEY) throw new Error("Missing ENCRYPTION_KEY");
    const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Helper: Get System Address
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
    const userId = process.env.TEST_PRIVY_USER_ID;
    if (!userId) throw new Error("TEST_PRIVY_USER_ID not set in .env");

    console.log(`Fetching profiles for User: ${userId}...`);

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: profiles, error } = await supabase
        .from('operator_wallets')
        .select('*')
        .eq('user_id', userId);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!profiles || profiles.length === 0) {
        console.log("No profiles found.");
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    const GetterSystemABI = [
        "function getAccount(uint256 id) view returns (tuple(uint32 index, string name, int32 currStamina, uint32 room))"
    ];
    const getter = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI, provider);
    
    const craftAddr = await getSystemAddress(SYSTEMS.CraftSystem.encodedID);
    console.log(`CraftSystem: ${craftAddr}`);

    // Raw Tx Data for craft(6, 10)
    // Selector: 0x5c817c70
    // Arg1 (6): 0...06
    // Arg2 (10): 0...0a
    const selector = "0x5c817c70";
    const arg1 = "0000000000000000000000000000000000000000000000000000000000000006";
    const arg2 = "000000000000000000000000000000000000000000000000000000000000000a";
    const txData = selector + arg1 + arg2;

    // Pre-calculate address from .env key for matching
    let envWalletAddress = "";
    if (process.env.OPERATOR_PRIVATE_KEY) {
        try {
            envWalletAddress = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY).address;
        } catch (e) {}
    }

    for (const profile of profiles) {
        console.log(`
--- Processing Profile: ${profile.name} (${profile.account_id}) ---`);
        
        let privateKey;
        
        // Try to use .env key if addresses match OR if it's the known test account (Recovery)
        if ((envWalletAddress && profile.wallet_address === envWalletAddress) || 
            (profile.account_id === '24912831289181620569001742271490162307555423067')) {
            console.log("Using OPERATOR_PRIVATE_KEY from .env (Matched ID/Address)");
            privateKey = process.env.OPERATOR_PRIVATE_KEY;
        } else {
            try {
                privateKey = decrypt(profile.encrypted_private_key);
            } catch (e) {
                console.error(`   Failed to decrypt key: ${e.message}`);
                // Skip if we can't decrypt
                continue;
            }
        }

        // Validate and fix Private Key Format
        if (privateKey && !privateKey.startsWith('0x')) {
            if (privateKey.length === 64) {
                privateKey = '0x' + privateKey;
            }
        }

        if (!privateKey || !ethers.isHexString(privateKey, 32)) {
             // Basic hex check failed
             console.error(`   Invalid private key format (Length: ${privateKey ? privateKey.length : 0})`);
             continue;
        }

        const wallet = new ethers.Wallet(privateKey, provider);
        const accountId = BigInt(profile.account_id);

        // 1. Check Stamina
        let stamina = 0;
        try {
            const account = await getter.getAccount(accountId);
            stamina = Number(account.currStamina);
            console.log(`Account: ${account.name} | Stamina: ${stamina}`);
        } catch (e) {
            console.error(`Failed to fetch account info: ${e.message}`);
            continue;
        }

        // 2. Logic
        if (stamina >= 100) {
            console.log(">> Stamina sufficient (>= 100). Crafting 10x Recipe #6...");
            
            try {
                const tx = await wallet.sendTransaction({
                    to: craftAddr,
                    data: txData,
                    gasLimit: 3000000
                });
                console.log(`   Tx Sent: ${tx.hash}`);
                const receipt = await tx.wait();
                
                if (receipt.status === 1) {
                    console.log("   ✅ Crafting Successful!");
                } else {
                    console.error("   ❌ Transaction Reverted");
                }
            } catch (e) {
                console.error(`   Crafting Error: ${e.message}`);
            }

        } else {
            console.log(`>> Stamina low (< 100). Waiting...`);
        }
    }
}

main().catch(console.error);
