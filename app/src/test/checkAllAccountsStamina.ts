import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getAccountById } from '../services/accountService.js';
import { getOrCreateUser, getOperatorWallets } from '../services/supabaseService.js';

dotenv.config();

async function main() {
  const privyUserId = 'did:privy:cmid7d60n01bnl80cvche3gf5';
  
  console.log(`\n--- Checking Stamina for All Accounts of User: ${privyUserId} ---`);

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

    // 3. Check Stamina for each Account ID
    for (const wallet of operatorWallets) {
        console.log(`\n--------------------------------------------------`);
        console.log(`Profile Name: ${wallet.name}`);
        console.log(`Account ID: ${wallet.account_id}`);
        
        try {
            const accountData = await getAccountById(wallet.account_id);
            const currentStamina = accountData.currStamina;
            
            console.log(`Current Stamina: ${currentStamina}`);
            console.log(`Status: ${currentStamina >= 100 ? '✅ SUFFICIENT (>=100)' : '❌ LOW (<100)'}`);
        } catch (err) {
            console.error(`Error fetching data for account ${wallet.account_id}:`, err);
        }
    }
    console.log(`\n--------------------------------------------------`);

  } catch (error) {
    console.error('Error executing test:', error);
  }
}

main();
