import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WorldABI from '../../../abi/World.json';
import GetterSystemABI from '../../../abi/GetterSystem.json';
import TimeComponentABI from '../../../abi/TimeComponent.json';
import TimeLastComponentABI from '../../../abi/TimeLastComponent.json';
import TimeResetComponentABI from '../../../abi/TimeResetComponent.json';
import TimeStartComponentABI from '../../../abi/TimeStartComponent.json';
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

async function checkComponent(name: string, componentId: string, abi: any, kamiId: bigint) {
    try {
        console.log(`\n--- Checking ${name} (${componentId}) ---`);
        const address = await getComponentAddress(componentId);
        console.log(`Address: ${address}`);
        
        const contract = new ethers.Contract(address, abi, provider);
        
        // Try to get value using 'get(uint256)' or 'getValue(uint256)' if 'get' fails or isn't available
        // Based on ABIs, these components seem to use 'get' or 'getValue'
        let value;
        try {
             value = await contract.getFunction('get(uint256)')(kamiId);
        } catch (e) {
            try {
                 value = await contract.getFunction('getValue(uint256)')(kamiId);
            } catch (e2) {
                 console.log(`Could not fetch value for ${name}`);
                 return;
            }
        }

        const timestamp = Number(value);
        console.log(`Raw Value: ${value}`);
        
        if (timestamp > 0) {
             // Heuristic check if it looks like a timestamp (e.g. > 2020)
             // 1577836800 is 2020-01-01
             if (timestamp > 1577836800) {
                 const date = new Date(timestamp * 1000);
                 console.log(`Formatted Date: ${date.toLocaleString()}`);
                 console.log(`Seconds ago: ${Math.floor((Date.now() / 1000) - timestamp)}`);
             } else {
                 console.log('Value does not look like a recent timestamp.');
             }
        } else {
            console.log('Value is 0.');
        }

    } catch (error) {
        console.error(`Error checking ${name}:`, error);
    }
}

async function main() {
  try {
    console.log('Checking All Time Components...');

    const kamiIndexToTest = 8191;
    let kamiId = null;

    try {
      const kamiData = await getterSystem.getKamiByIndex(kamiIndexToTest);
      kamiId = BigInt(kamiData.id.toString());
      console.log(`Using Kami Index: ${kamiIndexToTest}, ID: ${kamiId}`);
    } catch (e) {
      console.log(`Kami at index ${kamiIndexToTest} not found.`);
      return;
    }

    // Time Component
    await checkComponent('Time', (components as any).Time.encodedID, TimeComponentABI.abi, kamiId);

    // TimeLast Component
    await checkComponent('TimeLast', (components as any).LastTime.encodedID, TimeLastComponentABI.abi, kamiId);
    
    // TimeReset Component
    await checkComponent('TimeReset', (components as any).ResetTime.encodedID, TimeResetComponentABI.abi, kamiId);

    // TimeStart Component
    await checkComponent('TimeStart', (components as any).StartTime.encodedID, TimeStartComponentABI.abi, kamiId);


  } catch (error) {
    console.error('Error:', error);
  }
}

main();
