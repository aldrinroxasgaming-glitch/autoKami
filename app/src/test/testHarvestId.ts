import { ethers } from 'ethers';

// Kami ID to test (from user's example - currently harvesting)
const TEST_KAMI_ID = '9639785690494750116341684271521621900048685002204936685582180514823658666880';

function getHarvestIdForKami(kamiId: string | bigint): string {
  const kamiIdBigInt = typeof kamiId === 'string' ? BigInt(kamiId) : kamiId;

  // Encode "harvest" as bytes and kamiID as uint256, then concatenate (abi.encodePacked)
  // In Solidity: keccak256(abi.encodePacked("harvest", kamiID))
  const harvestPrefix = ethers.toUtf8Bytes("harvest");
  const kamiIdBytes = ethers.zeroPadValue(ethers.toBeHex(kamiIdBigInt), 32);

  // Concatenate bytes
  const packed = ethers.concat([harvestPrefix, kamiIdBytes]);

  console.log('Harvest prefix (hex):', ethers.hexlify(harvestPrefix));
  console.log('KamiId bytes (hex):', kamiIdBytes);
  console.log('Packed (hex):', ethers.hexlify(packed));

  // Compute keccak256 hash
  const hash = ethers.keccak256(packed);
  console.log('Hash:', hash);

  // Convert to uint256 (BigInt)
  const harvestId = BigInt(hash);

  return harvestId.toString();
}

console.log('Testing harvest ID computation...');
console.log('Kami ID:', TEST_KAMI_ID);
console.log('');

const harvestId = getHarvestIdForKami(TEST_KAMI_ID);
console.log('');
console.log('Computed Harvest ID:', harvestId);
console.log('Harvest ID (hex):', '0x' + BigInt(harvestId).toString(16));
