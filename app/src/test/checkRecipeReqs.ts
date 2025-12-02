import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
// import components from '../../../ids/components.json'; // IDAnchorComponent is not in json

// Setup provider
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);

// ID for IDAnchorComponent = uint256(keccak256("component.id.anchor"))
const ID_ANCHOR_COMPONENT_ID = ethers.keccak256(ethers.toUtf8Bytes("component.id.anchor"));

// ID for LogicTypeComponent = uint256(keccak256("component.logictype"))
const ID_LOGIC_TYPE_COMPONENT = ethers.keccak256(ethers.toUtf8Bytes("component.logictype"));

async function getComponentAddress(componentId: string): Promise<string> {
  const componentsRegistryAddress = await world.components();
  // Use IDOwnsKamiComponent ABI as generic Registry/Component ABI
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

async function main() {
  const recipeIndex = 6;
  console.log(`\n--- Checking Requirements for Recipe ${recipeIndex} ---`);

  try {
    // 1. Calculate reqAnchor
    // genReqAnchor = keccak256(abi.encodePacked("recipe.requirement", recipeIndex))
    // Solidity: abi.encodePacked("recipe.requirement", uint32(6)) -> string + 4 bytes
    
    // Ethers packing:
    const reqAnchor = ethers.solidityPackedKeccak256(
        ['string', 'uint32'],
        ['recipe.requirement', recipeIndex]
    );
    console.log(`Req Anchor: ${reqAnchor}`);

    // 2. Get IDAnchorComponent Address
    const anchorCompAddress = await getComponentAddress(ID_ANCHOR_COMPONENT_ID);
    console.log(`IDAnchorComponent Address: ${anchorCompAddress}`);

    // 3. Query entities with this anchor
    // Use generic component ABI (getEntitiesWithValue)
    const genericCompABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
    const genericCompABI = JSON.parse(readFileSync(genericCompABIPath, 'utf-8'));
    const anchorComponent = new ethers.Contract(anchorCompAddress, genericCompABI.abi, provider);

    const requirementEntityIds = await anchorComponent.getFunction('getEntitiesWithValue(uint256)')(reqAnchor);
    console.log(`Found ${requirementEntityIds.length} requirement entities.`);

    // 4. Decode requirements
    // Requirements are 'Condition' entities. They have Type, LogicType, etc.
    // We need to inspect TypeComponent, ValueComponent, etc. for each entity.

    if (requirementEntityIds.length > 0) {
         // Get TypeComponent
         const typeCompId = ethers.keccak256(ethers.toUtf8Bytes("component.type")); // Check ids/components.json to confirm string
         // In components.json: "Type": { "id": "component.type", ... }
         const typeCompAddress = await getComponentAddress(typeCompId);
         const typeCompABIPath = join(__dirname, '../../../abi/TypeComponent.json'); // String component
         const typeCompABI = JSON.parse(readFileSync(typeCompABIPath, 'utf-8'));
         const typeComponent = new ethers.Contract(typeCompAddress, typeCompABI.abi, provider);

         // Get ValueComponent (uint256)
         const valueCompId = ethers.keccak256(ethers.toUtf8Bytes("component.value"));
         const valueCompAddress = await getComponentAddress(valueCompId);
         const valueCompABIPath = join(__dirname, '../../../abi/ValueComponent.json');
         const valueCompABI = JSON.parse(readFileSync(valueCompABIPath, 'utf-8'));
         const valueComponent = new ethers.Contract(valueCompAddress, valueCompABI.abi, provider);

         // Get IndexComponent (uint32)
         const indexCompId = ethers.keccak256(ethers.toUtf8Bytes("component.index"));
         const indexCompAddress = await getComponentAddress(indexCompId);
         const indexCompABIPath = join(__dirname, '../../../abi/IndexItemComponent.json');
         const indexCompABI = JSON.parse(readFileSync(indexCompABIPath, 'utf-8'));
         const indexComponent = new ethers.Contract(indexCompAddress, indexCompABI.abi, provider);

         // Get LogicTypeComponent (string)
         const logicTypeCompId = ethers.keccak256(ethers.toUtf8Bytes("component.logictype"));
         const logicTypeCompAddress = await getComponentAddress(logicTypeCompId);
         const logicTypeComponent = new ethers.Contract(logicTypeCompAddress, typeCompABI.abi, provider); // Use String ABI

        for (const entityId of requirementEntityIds) {
            console.log(`\nRequirement Entity: ${entityId}`);
            try {
                const typeVal = await typeComponent.getFunction('get(uint256)')(entityId);
                console.log(`   Type: ${typeVal}`);
                
                try {
                    const val = await valueComponent.getFunction('get(uint256)')(entityId);
                    console.log(`   Value (Amount): ${val}`);
                } catch(e) { console.log('   Value: (none)'); }

                try {
                    const idx = await indexComponent.getFunction('get(uint256)')(entityId);
                    console.log(`   Index (Item): ${idx}`);
                } catch(e) { console.log('   Index: (none)'); }

                try {
                    const logic = await logicTypeComponent.getFunction('get(uint256)')(entityId);
                    console.log(`   LogicType: ${logic}`);
                } catch(e) { console.log('   LogicType: (none/default 0)'); }
                
            } catch (e) {
                console.log('   Failed to get details');
            }
        }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
