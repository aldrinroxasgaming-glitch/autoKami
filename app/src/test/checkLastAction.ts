import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import GetterSystemABI from '../../../abi/GetterSystem.json';
import TimeLastComponentABI from '../../../abi/TimeLastComponent.json';
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
    IDOwnsKamiComponentABI.abi,
    provider
  );

  const componentAddresses = await componentsRegistry.getFunction('getEntitiesWithValue(bytes)')(componentId);

  if (componentAddresses.length === 0) {
    throw new Error(`Component not found in registry: ${componentId}`);
  }

  const entityId = BigInt(componentAddresses[0].toString());
  return ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
}

async function main() {
  try {
    console.log('Checking Last Action Time...');

    console.log('Using Kami at index 8191.');
    const kamiIndexToTest = 8191;
    let kamiId = null;

    try {
      const kamiData = await getterSystem.getKamiByIndex(kamiIndexToTest);
      kamiId = BigInt(kamiData.id.toString());
      console.log(`Found Kami at index ${kamiIndexToTest} with ID: ${kamiId}`);
    } catch (e) {
      console.log(`Kami at index ${kamiIndexToTest} not found. Please ensure it exists on the chain.`);
      return;
    }

    // 2. Get TimeLastAction Component Address
    const lastActionId = (components as any).LastTime.encodedID;
    console.log(`Looking up address for LastActionTime component (${lastActionId})...`);
    const componentAddress = await getComponentAddress(lastActionId);
    console.log(`TimeLastActionComponent Address: ${componentAddress}`);

    // 3. Instantiate Component Contract
    const lastActionComponent = new ethers.Contract(
      componentAddress,
      TimeLastComponentABI.abi,
      provider
    );

    // 4. Get Last Action Time
    console.log(`Querying get(${kamiId}) on TimeLastActionComponent...`);
    const lastActionTimestamp = await lastActionComponent.getFunction('get(uint256)')(kamiId);
    
    const timestamp = Number(lastActionTimestamp);
    
    console.log('---------------------------------------------------');
    console.log(`Last Action Timestamp (Raw): ${lastActionTimestamp}`);
    
    if (timestamp > 0) {
        const date = new Date(timestamp * 1000);
        console.log(`Last Action Date: ${date.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`);
        console.log(`Current Time: ${new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`);
        const minutesSinceLastAction = Math.floor((Date.now() / 1000 - timestamp) / 60);
        console.log(`Time Since Last Action: ${minutesSinceLastAction} minutes`);
    } else {
        console.log('No last action recorded (0).');
    }
    console.log('---------------------------------------------------');

  } catch (error) {
    console.error('Error:', error);
  }
}

main();