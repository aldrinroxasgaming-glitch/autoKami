import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getOrCreateUser, getOperatorWallets } from '../services/supabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, [
    {
        "inputs": [],
        "name": "components",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
], provider);

async function getComponentAddress(componentId: string): Promise<string> {
  const componentsRegistryAddress = await world.components();
  const genericCompABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
  const genericCompABI = JSON.parse(readFileSync(genericCompABIPath, 'utf-8'));
  
  const componentsRegistry = new ethers.Contract(
    componentsRegistryAddress,
    genericCompABI.abi,
    provider
  );

  const componentAddresses = await componentsRegistry.getFunction('getEntitiesWithValue(bytes)')(componentId);
  if (componentAddresses.length === 0) throw new Error(`Component not found: ${componentId}`);
  
  const entityId = BigInt(componentAddresses[0].toString());
  return ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
}

async function main() {
  const privyUserId = 'did:privy:cmid7d60n01bnl80cvche3gf5';
  console.log(`\n--- Checking Operator Authorization ---`);

  try {
    const user = await getOrCreateUser(privyUserId);
    const operatorWallets = await getOperatorWallets(user.id);
    
    // Get AddressOperatorComponent
    // "OperatorAddress": { "id": "component.address.operator", ... }
    const opCompId = ethers.keccak256(ethers.toUtf8Bytes("component.address.operator"));
    const opCompAddress = await getComponentAddress(opCompId);
    console.log(`AddressOperatorComponent: ${opCompAddress}`);

    // Use AddressComponent ABI
    const addrCompABIPath = join(__dirname, '../../../abi/AddressComponent.json');
    const addrCompABI = JSON.parse(readFileSync(addrCompABIPath, 'utf-8'));
    const opComponent = new ethers.Contract(opCompAddress, addrCompABI.abi, provider);

    for (const wallet of operatorWallets) {
        console.log(`\nProfile: ${wallet.name}`);
        console.log(`Account ID: ${wallet.account_id}`);
        console.log(`Signer Address: ${wallet.wallet_address}`); // The address in DB

        // Check who is the operator for this Account ID
        try {
            const authorizedOp = await opComponent.getFunction('get(uint256)')(BigInt(wallet.account_id));
            console.log(`On-Chain Authorized Operator: ${authorizedOp}`);
            
            if (authorizedOp.toLowerCase() === wallet.wallet_address.toLowerCase()) {
                console.log(`✅ MATCH: Wallet is authorized.`);
            } else {
                console.log(`❌ MISMATCH: Wallet is NOT authorized.`);
            }
        } catch (e) {
            console.log(`⚠️ Failed to fetch operator for account (Account may not exist or no operator set)`);
        }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
