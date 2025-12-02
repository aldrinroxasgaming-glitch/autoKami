import dotenv from 'dotenv';
import { computeAccountIdFromAddress, getAccountByAddress, getAccountById } from '../services/accountService.js';
import { getOrCreateUser, getOperatorWallets } from '../services/supabaseService.js';

dotenv.config();

/**
 * Checks if the current stamina of a given user account is 100 or greater.
 *
 * @param walletAddress The wallet address of the user's account.
 * @returns A boolean indicating if currStamina >= 100.
 */
async function checkAccountStaminaStatus(walletAddress: string): Promise<boolean> {
  console.log(`\n--- Checking Stamina for Account: ${walletAddress} ---`);
  
  if (!walletAddress || !walletAddress.startsWith('0x')) {
    console.error('Error: Invalid wallet address provided.');
    return false;
  }

  try {
    const accountId = computeAccountIdFromAddress(walletAddress);
    console.log(`Computed Account ID: ${accountId}`);

    console.log('Fetching account data including stamina...');
    const accountData = await getAccountByAddress(walletAddress);

    const currentStamina = accountData.currStamina;
    console.log(`Current Stamina (currStamina): ${currentStamina}`);

    const hasEnoughStamina = currentStamina >= 100;
    console.log(`Has enough stamina (>= 100): ${hasEnoughStamina}`);
    
    console.log('--- Stamina Check Complete ---');
    return hasEnoughStamina;

  } catch (error) {
    console.error(`Error checking stamina for account ${walletAddress}:`, error);
    return false;
  }
}

/**
 * Checks if the current stamina of a given user account is 100 or greater.
 *
 * @param accountId The account ID of the user's account.
 * @returns A boolean indicating if currStamina >= 100.
 */
async function checkAccountStaminaStatusById(accountId: string): Promise<boolean> {
  console.log(`\n--- Checking Stamina for Account ID: ${accountId} ---`);

  try {
    console.log('Fetching account data including stamina...');
    const accountData = await getAccountById(accountId);

    const currentStamina = accountData.currStamina;
    console.log(`Current Stamina (currStamina): ${currentStamina}`);

    const hasEnoughStamina = currentStamina >= 100;
    console.log(`Has enough stamina (>= 100): ${hasEnoughStamina}`);
    
    console.log('--- Stamina Check Complete ---');
    return hasEnoughStamina;

  } catch (error) {
    console.error(`Error checking stamina for account ${accountId}:`, error);
    return false;
  }
}

async function main() {
  // 1. Try direct Account ID from env
  const testAccountId = process.env.TEST_ACCOUNT_ADDRESS;
  if (testAccountId) {
      console.log(`Using TEST_ACCOUNT_ADDRESS from env: ${testAccountId}`);
      await checkAccountStaminaStatusById(testAccountId);
      return;
  }

  // 2. Try Privy User ID lookup
  const privyUserId = process.env.TEST_PRIVY_USER_ID;
  if (privyUserId) {
      console.log(`\n--- Fetching account for Privy User ID: ${privyUserId} ---`);
      try {
        const user = await getOrCreateUser(privyUserId);
        console.log(`Found user in Supabase: ${user.id}`);

        const operatorWallets = await getOperatorWallets(user.id);
        if (operatorWallets.length === 0) {
          console.error(`No operator wallets found for user ${user.id}.`);
          return;
        }

        const accountId = operatorWallets[0].account_id;
        console.log(`Using Account ID from first operator wallet: ${accountId}`);
        await checkAccountStaminaStatusById(accountId);
        return;

      } catch (error) {
        console.error('Error retrieving user or operator wallet:', error);
        return;
      }
  }

  console.error('No test configuration found. Set TEST_ACCOUNT_ADDRESS or TEST_PRIVY_USER_ID in .env');
}

main();
