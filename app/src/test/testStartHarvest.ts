import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { startHarvest, getHarvestIdForKami, isKamiHarvesting } from '../services/harvestService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KAMI_ID = '22195058564991210641621143843423452810734625134389298857576846466324409726701';
const NODE_INDEX = 10;

const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';

// Component IDs
const OPERATOR_ADDRESS_COMPONENT = '0x8a1264e7094de803414cccf0c32d2bd50f25c909fa2415b38f065f320e4eabe6';
const ROOM_INDEX_COMPONENT = '0x3be9611062b8582cf4b9a4eafe577dbde7dcd7779a1efb46d73e212026c4b0cc';

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const operatorKey = process.env.OPERATOR_PRIVATE_KEY!;
  const operatorWallet = new ethers.Wallet(operatorKey, provider);

  // Load ABIs
  const getterABIPath = join(__dirname, '../../../abi/GetterSystem.json');
  const GetterSystemABI = JSON.parse(readFileSync(getterABIPath, 'utf-8'));
  const getterSystem = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI.abi, provider);

  const worldABIPath = join(__dirname, '../../../abi/World.json');
  const WorldABI = JSON.parse(readFileSync(worldABIPath, 'utf-8'));
  const world = new ethers.Contract(WORLD_ADDRESS, WorldABI.abi, provider);

  const componentABIPath = join(__dirname, '../../../abi/IDOwnsKamiComponent.json');
  const componentABI = JSON.parse(readFileSync(componentABIPath, 'utf-8'));

  console.log('Testing start harvest for Kami:', KAMI_ID);
  console.log('Target Node index:', NODE_INDEX);
  console.log('Operator address:', operatorWallet.address);
  console.log('');

  // Get Kami data
  console.log('Step 1: Get Kami details...');
  const kamiData = await getterSystem.getKami(BigInt(KAMI_ID));
  console.log('Kami name:', kamiData.name);
  console.log('Kami state:', kamiData.state);
  console.log('Kami room:', Number(kamiData.room));

  const accountId = kamiData.account.toString();
  console.log('Kami account ID:', accountId);

  // Check player's room
  console.log('\nStep 2: Check player room...');
  try {
    const componentsRegistry = await world.components();
    const registry = new ethers.Contract(componentsRegistry, componentABI.abi, provider);

    const roomComponentAddresses = await registry.getFunction('getEntitiesWithValue(bytes)')(ROOM_INDEX_COMPONENT);
    if (roomComponentAddresses.length > 0) {
      const roomComponentAddress = ethers.getAddress('0x' + BigInt(roomComponentAddresses[0]).toString(16).padStart(40, '0'));
      const roomComponent = new ethers.Contract(roomComponentAddress, componentABI.abi, provider);

      const hasRoom = await roomComponent.has(BigInt(accountId));
      console.log('Account has room set:', hasRoom);

      if (hasRoom) {
        const roomValue = await roomComponent.getFunction('get(uint256)')(BigInt(accountId));
        console.log('Player current room:', Number(roomValue));
        console.log('Kami room:', Number(kamiData.room));
        console.log('Same room:', Number(roomValue) === Number(kamiData.room));
      }
    }
  } catch (e: any) {
    console.log('Could not check room:', e.message);
  }

  // Check if already harvesting
  console.log('\nStep 3: Check if Kami is already harvesting...');
  const harvesting = await isKamiHarvesting(KAMI_ID);
  console.log('Is harvesting:', harvesting);

  if (harvesting) {
    console.log('\nKami is already harvesting, skipping start.');
    return;
  }

  // Compute expected harvest ID
  console.log('\nStep 4: Compute expected harvest ID...');
  const harvestId = getHarvestIdForKami(KAMI_ID);
  console.log('Expected Harvest ID:', harvestId);

  // Try to start
  const targetNode = Number(kamiData.room);
  console.log(`\nStep 5: Attempting to start harvest at node ${targetNode}...`);
  const result = await startHarvest({
    kamiId: KAMI_ID,
    nodeIndex: targetNode
  });

  console.log('\nResult:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
