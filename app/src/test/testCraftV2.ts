import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAccountById } from '../services/accountService.js';
import { getOrCreateUser, getOperatorWallets, decryptPrivateKey } from '../services/supabaseService.js';
import { getSystemAddress } from '../services/transactionService.js'; // Helper to get address

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// We need to bypass executeSystemCall because it uses the old ABI map
// We will construct the contract manually with the V2 ABI
async function executeCraftV2(wallet: any, recipeIndex: number, amount: number) {
    const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const privateKey = decryptPrivateKey(wallet.encrypted_private_key);
    const signer = new ethers.Wallet(privateKey, provider);

    // Get System Address (we can reuse the logic or hardcode/lookup)
    // 'system.craft'
    const systemId = 'system.craft';
    const systemAddress = await getSystemAddress(systemId, provider);
    
    console.log(`   System Address: ${systemAddress}`);

    // Load V2 ABI
    const abiPath = join(__dirname, '../../../abi/CraftSystemV2.json');
    const abi = JSON.parse(readFileSync(abiPath, 'utf-8'));
    
    const contract = new ethers.Contract(systemAddress, abi.abi, signer);

    // Execute
    console.log(`   Calling executeTyped(${recipeIndex}, ${amount})...`);
    
    // Explicitly call the 2-arg function
    // Note: We pass overrides for gasLimit to be safe
    const tx = await contract.executeTyped(recipeIndex, amount, { gasLimit: 2000000 });
    return tx;
}

async function main() {
  const privyUserId = 'did:privy:cmid7d60n01bnl80cvche3gf5';
  const recipeIndex = 6;
  const amount = 10;
  
  console.log(`\n--- Crafting Item (Recipe ${recipeIndex}, Amt ${amount}) with V2 ABI (2 args) ---`);

  try {
    const user = await getOrCreateUser(privyUserId);
    const operatorWallets = await getOperatorWallets(user.id);
    
    for (const wallet of operatorWallets) {
        console.log(`\nProfile: ${wallet.name} (${wallet.account_id})`);
        
        try {
            // Check Stamina
            const accountData = await getAccountById(wallet.account_id);
            if (accountData.currStamina < 100) {
                console.log(`⚠️ Insufficient stamina (${accountData.currStamina} < 100). Skipping.`);
                continue;
            }
            console.log(`Stamina OK: ${accountData.currStamina}`);

            const tx = await executeCraftV2(wallet, recipeIndex, amount);
            console.log(`Transaction submitted: ${tx.hash}`);
            console.log(`Waiting for confirmation...`);
            const receipt = await tx.wait();
            console.log(`✅ Craft successful! Block: ${receipt.blockNumber}`);

        } catch (err) {
            console.error(`❌ Error crafting:`, err);
        }
    }

  } catch (error) {
    console.error('Error executing test:', error);
  }
}

main();
