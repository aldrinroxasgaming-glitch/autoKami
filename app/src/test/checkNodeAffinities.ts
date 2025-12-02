import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import components from '../../../ids/components.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);

// Note typo in component ID string from investigation: "component.affiinity"
const AFFINITY_COMPONENT_ID = ethers.keccak256(ethers.toUtf8Bytes("component.affiinity"));
const NODE_INDEX_COMPONENT_ID = ethers.keccak256(ethers.toUtf8Bytes("component.index.node"));

// Function to get component address
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
  if (componentAddresses.length === 0) {
      console.log(`⚠️ Component not found for ID: ${componentId}`);
      return ethers.ZeroAddress;
  }
  
  const entityId = BigInt(componentAddresses[0].toString());
  return ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
}

// Generate Node Entity ID: hash("registry.node", index)
function genNodeID(index: number): bigint {
    return ethers.solidityPackedKeccak256(
        ['string', 'uint32'],
        ['registry.node', index]
    ) as unknown as bigint; 
}

async function main() {
  console.log(`\n--- Checking Node Affinities ---`);
  console.log(`Calculated Affinity ID: ${AFFINITY_COMPONENT_ID}`);
  console.log(`Expected (json):        0xf3e296372a5e5be810386b4a0416d479397a474fb9d4f37f1eed4c72bf11af6d`);

  try {
    // 1. Get Component Addresses
    const affAddress = await getComponentAddress(AFFINITY_COMPONENT_ID);
    const nodeIndexAddress = await getComponentAddress(NODE_INDEX_COMPONENT_ID);
    
    console.log(`AffinityComponent Address: ${affAddress}`);
    console.log(`IndexNodeComponent Address: ${nodeIndexAddress}`);

    if (affAddress === ethers.ZeroAddress) return;

    // 2. Load ABIs
    const stringCompABIPath = join(__dirname, '../../../abi/NameComponent.json');
    const stringCompABI = JSON.parse(readFileSync(stringCompABIPath, 'utf-8'));
    const affinityComponent = new ethers.Contract(affAddress, stringCompABI.abi, provider);

    const uint32CompABIPath = join(__dirname, '../../../abi/IndexItemComponent.json');
    const uint32CompABI = JSON.parse(readFileSync(uint32CompABIPath, 'utf-8'));
    const nodeIndexComponent = new ethers.Contract(nodeIndexAddress, uint32CompABI.abi, provider);

    // 3. Check nodes
    const testIndices = [1, 2, 9, 30];

    for (const idx of testIndices) {
        const nodeId = genNodeID(idx);
        console.log(`\nNode Index: ${idx}`);
        console.log(`Entity ID: ${nodeId}`);
        
        // Check existence first
        try {
            const storedIndex = await nodeIndexComponent.getFunction('get(uint256)')(nodeId);
            console.log(`✅ Node Exists (IndexNode value: ${storedIndex})`);
        } catch (e) {
            console.log(`⚠️ Node does not exist or IndexNode not set.`);
        }

        // Check Affinity
        try {
            const affinity = await affinityComponent.getFunction('get(uint256)')(nodeId);
            console.log(`✅ On-Chain Affinity: "${affinity}"`);
        } catch (e) {
            console.log(`❌ Failed to fetch affinity`);
        }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
