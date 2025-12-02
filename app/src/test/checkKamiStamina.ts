import { ethers } from 'ethers';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import GetterSystemABI from '../../../abi/GetterSystem.json';
import StaminaComponentABI from '../../../abi/StaminaComponent.json';
import IDOwnsKamiComponentABI from '../../../abi/IDOwnsKamiComponent.json';
import components from '../../../ids/components.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);
const getterSystem = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI.abi, provider);

async function getComponentAddress(componentId: string): Promise<string> {
  const componentsRegistryAddress = await world.components();
  
  const componentsRegistry = new ethers.Contract(
    componentsRegistryAddress,
    IDOwnsKamiComponentABI.abi, // Using a generic component ABI for `getEntitiesWithValue`
    provider
  );

  const componentAddresses = await componentsRegistry.getFunction('getEntitiesWithValue(bytes)')(componentId);

  if (componentAddresses.length === 0) {
    throw new Error(`Component not found in registry for ID: ${componentId}`);
  }

  const entityId = BigInt(componentAddresses[0].toString());
  return ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
}

async function checkKamiStamina(kamiIndex: number): Promise<boolean> {
  console.log(`\n--- Checking Stamina for Kami Index: ${kamiIndex} ---`);
  let kamiEntityId: bigint | null = null;

  try {
    const kamiData = await getterSystem.getKamiByIndex(kamiIndex);
    kamiEntityId = BigInt(kamiData.id.toString());
    console.log(`Found Kami at index ${kamiIndex} with Entity ID: ${kamiEntityId}`);
  } catch (e) {
    console.error(`Error: Kami at index ${kamiIndex} not found. Please ensure it exists on the chain.`);
    return false;
  }

  try {
    const staminaComponentId = (components as any).Stamina.encodedID;
    console.log(`Looking up address for Stamina component (${staminaComponentId})...`);
    const staminaComponentAddress = await getComponentAddress(staminaComponentId);
    console.log(`StaminaComponent Address: ${staminaComponentAddress}`);

    const staminaComponent = new ethers.Contract(
      staminaComponentAddress,
      StaminaComponentABI.abi,
      provider
    );

    console.log(`Querying get(uint256) for Stamina with Kami Entity ID: ${kamiEntityId}...`);
    const currentStamina = await staminaComponent.getFunction('get(uint256)')(kamiEntityId);
    
    const staminaValue = Number(currentStamina);
    console.log(`Current Stamina (Raw): ${currentStamina}`);
    console.log(`Current Stamina: ${staminaValue}`);

    const result = staminaValue >= 100;
    console.log(`Stamina >= 100: ${result}`);
    console.log('--- Stamina Check Complete ---');
    return result;

  } catch (error) {
    console.error(`Error checking Stamina for Kami Entity ID ${kamiEntityId}:`, error);
    return false;
  }
}

async function main() {
    const kamiIndexToTest = 8191; // Using the same Kami from previous tests
    const hasEnoughStamina = await checkKamiStamina(kamiIndexToTest);
    console.log(`\nFinal result for Kami Index ${kamiIndexToTest}: Has enough stamina (>=100)? ${hasEnoughStamina}`);
}

main();
