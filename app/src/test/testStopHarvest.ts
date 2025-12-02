import { stopHarvestByKamiId, getHarvestIdForKami, isKamiHarvesting } from '../services/harvestService.js';

const KAMI_ID = '22195058564991210641621143843423452810734625134389298857576846466324409726701';

async function main() {
  console.log('Verifying Kami state after stop:', KAMI_ID);
  console.log('');

  // Check if harvesting
  const harvesting = await isKamiHarvesting(KAMI_ID);
  console.log('Is harvesting:', harvesting);

  // Compute harvest ID for reference
  const harvestId = getHarvestIdForKami(KAMI_ID);
  console.log('Harvest ID:', harvestId);
}

main().catch(console.error);
