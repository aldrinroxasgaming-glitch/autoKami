import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import components from '../../../ids/components.json';
import { getOrCreateUser, getOperatorWallets, decryptPrivateKey } from '../services/supabaseService.js';
import { executeSystemCall } from '../services/transactionService.js';

// Setup provider
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);

// Need to look up component addresses
async function getComponentAddress(componentId: string): Promise<string> {
  const componentsRegistryAddress = await world.components();
  const componentsRegistryABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
  const componentsRegistryABI = JSON.parse(readFileSync(componentsRegistryABIPath, 'utf-8'));
  
  const componentsRegistry = new ethers.Contract(
    componentsRegistryAddress,
    componentsRegistryABI.abi,
    provider
  );

  const componentAddresses = await componentsRegistry.getFunction('getEntitiesWithValue(bytes)')(componentId);
  if (componentAddresses.length === 0) throw new Error(`Component not found: ${componentId}`);
  
  const entityId = BigInt(componentAddresses[0].toString());
  return ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
}

async function checkInventory(accountId: string) {
    try {
        console.log(`Checking inventory for Account: ${accountId}`);
        
        // Get OwnsInventory Component
        const ownsInvId = (components as any).OwnsInvID.encodedID;
        const ownsInvAddress = await getComponentAddress(ownsInvId);
        
        // We need to query which entities (items) are owned by this accountID
        const ownsInvABIPath = join(__dirname, '../../../abi/IDOwnsInventoryComponent.json');
        const ownsInvABI = JSON.parse(readFileSync(ownsInvABIPath, 'utf-8'));
        
        const ownsInvComponent = new ethers.Contract(ownsInvAddress, ownsInvABI.abi, provider);
        
        // Query entities with value = accountId
        const itemEntityIds = await ownsInvComponent.getFunction('getEntitiesWithValue(uint256)')(BigInt(accountId));
        
        if (itemEntityIds.length === 0) {
            console.log('❌ No items found in inventory.');
            return { hasItems: false };
        }
        
        // ItemIndex component
        const itemIndexId = (components as any).ItemIndex.encodedID;
        const itemIndexAddress = await getComponentAddress(itemIndexId);
        const itemIndexABIPath = join(__dirname, '../../../abi/IndexItemComponent.json'); 
        const itemIndexABI = JSON.parse(readFileSync(itemIndexABIPath, 'utf-8'));
        const itemIndexComponent = new ethers.Contract(itemIndexAddress, itemIndexABI.abi, provider);

        // Value component
        const valueId = (components as any).Value.encodedID;
        const valueAddress = await getComponentAddress(valueId);
        const valueABIPath = join(__dirname, '../../../abi/ValueComponent.json');
        const valueABI = JSON.parse(readFileSync(valueABIPath, 'utf-8'));
        const valueComponent = new ethers.Contract(valueAddress, valueABI.abi, provider);

        let pineConeAmount = 0;
        let hasTool = false;

        for (const entityId of itemEntityIds) {
            try {
                const index = await itemIndexComponent.getFunction('get(uint256)')(entityId);
                const amount = await valueComponent.getFunction('get(uint256)')(entityId);
                
                if (index.toString() === '1004') {
                    pineConeAmount = Number(amount);
                }
                if (index.toString() === '23100') {
                    hasTool = true;
                }
            } catch (err) {
                // ignore errors for individual items
            }
        }

        console.log(`   Pine Cones (1004): ${pineConeAmount}`);
        console.log(`   Tool (23100): ${hasTool ? '✅' : '❌'}`);

        return { hasItems: pineConeAmount > 0, pineConeAmount, hasTool };

    } catch (error) {
        console.error('Error checking inventory:', error);
        return { hasItems: false };
    }
}

async function craft(wallet: any, recipeIndex: number, amount: number, assignerID: any) {
    try {
        // Decrypt private key
        const privateKey = decryptPrivateKey(wallet.encrypted_private_key);
        
        // Execute craft
        console.log(`   Executing craft transaction...`);
        const tx = await executeSystemCall({
            systemId: 'system.craft',
            typedParams: [
                assignerID,        
                recipeIndex,       
                amount             
            ],
            privateKey: privateKey
        });

        console.log(`   Transaction submitted: ${tx.hash}`);
        console.log(`   Waiting for confirmation...`);
        await tx.wait();
        console.log(`   ✅ Craft successful!`);
        return true;

    } catch (err) {
        // console.error(`   ❌ Error crafting:`, err); 
        console.log('   ❌ Craft failed (reverted)');
        return false;
    }
}

async function main() {
  const privyUserId = 'did:privy:cmid7d60n01bnl80cvche3gf5';
  console.log(`
--- Comprehensive Crafting Test for User: ${privyUserId} ---`);

  try {
    const user = await getOrCreateUser(privyUserId);
    const operatorWallets = await getOperatorWallets(user.id);
    
    for (const wallet of operatorWallets) {
        console.log(`
Profile: ${wallet.name} (${wallet.account_id})`);
        
        // 1. Check Inventory
        const inv = await checkInventory(wallet.account_id);
        
        if ((inv.pineConeAmount || 0) > 0 && inv.hasTool) {
             console.log('   Inventory check passed. Attempting craft...');
             
             // 2. Try with Account ID
             console.log('   [Attempt 1] Using Account ID as Assigner ID');
             await craft(wallet, 6, 1, wallet.account_id);

             // 3. Try with 0 (common for self-actions)
             console.log('   [Attempt 2] Using 0 as Assigner ID');
             await craft(wallet, 6, 1, 0);

             // 4. Try with Address (as uint256)
             console.log('   [Attempt 3] Using Wallet Address (as uint256) as Assigner ID');
             const addressAsUint = BigInt(wallet.wallet_address); // wallet_address is likely the account ID string already in database, but let's check
             // In Supabase, wallet_address is stored as '0x...' usually, but sometimes as ID?
             // Let's convert the stored wallet_address string to BigInt just in case it's 0x
             try {
                 const addrBigInt = BigInt(wallet.wallet_address); 
                 await craft(wallet, 6, 1, addrBigInt);
             } catch (e) {
                 console.log('   Skipping Attempt 3 (invalid address format)');
             }

        } else {
            console.log('   Skipping craft (missing requirements)');
        }
    }

  } catch (error) {
    console.error('Main error:', error);
  }
}

main();
