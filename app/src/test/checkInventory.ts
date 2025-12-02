import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import components from '../../../ids/components.json';
import { getAccountById } from '../services/accountService.js';
import { getOrCreateUser, getOperatorWallets } from '../services/supabaseService.js';

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
        console.log(`OwnsInventory Address: ${ownsInvAddress}`);
        
        // We need to query which entities (items) are owned by this accountID
        // Using the same ABI as other Owns components
        const ownsInvABIPath = join(__dirname, '../../../abi/IDOwnsInventoryComponent.json');
        const ownsInvABI = JSON.parse(readFileSync(ownsInvABIPath, 'utf-8'));
        
        const ownsInvComponent = new ethers.Contract(ownsInvAddress, ownsInvABI.abi, provider);
        
        // Query entities with value = accountId
        const itemEntityIds = await ownsInvComponent.getFunction('getEntitiesWithValue(uint256)')(BigInt(accountId));
        
        if (itemEntityIds.length === 0) {
            console.log('❌ No items found in inventory.');
            return;
        }
        
        console.log(`Found ${itemEntityIds.length} items in inventory.`);
        
        // For each item entity, we need to find out WHAT item it is (ItemIndex) and HOW MANY (Value/Amount)
        // ItemIndex component
        const itemIndexId = (components as any).ItemIndex.encodedID;
        const itemIndexAddress = await getComponentAddress(itemIndexId);
        const itemIndexABIPath = join(__dirname, '../../../abi/IndexItemComponent.json'); // Assuming naming convention
        const itemIndexABI = JSON.parse(readFileSync(itemIndexABIPath, 'utf-8'));
        const itemIndexComponent = new ethers.Contract(itemIndexAddress, itemIndexABI.abi, provider);

        // Amount/Value component? Usually "Value" or "Amount"
        // Checking components.json, we have "Value" and "Values". Let's try Value first.
        const valueId = (components as any).Value.encodedID;
        const valueAddress = await getComponentAddress(valueId);
        const valueABIPath = join(__dirname, '../../../abi/ValueComponent.json');
        const valueABI = JSON.parse(readFileSync(valueABIPath, 'utf-8'));
        const valueComponent = new ethers.Contract(valueAddress, valueABI.abi, provider);

        for (const entityId of itemEntityIds) {
            try {
                const index = await itemIndexComponent.getFunction('get(uint256)')(entityId);
                const amount = await valueComponent.getFunction('get(uint256)')(entityId);
                console.log(`- Item Entity: ${entityId} | Index: ${index} | Amount: ${amount}`);
                
                if (index.toString() === '1004') {
                    console.log(`  ✅ FOUND PINE CONE (1004)! Amount: ${amount}`);
                }
            } catch (err) {
                console.log(`  ⚠️ Failed to fetch details for item entity ${entityId}`);
            }
        }

    } catch (error) {
        console.error('Error checking inventory:', error);
    }
}

async function main() {
  const privyUserId = 'did:privy:cmid7d60n01bnl80cvche3gf5';
  console.log(`
--- Checking Inventory for User: ${privyUserId} ---`);

  try {
    const user = await getOrCreateUser(privyUserId);
    const operatorWallets = await getOperatorWallets(user.id);
    
    for (const wallet of operatorWallets) {
        console.log(`
Profile: ${wallet.name} (${wallet.account_id})`);
        await checkInventory(wallet.account_id);
    }

  } catch (error) {
    console.error('Main error:', error);
  }
}

main();
