import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getAccountById, getKamisByAccountId } from '../services/accountService.js';
import { getOrCreateUser, getOperatorWallets, decryptPrivateKey } from '../services/supabaseService.js';
import { executeSystemCall } from '../services/transactionService.js';

dotenv.config();

async function main() {
  const privyUserId = 'did:privy:cmid7d60n01bnl80cvche3gf5';
  const recipeIndex = 6;
  const amount = 10;
  
  console.log(`\n--- Crafting Item (Recipe ${recipeIndex}, Amt ${amount}) for All Accounts of User: ${privyUserId} ---`);

  try {
    // 1. Get User
    const user = await getOrCreateUser(privyUserId);
    console.log(`Found User in Supabase: ${user.id}`);

    // 2. Get Operator Wallets (Profiles)
    const operatorWallets = await getOperatorWallets(user.id);
    
    if (operatorWallets.length === 0) {
      console.log('No operator wallets found for this user.');
      return;
    }

    console.log(`Found ${operatorWallets.length} operator wallets.`);

    // 3. Execute Craft for each Account ID
    for (const wallet of operatorWallets) {
        console.log(`\n--------------------------------------------------`);
        console.log(`Profile Name: ${wallet.name}`);
        console.log(`Account ID: ${wallet.account_id}`);
        
        try {
            // Check Stamina
            const accountData = await getAccountById(wallet.account_id);
            if (accountData.currStamina < 100) {
                console.log(`⚠️ Insufficient stamina (${accountData.currStamina} < 100). Skipping.`);
                continue;
            }
            console.log(`Stamina OK: ${accountData.currStamina}`);

            // Decrypt private key
            const privateKey = decryptPrivateKey(wallet.encrypted_private_key);
            
            // Execute craft
            console.log(`Executing craft transaction (2 arguments)...`);
            const tx = await executeSystemCall({
                systemId: 'system.craft',
                typedParams: [
                    recipeIndex,       // index (uint32)
                    amount             // amt (uint256)
                ],
                privateKey: privateKey
            });

            console.log(`Transaction submitted: ${tx.hash}`);
            console.log(`Waiting for confirmation...`);
            await tx.wait();
            console.log(`✅ Craft successful!`);

        } catch (err) {
            console.error(`❌ Error crafting for account ${wallet.account_id}:`, err);
        }
    }
    console.log(`\n--------------------------------------------------`);

  } catch (error) {
    console.error('Error executing test:', error);
  }
}

main();
