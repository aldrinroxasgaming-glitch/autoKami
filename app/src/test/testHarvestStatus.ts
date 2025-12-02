import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';

// HolderID component
const HOLDER_ID_COMPONENT = '0x5bc28889d745caef68975e56a733199d93efb3f5ae8e4606262ab97c83f72648';

// Kami ID to test (from user's example - currently harvesting)
const TEST_KAMI_ID = '9639785690494750116341684271521621900048685002204936685582180514823658666880';

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Load GetterSystem ABI
  const getterABIPath = join(__dirname, '../../../abi/GetterSystem.json');
  const GetterSystemABI = JSON.parse(readFileSync(getterABIPath, 'utf-8'));
  const getterSystem = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI.abi, provider);

  // Load World ABI
  const worldABIPath = join(__dirname, '../../../abi/World.json');
  const WorldABI = JSON.parse(readFileSync(worldABIPath, 'utf-8'));
  const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);

  // Load component ABI
  const componentABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
  const componentABI = JSON.parse(readFileSync(componentABIPath, 'utf-8'));

  // First verify Kami state from GetterSystem
  console.log('Step 0: Verify Kami state from GetterSystem...');
  const kamiIdBigInt = BigInt(TEST_KAMI_ID);
  try {
    const kamiData = await getterSystem.getKami(kamiIdBigInt);
    console.log('Kami name:', kamiData.name);
    console.log('Kami state:', kamiData.state);
    console.log('Kami room:', Number(kamiData.room));
  } catch (e: any) {
    console.error('Failed to get Kami data:', e.message);
  }

  console.log('\n--- Now trying to find harvest ID ---\n');

  console.log('Step 1: Get components registry address...');
  const componentsRegistryAddress = await world.components();
  console.log('Components Registry Address:', componentsRegistryAddress);

  console.log('\nStep 2: Get HolderID component address from registry...');
  const componentsRegistry = new ethers.Contract(
    componentsRegistryAddress,
    componentABI.abi,
    provider
  );

  const componentAddresses = await componentsRegistry.getFunction('getEntitiesWithValue(bytes)')(HOLDER_ID_COMPONENT);
  console.log('Component addresses found:', componentAddresses.length);

  if (componentAddresses.length === 0) {
    console.error('ERROR: HolderID component not found in registry');
    return;
  }

  const entityId = BigInt(componentAddresses[0].toString());
  const holderComponentAddress = ethers.getAddress('0x' + entityId.toString(16).padStart(40, '0'));
  console.log('HolderID Component Address:', holderComponentAddress);

  console.log('\nStep 3: Query HolderID component for entities with kamiId...');
  const holderComponent = new ethers.Contract(
    holderComponentAddress,
    componentABI.abi,
    provider
  );

  console.log('Looking for entities with value:', kamiIdBigInt.toString());

  // Try uint256 query
  try {
    const entities = await holderComponent.getFunction('getEntitiesWithValue(uint256)')(kamiIdBigInt);
    console.log('Entities found (uint256 query):', entities.length);
    if (entities.length > 0) {
      console.log('Harvest Entity IDs:', entities.map((e: any) => e.toString()));
    }
  } catch (e: any) {
    console.error('uint256 query failed:', e.message);
  }

  // Try bytes query
  try {
    const encodedKamiId = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [kamiIdBigInt]);
    console.log('Encoded kamiId (bytes):', encodedKamiId);
    const entities = await holderComponent.getFunction('getEntitiesWithValue(bytes)')(encodedKamiId);
    console.log('Entities found (bytes query):', entities.length);
    if (entities.length > 0) {
      console.log('Harvest Entity IDs:', entities.map((e: any) => e.toString()));
    }
  } catch (e: any) {
    console.error('bytes query failed:', e.message);
  }

  // Debug: check has() on the kami ID itself
  console.log('\nStep 4: Debug - check has(kamiId)...');
  try {
    const hasEntity = await holderComponent.has(kamiIdBigInt);
    console.log('has(kamiId):', hasEntity);
  } catch (e: any) {
    console.log('has() check:', e.message);
  }

  // Alternative approach: Maybe the component stores different data type
  // Let's try checking the component's registered entities count or other methods
  console.log('\nStep 5: Alternative debug - check if component has any entities...');
  try {
    // Try to get any entity to see if component works at all
    const allEntities = await holderComponent.getEntities();
    console.log('Total entities in component:', allEntities.length);
    if (allEntities.length > 0 && allEntities.length < 20) {
      console.log('Sample entities:', allEntities.slice(0, 5).map((e: any) => e.toString()));
    }
  } catch (e: any) {
    console.log('getEntities() not available or failed:', e.message);
  }
}

main().catch(console.error);
